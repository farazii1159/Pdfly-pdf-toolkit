import {
  PDFDocument,
  rgb,
  StandardFonts,
  degrees,
} from 'pdf-lib';

import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export class PdfToolError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PdfToolError';
  }
}

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */

function parsePageRanges(
  input: string,
  pageCount: number
): number[] {
  const indices: number[] = [];

  const parts = input
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    throw new PdfToolError(
      'Please enter at least one page or page range.'
    );
  }

  for (const part of parts) {
    // Supports: 1-3
    const rangeMatch = part.match(/^(\d+)\s*-\s*(\d+)$/);

    if (rangeMatch) {
      const start = parseInt(rangeMatch[1], 10);
      const end = parseInt(rangeMatch[2], 10);

      if (
        start < 1 ||
        end > pageCount ||
        start > end
      ) {
        throw new PdfToolError(
          `Invalid page range "${part}" for a ${pageCount}-page document.`
        );
      }

      for (let i = start; i <= end; i++) {
        indices.push(i - 1);
      }
    } else if (/^\d+$/.test(part)) {
      // Supports: 5
      const page = parseInt(part, 10);

      if (page < 1 || page > pageCount) {
        throw new PdfToolError(
          `Page ${page} does not exist in this ${pageCount}-page document.`
        );
      }

      indices.push(page - 1);
    } else {
      throw new PdfToolError(
        `Could not understand "${part}". Use formats like "1-3,5".`
      );
    }
  }

  return indices;
}

async function loadPdf(buffer: Buffer) {
  try {
    return await PDFDocument.load(buffer, {
      ignoreEncryption: false,
    });
  } catch {
    throw new PdfToolError(
      'This PDF could not be read. It may be corrupted or password protected.'
    );
  }
}

/* ─────────────────────────────────────────────
   Merge PDF
───────────────────────────────────────────── */

export async function mergePdfs(
  buffers: Buffer[]
): Promise<Buffer> {
  if (buffers.length < 2) {
    throw new PdfToolError(
      'Select at least two PDF files to merge.'
    );
  }

  const mergedPdf = await PDFDocument.create();

  for (const buffer of buffers) {
    const pdf = await loadPdf(buffer);

    const pages = await mergedPdf.copyPages(
      pdf,
      pdf.getPageIndices()
    );

    pages.forEach((page) => {
      mergedPdf.addPage(page);
    });
  }

  return Buffer.from(await mergedPdf.save());
}

/* ─────────────────────────────────────────────
   Split PDF
───────────────────────────────────────────── */

export async function splitPdf(
  buffer: Buffer,
  range: string
): Promise<Buffer> {
  const pdf = await loadPdf(buffer);

  const pageCount = pdf.getPageCount();

  const indices = parsePageRanges(
    range,
    pageCount
  );

  const newPdf = await PDFDocument.create();

  const pages = await newPdf.copyPages(
    pdf,
    indices
  );

  pages.forEach((page) => {
    newPdf.addPage(page);
  });

  return Buffer.from(await newPdf.save());
}

/* ─────────────────────────────────────────────
   Organize PDF
───────────────────────────────────────────── */

export async function organizePdf(
  buffer: Buffer,
  order: string
): Promise<Buffer> {
  const pdf = await loadPdf(buffer);

  const pageCount = pdf.getPageCount();

  const requested = order
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      const n = Number(p);

      if (
        !Number.isInteger(n) ||
        n < 1 ||
        n > pageCount
      ) {
        throw new PdfToolError(
          `"${p}" is not a valid page number for this ${pageCount}-page document.`
        );
      }

      return n - 1;
    });

  if (requested.length === 0) {
    throw new PdfToolError(
      'Please provide the new page order, e.g. "3,1,2".'
    );
  }

  const newPdf = await PDFDocument.create();

  const pages = await newPdf.copyPages(
    pdf,
    requested
  );

  pages.forEach((page) => {
    newPdf.addPage(page);
  });

  return Buffer.from(await newPdf.save());
}

/* ─────────────────────────────────────────────
   Rotate PDF
───────────────────────────────────────────── */

export async function rotatePdf(
  buffer: Buffer,
  degreesValue: number
): Promise<Buffer> {
  if (![90, 180, 270].includes(degreesValue)) {
    throw new PdfToolError(
      'Rotation must be 90, 180, or 270 degrees.'
    );
  }

  const pdf = await loadPdf(buffer);

  pdf.getPages().forEach((page) => {
    const current = page.getRotation().angle;

    page.setRotation(
      degrees(
        (current + degreesValue) % 360
      )
    );
  });

  return Buffer.from(await pdf.save());
}

/* ─────────────────────────────────────────────
   Watermark PDF
───────────────────────────────────────────── */

export async function watermarkPdf(
  buffer: Buffer,
  text: string
): Promise<Buffer> {
  if (!text || !text.trim()) {
    throw new PdfToolError(
      'Please enter watermark text.'
    );
  }

  const pdf = await loadPdf(buffer);

  const font = await pdf.embedFont(
    StandardFonts.HelveticaBold
  );

  pdf.getPages().forEach((page) => {
    const { width, height } = page.getSize();

    const fontSize = Math.max(
      24,
      Math.min(width, height) / 10
    );

    const textWidth =
      font.widthOfTextAtSize(
        text,
        fontSize
      );

    page.drawText(text, {
      x: width / 2 - textWidth / 2,
      y: height / 2,
      size: fontSize,
      font,
      color: rgb(0.6, 0.6, 0.6),
      opacity: 0.35,
      rotate: degrees(45),
    });
  });

  return Buffer.from(await pdf.save());
}

/* ─────────────────────────────────────────────
   Page Numbers
───────────────────────────────────────────── */

export async function addPageNumbers(
  buffer: Buffer,
  position:
    | 'bottom-center'
    | 'bottom-left'
    | 'bottom-right' = 'bottom-center'
): Promise<Buffer> {
  const pdf = await loadPdf(buffer);

  const font = await pdf.embedFont(
    StandardFonts.Helvetica
  );

  const pages = pdf.getPages();

  pages.forEach((page, i) => {
    const { width } = page.getSize();

    const label = `${i + 1} / ${pages.length}`;

    const fontSize = 10;

    const textWidth =
      font.widthOfTextAtSize(
        label,
        fontSize
      );

    let x: number;

    if (position === 'bottom-left') {
      x = 24;
    } else if (position === 'bottom-right') {
      x = width - textWidth - 24;
    } else {
      x = width / 2 - textWidth / 2;
    }

    page.drawText(label, {
      x,
      y: 20,
      size: fontSize,
      font,
      color: rgb(0.35, 0.35, 0.35),
    });
  });

  return Buffer.from(await pdf.save());
}

/* ─────────────────────────────────────────────
   Images → PDF
───────────────────────────────────────────── */

export async function imagesToPdf(
  images: {
    buffer: Buffer;
    mimeType: string;
  }[]
): Promise<Buffer> {
  if (images.length === 0) {
    throw new PdfToolError(
      'Select at least one image.'
    );
  }

  const pdf = await PDFDocument.create();

  for (const { buffer, mimeType } of images) {
    let image;

    if (mimeType === 'image/png') {
      image = await pdf.embedPng(buffer);
    } else if (
      mimeType === 'image/jpeg' ||
      mimeType === 'image/jpg'
    ) {
      image = await pdf.embedJpg(buffer);
    } else {
      throw new PdfToolError(
        'Only JPG and PNG images are supported.'
      );
    }

    const page = pdf.addPage([
      image.width,
      image.height,
    ]);

    page.drawImage(image, {
      x: 0,
      y: 0,
      width: image.width,
      height: image.height,
    });
  }

  return Buffer.from(await pdf.save());
}

/* ─────────────────────────────────────────────
   Page Count
───────────────────────────────────────────── */

export async function getPageCount(
  buffer: Buffer
): Promise<number> {
  const pdf = await loadPdf(buffer);

  return pdf.getPageCount();
}

/* ─────────────────────────────────────────────
   PDF → Markdown with OCR fallback
───────────────────────────────────────────── */

async function extractTextWithOcr(
  buffer: Buffer
): Promise<string> {
  const tempDir = await fs.mkdtemp(
    path.join(os.tmpdir(), 'pdfly-ocr-')
  );

  const inputPdf = path.join(
    tempDir,
    'input.pdf'
  );

  const outputPrefix = path.join(
    tempDir,
    'page'
  );

  try {
    // Save PDF temporarily
    await fs.writeFile(inputPdf, buffer);

    // Convert PDF pages to PNG images
    await execFileAsync(
      'pdftoppm',
      [
        '-png',
        '-r',
        '150',
        inputPdf,
        outputPrefix,
      ],
      {
        windowsHide: true,
        maxBuffer: 10 * 1024 * 1024,
      }
    );

    const files = await fs.readdir(tempDir);

    const imageFiles = files
      .filter(
        (file) =>
          file.startsWith('page-') &&
          file.toLowerCase().endsWith('.png')
      )
      .sort((a, b) => {
        const pageA = parseInt(
          a.match(/page-(\d+)/)?.[1] || '0',
          10
        );

        const pageB = parseInt(
          b.match(/page-(\d+)/)?.[1] || '0',
          10
        );

        return pageA - pageB;
      });

    if (imageFiles.length === 0) {
      throw new PdfToolError(
        'Could not convert the PDF pages into images for OCR.'
      );
    }

    const pageTexts: string[] = [];

    for (let i = 0; i < imageFiles.length; i++) {
      const imagePath = path.join(
        tempDir,
        imageFiles[i]
      );

      try {
        const { stdout } = await execFileAsync(
          'tesseract',
          [
            imagePath,
            'stdout',
            '-l',
            'eng',
            '--psm',
            '3',
          ],
          {
            windowsHide: true,
            maxBuffer: 20 * 1024 * 1024,
          }
        );

        const text = stdout.trim();

        if (text) {
          pageTexts.push(
            `## Page ${i + 1}\n\n${text}`
          );
        }
      } catch (error) {
        console.error(
          `OCR failed for page ${i + 1}:`,
          error
        );
      }
    }

    if (pageTexts.length === 0) {
      throw new PdfToolError(
        'OCR could not recognize readable text from this PDF.'
      );
    }

    return pageTexts.join('\n\n');
  } catch (error) {
    if (error instanceof PdfToolError) {
      throw error;
    }

    console.error(
      'OCR processing error:',
      error
    );

    throw new PdfToolError(
      'Could not process this scanned PDF with OCR.'
    );
  } finally {
    // Clean temporary files
    try {
      const files = await fs.readdir(tempDir);

      await Promise.all(
        files.map((file) =>
          fs.rm(
            path.join(tempDir, file),
            {
              force: true,
            }
          )
        )
      );

      await fs.rm(tempDir, {
        recursive: true,
        force: true,
      });
    } catch {
      // Ignore cleanup errors
    }
  }
}

export async function pdfToMarkdown(
  buffer: Buffer
): Promise<Buffer> {
  let parser: any = null;

  try {
    /*
     * First try normal PDF text extraction.
     * This is much faster for normal text PDFs.
     */
    const { PDFParse } = await import(
      'pdf-parse'
    );

    parser = new PDFParse({
      data: buffer,
    });

    const result = await parser.getText();

    const rawText =
      result?.text?.trim() || '';

    /*
     * Normal PDF with selectable text
     */
    if (rawText) {
      const markdown =
        convertTextToMarkdown(rawText);

      return Buffer.from(
        markdown,
        'utf8'
      );
    }

    /*
     * No text found.
     * This is probably a scanned/image-only PDF.
     *
     * Now use:
     * PDF → PNG → Tesseract OCR → Markdown
     */
    console.log(
      'No selectable text found. Starting OCR fallback...'
    );

    const ocrText =
      await extractTextWithOcr(buffer);

    const markdown =
      convertTextToMarkdown(ocrText);

    return Buffer.from(
      markdown,
      'utf8'
    );
  } catch (error) {
    console.error(
      'PDF to Markdown error:',
      error
    );

    /*
     * If normal PDF parsing fails completely,
     * attempt OCR as a fallback.
     */
    try {
      console.log(
        'Normal extraction failed. Trying OCR fallback...'
      );

      const ocrText =
        await extractTextWithOcr(buffer);

      const markdown =
        convertTextToMarkdown(ocrText);

      return Buffer.from(
        markdown,
        'utf8'
      );
    } catch (ocrError) {
      console.error(
        'OCR fallback failed:',
        ocrError
      );

      if (ocrError instanceof PdfToolError) {
        throw ocrError;
      }

      throw new PdfToolError(
        'Could not extract text from this PDF. The PDF may be corrupted, encrypted, or unreadable.'
      );
    }
  } finally {
    if (parser) {
      try {
        await parser.destroy();
      } catch {
        // Ignore parser cleanup errors
      }
    }
  }
}
/* ─────────────────────────────────────────────
   Text → Markdown
───────────────────────────────────────────── */

function convertTextToMarkdown(
  text: string
): string {
  const normalized = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const lines = normalized.split('\n');

  const markdownLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      if (
        markdownLines.length > 0 &&
        markdownLines[
          markdownLines.length - 1
        ] !== ''
      ) {
        markdownLines.push('');
      }

      continue;
    }

    // Preserve Markdown headings
    if (/^#{1,6}\s/.test(trimmed)) {
      markdownLines.push(trimmed);
      continue;
    }

    // Convert bullet characters
    if (/^[•●▪◦]\s+/.test(trimmed)) {
      markdownLines.push(
        `- ${trimmed.replace(
          /^[•●▪◦]\s+/,
          ''
        )}`
      );

      continue;
    }

    // Convert numbered lists
    if (/^\d+[.)]\s+/.test(trimmed)) {
      markdownLines.push(
        trimmed.replace(
          /^(\d+)[.)]\s+/,
          '$1. '
        )
      );

      continue;
    }

    markdownLines.push(trimmed);
  }

  return `${markdownLines
    .join('\n')
    .trim()}\n`;
}


/* ─────────────────────────────────────────────
   Sign PDF
───────────────────────────────────────────── */

export async function signPdf(
  buffer: Buffer,
  signatureBuffer: Buffer,
  pageNumber: number = 1,
  x: number = 50,
  y: number = 50,
  width: number = 160,
  height: number = 70
): Promise<Buffer> {
  if (!signatureBuffer.length) {
    throw new PdfToolError(
      'Please provide a signature.'
    );
  }

  const pdf = await loadPdf(buffer);

  const pages = pdf.getPages();

  if (pages.length === 0) {
    throw new PdfToolError(
      'The PDF does not contain any pages.'
    );
  }

  if (
    !Number.isInteger(pageNumber) ||
    pageNumber < 1 ||
    pageNumber > pages.length
  ) {
    throw new PdfToolError(
      `Page ${pageNumber} does not exist in this PDF.`
    );
  }

  const page = pages[pageNumber - 1];

  let signature;

  try {
    // PNG is preferred because canvas signatures
    // normally have transparent backgrounds.
    signature = await pdf.embedPng(
      signatureBuffer
    );
  } catch {
    try {
      signature = await pdf.embedJpg(
        signatureBuffer
      );
    } catch {
      throw new PdfToolError(
        'The signature image could not be read. Please use a PNG or JPG signature.'
      );
    }
  }

  const safeWidth = Math.max(
    20,
    Math.min(width, 500)
  );

  const safeHeight = Math.max(
    20,
    Math.min(height, 300)
  );

  const { width: pageWidth, height: pageHeight } =
    page.getSize();

  const safeX = Math.max(
    0,
    Math.min(
      x,
      Math.max(0, pageWidth - safeWidth)
    )
  );

  const safeY = Math.max(
    0,
    Math.min(
      y,
      Math.max(0, pageHeight - safeHeight)
    )
  );

  page.drawImage(signature, {
    x: safeX,
    y: safeY,
    width: safeWidth,
    height: safeHeight,
  });

  return Buffer.from(
    await pdf.save()
  );
}

// ─────────────────────────────────────────────
// Edit PDF
// ─────────────────────────────────────────────

export type PdfEdit = {
  type: 'text' | 'rectangle' | 'circle' | 'line';
  page: number;

  x: number;
  y: number;

  width?: number;
  height?: number;

  text?: string;
  fontSize?: number;

  color?: {
    r: number;
    g: number;
    b: number;
  };
};

export async function editPdf(
  buffer: Buffer,
  edits: PdfEdit[]
): Promise<Buffer> {
  if (!edits || edits.length === 0) {
    throw new PdfToolError(
      'No edits were provided.'
    );
  }

  const pdf = await loadPdf(buffer);

  const font = await pdf.embedFont(
    StandardFonts.Helvetica
  );

  for (const edit of edits) {
    const pageIndex = edit.page - 1;

    if (
      !Number.isInteger(pageIndex) ||
      pageIndex < 0 ||
      pageIndex >= pdf.getPageCount()
    ) {
      throw new PdfToolError(
        `Page ${edit.page} does not exist.`
      );
    }

    const page = pdf.getPage(pageIndex);

    const color = rgb(
      edit.color?.r ?? 0,
      edit.color?.g ?? 0,
      edit.color?.b ?? 0
    );

    // ───────────────
    // TEXT
    // ───────────────

    if (edit.type === 'text') {
      if (!edit.text?.trim()) {
        continue;
      }

      page.drawText(edit.text, {
        x: edit.x,
        y: edit.y,
        size: edit.fontSize ?? 18,
        font,
        color,
      });
    }

    // ───────────────
    // RECTANGLE
    // ───────────────

    else if (edit.type === 'rectangle') {
      page.drawRectangle({
        x: edit.x,
        y: edit.y,
        width: edit.width ?? 100,
        height: edit.height ?? 60,
        borderColor: color,
        borderWidth: 2,
      });
    }

    // ───────────────
    // CIRCLE
    // ───────────────

    else if (edit.type === 'circle') {
      page.drawEllipse({
        x: edit.x,
        y: edit.y,
        xScale: (edit.width ?? 50) / 2,
        yScale: (edit.height ?? 50) / 2,
        borderColor: color,
        borderWidth: 2,
      });
    }

    // ───────────────
    // LINE
    // ───────────────

    else if (edit.type === 'line') {
      page.drawLine({
        start: {
          x: edit.x,
          y: edit.y,
        },
        end: {
          x:
            edit.x +
            (edit.width ?? 100),
          y:
            edit.y +
            (edit.height ?? 0),
        },
        thickness: 2,
        color,
      });
    }
  }

  return Buffer.from(
    await pdf.save()
  );
}