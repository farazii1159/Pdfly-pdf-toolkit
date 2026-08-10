import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';

import {
  PDFDocument,
  StandardFonts,
  rgb,
} from 'pdf-lib';

import {
  getSupabaseAdmin,
  getSupabaseServerClient,
  STORAGE_BUCKETS,
} from '@/lib/supabase/server';

import { getToolBySlug } from '@/lib/tools-config';

import {
  buildStoragePath,
  MAX_FILE_SIZE_BYTES,
} from '@/lib/utils';

import {
  convertDocxToPdf,
  convertHtmlToPdf,
  ConversionError,
} from '@/lib/convert';

import {
  mergePdfs,
  splitPdf,
  organizePdf,
  rotatePdf,
  watermarkPdf,
  addPageNumbers,
  imagesToPdf,
  pdfToMarkdown,
  signPdf,
  PdfToolError,
} from '@/lib/pdf-tools';

import {
  protectPdf,
  unlockPdf,
  compressPdf,
  pdfToJpgPages,
  repairPdf,
  pdfToPdfA,
  SystemToolError,
} from '@/lib/system-tools';

import { officeFileToPdf } from '@/lib/office-tools';

import {
  ocrPdf,
  OcrToolError,
} from '@/lib/ocr-tools';

export const runtime = 'nodejs';
export const maxDuration = 120;

type ProcessedResult = {
  buffer: Buffer;
  extension: string;
  contentType: string;
};

async function readFiles(
  formData: FormData
): Promise<File[]> {
  const files = formData
    .getAll('files')
    .filter(
      (file): file is File =>
        file instanceof File
    );

  for (const file of files) {
    if (file.size === 0) {
      throw new PdfToolError(
        `"${file.name}" is empty.`
      );
    }

    if (
      file.size >
      MAX_FILE_SIZE_BYTES
    ) {
      throw new PdfToolError(
        `"${file.name}" exceeds the ${
          MAX_FILE_SIZE_BYTES /
          (1024 * 1024)
        } MB limit.`
      );
    }
  }

  return files;
}

export async function POST(
  request: NextRequest
) {
  // --------------------------------------------------
  // 1. Require logged-in user
  // --------------------------------------------------

  const authClient =
    await getSupabaseServerClient();

  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) {
    return NextResponse.json(
      {
        error:
          'You must be logged in to use this tool.',
      },
      { status: 401 }
    );
  }

  // --------------------------------------------------
  // 2. Supabase Admin
  // --------------------------------------------------

  let admin;

  try {
    admin = getSupabaseAdmin();
  } catch (err) {
    console.error(
      'Supabase configuration error:',
      err
    );

    return NextResponse.json(
      {
        error:
          'Server is not configured correctly. Please contact the site owner.',
      },
      { status: 500 }
    );
  }

  let operationId: string | null = null;

  try {
    // --------------------------------------------------
    // 3. Read request
    // --------------------------------------------------

    const formData =
      await request.formData();

    const toolSlug = String(
      formData.get('tool') || ''
    );

    const tool =
      getToolBySlug(toolSlug);

    if (!tool) {
      return NextResponse.json(
        {
          error: 'Unknown tool.',
        },
        { status: 400 }
      );
    }

    if (tool.status !== 'working') {
      return NextResponse.json(
        {
          error:
            'This tool is not available yet.',
        },
        { status: 400 }
      );
    }

    const files =
      await readFiles(formData);

    if (files.length === 0) {
      return NextResponse.json(
        {
          error:
            'No file was uploaded.',
        },
        { status: 400 }
      );
    }

    const primaryFile = files[0];

    // --------------------------------------------------
    // 4. Create processing record
    // --------------------------------------------------

    const {
      data: insertedRow,
      error: insertError,
    } = await admin
      .from('file_operations')
      .insert({
        user_id: user.id,
        original_filename:
          files
            .map((file) => file.name)
            .join(', '),
        original_file_path: null,
        output_file_path: null,
        tool_name: tool.slug,
        file_size: files.reduce(
          (sum, file) =>
            sum + file.size,
          0
        ),
        status: 'processing',
      })
      .select('id')
      .single();

    if (
      insertError ||
      !insertedRow
    ) {
      console.error(
        'DB insert error:',
        insertError
      );

      return NextResponse.json(
        {
          error:
            'Failed to save operation record.',
        },
        { status: 500 }
      );
    }

    operationId =
      insertedRow.id as string;

    // --------------------------------------------------
    // 5. Process tool
    // --------------------------------------------------

    const result =
      await runTool(
        tool.slug,
        files,
        formData
      );

    // --------------------------------------------------
    // 6. Upload result
    // --------------------------------------------------

    const bucket =
      tool.slug === 'pdf-to-jpg'
        ? STORAGE_BUCKETS.IMAGES
        : STORAGE_BUCKETS.PDF;

    const storagePath =
      `${user.id}/${buildStoragePath(
        primaryFile.name,
        result.extension
      )}`;

    const {
      error: uploadError,
    } = await admin.storage
      .from(bucket)
      .upload(
        storagePath,
        result.buffer,
        {
          contentType:
            result.contentType,
          upsert: false,
        }
      );

    if (uploadError) {
      console.error(
        'Upload error:',
        uploadError
      );

      await admin
        .from('file_operations')
        .update({
          status: 'failed',
        })
        .eq(
          'id',
          operationId
        );

      return NextResponse.json(
        {
          error:
            'Failed to store the result file.',
        },
        { status: 500 }
      );
    }

    // --------------------------------------------------
    // 7. Mark operation completed
    // --------------------------------------------------

    await admin
      .from('file_operations')
      .update({
        output_file_path:
          storagePath,
        status: 'completed',
      })
      .eq(
        'id',
        operationId
      );

    // --------------------------------------------------
    // 8. Create signed download URL
    // --------------------------------------------------

    const outputName =
      buildOutputFilename(
        primaryFile.name,
        tool.slug,
        result.extension
      );

    const {
      data: signedUrlData,
      error: signedUrlError,
    } = await admin.storage
      .from(bucket)
      .createSignedUrl(
        storagePath,
        60 * 10,
        {
          download: outputName,
        }
      );

    if (
      signedUrlError ||
      !signedUrlData
    ) {
      console.error(
        'Signed URL error:',
        signedUrlError
      );

      return NextResponse.json(
        {
          error:
            'File was processed but the download link could not be generated.',
        },
        { status: 500 }
      );
    }

    // --------------------------------------------------
    // 9. Success
    // --------------------------------------------------

    return NextResponse.json({
      success: true,
      downloadUrl:
        signedUrlData.signedUrl,
      filename: outputName,
    });
  } catch (err) {
    console.error(
      'Unexpected error in /api/tools:',
      err
    );

    // --------------------------------------------------
    // Mark failed
    // --------------------------------------------------

    if (operationId) {
      const {
        error: updateError,
      } = await admin
        .from('file_operations')
        .update({
          status: 'failed',
        })
        .eq(
          'id',
          operationId
        );

      if (updateError) {
        console.error(
          'Failed to update operation status:',
          updateError
        );
      }
    }

    // --------------------------------------------------
    // Error message
    // --------------------------------------------------

    const message =
      err instanceof PdfToolError ||
      err instanceof SystemToolError ||
      err instanceof ConversionError ||
      err instanceof OcrToolError
        ? err.message
        : 'Something went wrong while processing your file. Please try again.';

    return NextResponse.json(
      {
        error: message,
      },
      { status: 500 }
    );
  }
}

// ======================================================
// TOOL PROCESSOR
// ======================================================

async function runTool(
  slug: string,
  files: File[],
  formData: FormData
): Promise<ProcessedResult> {
  const field = (
    name: string
  ) =>
    String(
      formData.get(name) || ''
    ).trim();

  switch (slug) {
    // --------------------------------------------------
    // Word → PDF
    // --------------------------------------------------

    case 'word-to-pdf': {
      const buf = Buffer.from(
        await files[0].arrayBuffer()
      );

      const pdf =
        await convertDocxToPdf(buf);

      return {
        buffer: pdf,
        extension: 'pdf',
        contentType:
          'application/pdf',
      };
    }

    // --------------------------------------------------
    // HTML → PDF
    // --------------------------------------------------

    case 'html-to-pdf': {
      const buf = Buffer.from(
        await files[0].arrayBuffer()
      );

      const pdf =
        await convertHtmlToPdf(buf);

      return {
        buffer: pdf,
        extension: 'pdf',
        contentType:
          'application/pdf',
      };
    }

    // --------------------------------------------------
    // PowerPoint → PDF
    // --------------------------------------------------

    case 'powerpoint-to-pdf': {
      const file = files[0];

      const input =
        Buffer.from(
          await file.arrayBuffer()
        );

      const pdf =
        await officeFileToPdf(
          input,
          file.name
        );

      return {
        buffer: pdf,
        extension: 'pdf',
        contentType:
          'application/pdf',
      };
    }

    // --------------------------------------------------
    // Excel → PDF
    // --------------------------------------------------

    case 'excel-to-pdf': {
      const file = files[0];

      const input =
        Buffer.from(
          await file.arrayBuffer()
        );

      const pdf =
        await officeFileToPdf(
          input,
          file.name
        );

      return {
        buffer: pdf,
        extension: 'pdf',
        contentType:
          'application/pdf',
      };
    }

    // --------------------------------------------------
    // Scan → PDF
    // --------------------------------------------------

    case 'scan-to-pdf': {
      const images =
        await Promise.all(
          files.map(
            async (file) => ({
              buffer:
                Buffer.from(
                  await file.arrayBuffer()
                ),
              mimeType:
                file.type ||
                (
                  file.name
                    .toLowerCase()
                    .endsWith('.png')
                    ? 'image/png'
                    : 'image/jpeg'
                ),
            })
          )
        );

      const pdf =
        await imagesToPdf(images);

      return {
        buffer: pdf,
        extension: 'pdf',
        contentType:
          'application/pdf',
      };
    }

    // --------------------------------------------------
    // Merge PDF
    // --------------------------------------------------

    case 'merge': {
      const buffers =
        await Promise.all(
          files.map(
            async (file) =>
              Buffer.from(
                await file.arrayBuffer()
              )
          )
        );

      const pdf =
        await mergePdfs(buffers);

      return {
        buffer: pdf,
        extension: 'pdf',
        contentType:
          'application/pdf',
      };
    }

    // --------------------------------------------------
    // Split PDF
    // --------------------------------------------------

    case 'split': {
      const buf = Buffer.from(
        await files[0].arrayBuffer()
      );

      const pdf =
        await splitPdf(
          buf,
          field('range')
        );

      return {
        buffer: pdf,
        extension: 'pdf',
        contentType:
          'application/pdf',
      };
    }

    // --------------------------------------------------
    // Organize PDF
    // --------------------------------------------------

    case 'organize': {
      const buf = Buffer.from(
        await files[0].arrayBuffer()
      );

      const pdf =
        await organizePdf(
          buf,
          field('order')
        );

      return {
        buffer: pdf,
        extension: 'pdf',
        contentType:
          'application/pdf',
      };
    }

    // --------------------------------------------------
    // Rotate PDF
    // --------------------------------------------------

    case 'rotate': {
      const buf = Buffer.from(
        await files[0].arrayBuffer()
      );

      const pdf =
        await rotatePdf(
          buf,
          parseInt(
            field('degrees') ||
              '90',
            10
          )
        );

      return {
        buffer: pdf,
        extension: 'pdf',
        contentType:
          'application/pdf',
      };
    }

    // --------------------------------------------------
    // Watermark
    // --------------------------------------------------

    case 'watermark': {
      const buf = Buffer.from(
        await files[0].arrayBuffer()
      );

      const pdf =
        await watermarkPdf(
          buf,
          field('text')
        );

      return {
        buffer: pdf,
        extension: 'pdf',
        contentType:
          'application/pdf',
      };
    }

// --------------------------------------------------
// Edit PDF
// --------------------------------------------------

case 'edit': {
  const input = Buffer.from(
    await files[0].arrayBuffer()
  );

  const text = field('text');

  if (!text) {
    throw new PdfToolError(
      'Please enter text to add to the PDF.'
    );
  }

  const pageNumber = Math.max(
    1,
    parseInt(field('page') || '1', 10)
  );

  const x = Math.max(
    0,
    Number(field('x') || '50')
  );

  const y = Math.max(
    0,
    Number(field('y') || '50')
  );

  const fontSize = Math.max(
    6,
    Math.min(
      100,
      Number(field('fontSize') || '16')
    )
  );

  const pdfDoc =
    await PDFDocument.load(input);

  const pages = pdfDoc.getPages();

  if (
    pageNumber > pages.length
  ) {
    throw new PdfToolError(
      `PDF only has ${pages.length} page${
        pages.length === 1 ? '' : 's'
      }.`
    );
  }

  const page =
    pages[pageNumber - 1];

  const font =
    await pdfDoc.embedFont(
      StandardFonts.Helvetica
    );

  page.drawText(text, {
    x,
    y,
    size: fontSize,
    font,
    color: rgb(0, 0, 0),
  });

  const output =
    await pdfDoc.save();

  return {
    buffer: Buffer.from(output),
    extension: 'pdf',
    contentType:
      'application/pdf',
  };
}

    // --------------------------------------------------
// Sign PDF
// --------------------------------------------------

case 'sign': {
  const pdfBuffer = Buffer.from(
    await files[0].arrayBuffer()
  );

  const signatureFile =
    formData.get('signature');

  if (
    !signatureFile ||
    !(signatureFile instanceof File)
  ) {
    throw new PdfToolError(
      'Please provide a signature.'
    );
  }

  if (signatureFile.size === 0) {
    throw new PdfToolError(
      'The signature file is empty.'
    );
  }

  const signatureBuffer =
    Buffer.from(
      await signatureFile.arrayBuffer()
    );

  const pageNumber = Math.max(
    1,
    parseInt(
      field('pageNumber') || '1',
      10
    )
  );

  const x = Number(
    field('x') || '50'
  );

  const y = Number(
    field('y') || '50'
  );

  const width = Number(
    field('width') || '160'
  );

  const height = Number(
    field('height') || '70'
  );

  const pdf = await signPdf(
    pdfBuffer,
    signatureBuffer,
    pageNumber,
    x,
    y,
    width,
    height
  );

  return {
    buffer: pdf,
    extension: 'pdf',
    contentType:
      'application/pdf',
    };
   }

    // --------------------------------------------------
    // Page Numbers
    // --------------------------------------------------

    case 'page-numbers': {
      const buf = Buffer.from(
        await files[0].arrayBuffer()
      );

      const position =
        (field('position') ||
          'bottom-center') as
          | 'bottom-center'
          | 'bottom-left'
          | 'bottom-right';

      const pdf =
        await addPageNumbers(
          buf,
          position
        );

      return {
        buffer: pdf,
        extension: 'pdf',
        contentType:
          'application/pdf',
      };
    }

    // --------------------------------------------------
    // Protect PDF
    // --------------------------------------------------

    case 'protect': {
      const buf = Buffer.from(
        await files[0].arrayBuffer()
      );

      const pdf =
        await protectPdf(
          buf,
          field('password')
        );

      return {
        buffer: pdf,
        extension: 'pdf',
        contentType:
          'application/pdf',
      };
    }

    // --------------------------------------------------
    // Unlock PDF
    // --------------------------------------------------

    case 'unlock': {
      const buf = Buffer.from(
        await files[0].arrayBuffer()
      );

      const pdf =
        await unlockPdf(
          buf,
          field('password')
        );

      return {
        buffer: pdf,
        extension: 'pdf',
        contentType:
          'application/pdf',
      };
    }

    // --------------------------------------------------
    // Compress PDF
    // --------------------------------------------------

    case 'compress': {
      const buf = Buffer.from(
        await files[0].arrayBuffer()
      );

      const quality =
        (field('quality') ||
          'medium') as
          | 'low'
          | 'medium'
          | 'high';

      const pdf =
        await compressPdf(
          buf,
          quality
        );

      return {
        buffer: pdf,
        extension: 'pdf',
        contentType:
          'application/pdf',
      };
    }

    // --------------------------------------------------
    // JPG → PDF
    // --------------------------------------------------

    case 'jpg-to-pdf': {
      const images =
        await Promise.all(
          files.map(
            async (file) => ({
              buffer:
                Buffer.from(
                  await file.arrayBuffer()
                ),
              mimeType:
                file.type ||
                (
                  file.name
                    .toLowerCase()
                    .endsWith('.png')
                    ? 'image/png'
                    : 'image/jpeg'
                ),
            })
          )
        );

      const pdf =
        await imagesToPdf(images);

      return {
        buffer: pdf,
        extension: 'pdf',
        contentType:
          'application/pdf',
      };
    }

    // --------------------------------------------------
    // PDF → JPG
    // --------------------------------------------------

    case 'pdf-to-jpg': {
      const buf = Buffer.from(
        await files[0].arrayBuffer()
      );

      const pages =
        await pdfToJpgPages(buf);

      const zip =
        new JSZip();

      pages.forEach(
        (page, index) => {
          zip.file(
            `page-${index + 1}.jpg`,
            page
          );
        }
      );

      const zipBuffer =
        await zip.generateAsync({
          type: 'nodebuffer',
        });

      return {
        buffer: zipBuffer,
        extension: 'zip',
        contentType:
          'application/zip',
      };
    }

    // --------------------------------------------------
    // OCR PDF
    // --------------------------------------------------

    case 'ocr': {
      const file = files[0];

      const input =
        Buffer.from(
          await file.arrayBuffer()
        );

      const language =
        field('language') ||
        'eng';

      const pdf =
        await ocrPdf(
          input,
          language
        );

      return {
        buffer: pdf,
        extension: 'pdf',
        contentType:
          'application/pdf',
      };
    }

// --------------------------------------------------
// Repair PDF
// --------------------------------------------------

   case 'repair': {
  const buf = Buffer.from(
    await files[0].arrayBuffer()
  );

  const pdf = await repairPdf(buf);

  return {
    buffer: pdf,
    extension: 'pdf',
    contentType: 'application/pdf',
     };
   }

// --------------------------------------------------
// PDF → PDF/A
// --------------------------------------------------

case 'pdf-to-pdfa': {
  const buf = Buffer.from(
    await files[0].arrayBuffer()
  );

  const pdf =
    await pdfToPdfA(buf);

  return {
    buffer: pdf,
    extension: 'pdf',
    contentType:
      'application/pdf',
    };
  }

    // --------------------------------------------------
    // PDF → Markdown
    // --------------------------------------------------

    case 'pdf-to-markdown': {
      const buf = Buffer.from(
        await files[0].arrayBuffer()
      );

      const markdown =
        await pdfToMarkdown(buf);

      return {
        buffer: markdown,
        extension: 'md',
        contentType:
          'text/markdown',
      };
    }

    // --------------------------------------------------
    // Unsupported
    // --------------------------------------------------

    default:
      throw new PdfToolError(
        'This tool is not available yet.'
      );
  }
}

// ======================================================
// OUTPUT FILENAME
// ======================================================

function buildOutputFilename(
  originalName: string,
  toolSlug: string,
  extension: string
): string {
  const base =
    originalName.replace(
      /\.[^/.]+$/,
      ''
    ) || 'file';

  return `${base}-${toolSlug}.${extension}`;
}