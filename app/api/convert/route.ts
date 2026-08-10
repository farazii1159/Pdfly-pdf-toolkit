import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, STORAGE_BUCKETS } from '@/lib/supabase/server';
import { convertDocxToPdf, ConversionError } from '@/lib/convert';
import { buildStoragePath, isDocxFile, MAX_FILE_SIZE_BYTES } from '@/lib/utils';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  let conversionId: string | null = null;
  let supabase: ReturnType<typeof getSupabaseAdmin>;

  try {
    supabase = getSupabaseAdmin();
  } catch (err) {
    console.error('Supabase configuration error:', err);
    return NextResponse.json(
      { error: 'Server is not configured correctly. Please contact the site owner.' },
      { status: 500 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file was uploaded.' }, { status: 400 });
    }

    if (!isDocxFile(file)) {
      return NextResponse.json(
        { error: 'Only .docx (Word) files are supported.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: `File is too large. Maximum size is ${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB.` },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json({ error: 'The uploaded file is empty.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // 1. Upload original DOCX to Supabase Storage
    const wordPath = buildStoragePath(file.name, 'docx');
    const { error: wordUploadError } = await supabase.storage
      .from(STORAGE_BUCKETS.WORD)
      .upload(wordPath, fileBuffer, {
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        upsert: false,
      });

    if (wordUploadError) {
      console.error('Word upload error:', wordUploadError);
      return NextResponse.json(
        { error: 'Failed to upload your file. Please try again.' },
        { status: 500 }
      );
    }

    // 2. Create a "processing" row in the database
    const { data: insertedRow, error: insertError } = await supabase
      .from('conversions')
      .insert({
        original_filename: file.name,
        original_file_path: wordPath,
        pdf_file_path: null,
        file_size: file.size,
        status: 'processing',
      })
      .select('id')
      .single();

    if (insertError || !insertedRow) {
      console.error('DB insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to save conversion record. Please try again.' },
        { status: 500 }
      );
    }

    conversionId = insertedRow.id as string;

    // 3. Convert DOCX to PDF using LibreOffice headless
    let pdfBuffer: Buffer;
    try {
      pdfBuffer = await convertDocxToPdf(fileBuffer);
    } catch (err) {
      console.error('Conversion error:', err);
      await supabase.from('conversions').update({ status: 'failed' }).eq('id', conversionId);

      const message =
        err instanceof ConversionError
          ? err.message
          : 'Something went wrong while converting your document.';
      return NextResponse.json({ error: message }, { status: 500 });
    }

    // 4. Upload generated PDF to Supabase Storage
    const pdfPath = wordPath.replace(/\.docx$/, '.pdf');
    const { error: pdfUploadError } = await supabase.storage
      .from(STORAGE_BUCKETS.PDF)
      .upload(pdfPath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (pdfUploadError) {
      console.error('PDF upload error:', pdfUploadError);
      await supabase.from('conversions').update({ status: 'failed' }).eq('id', conversionId);
      return NextResponse.json(
        { error: 'Failed to store the generated PDF. Please try again.' },
        { status: 500 }
      );
    }

    // 5. Mark conversion as completed
    const { error: updateError } = await supabase
      .from('conversions')
      .update({ pdf_file_path: pdfPath, status: 'completed' })
      .eq('id', conversionId);

    if (updateError) {
      console.error('DB update error:', updateError);
      // The files exist, so we can still let the user download — just log it.
    }

    // 6. Create a short-lived signed URL so the browser can download the PDF
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from(STORAGE_BUCKETS.PDF)
      .createSignedUrl(pdfPath, 60 * 10, {
        download: file.name.replace(/\.docx$/i, '.pdf'),
      });

    if (signedUrlError || !signedUrlData) {
      console.error('Signed URL error:', signedUrlError);
      return NextResponse.json(
        { error: 'Your PDF was created but the download link could not be generated.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      downloadUrl: signedUrlData.signedUrl,
      filename: file.name.replace(/\.docx$/i, '.pdf'),
    });
  } catch (err) {
    console.error('Unexpected error in /api/convert:', err);
    if (conversionId) {
      try {
        const admin = getSupabaseAdmin();
        await admin.from('conversions').update({ status: 'failed' }).eq('id', conversionId);
      } catch {
        /* best-effort */
      }
    }
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
