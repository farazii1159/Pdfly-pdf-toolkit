import { execFile } from 'child_process';
import { promisify } from 'util';
import { randomUUID } from 'crypto';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import puppeteer from 'puppeteer';

const execFileAsync = promisify(execFile);

export class ConversionError extends Error {}

/**
 * Converts a DOCX file to PDF using LibreOffice headless mode.
 */
export async function convertDocxToPdf(
  fileBuffer: Buffer
): Promise<Buffer> {
  const workDir = path.join(
    os.tmpdir(),
    `word2pdf-${randomUUID()}`
  );

  const inputPath = path.join(workDir, 'input.docx');

  await fs.mkdir(workDir, { recursive: true });

  try {
    await fs.writeFile(inputPath, fileBuffer);

    await execFileAsync(
      'soffice',
      [
        '--headless',
        '--norestore',
        '--convert-to',
        'pdf',
        '--outdir',
        workDir,
        inputPath,
      ],
      { timeout: 60_000 }
    );

    const outputPath = path.join(workDir, 'input.pdf');

    const pdfBuffer = await fs.readFile(outputPath);

    return pdfBuffer;
  } catch (err) {
    if (
      err instanceof Error &&
      'code' in err &&
      (err as NodeJS.ErrnoException).code === 'ENOENT'
    ) {
      throw new ConversionError(
        'LibreOffice is not installed or not available on the server (soffice not found).'
      );
    }

    throw new ConversionError(
      'Failed to convert the document to PDF.'
    );
  } finally {
    await fs
      .rm(workDir, {
        recursive: true,
        force: true,
      })
      .catch(() => {});
  }
}

/**
 * Converts an HTML file to PDF using Puppeteer.
 */
export async function convertHtmlToPdf(
  fileBuffer: Buffer
): Promise<Buffer> {
  const html = fileBuffer.toString('utf8');

  if (!html.trim()) {
    throw new ConversionError('The HTML file is empty.');
  }

  let browser;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
      ],
    });

    const page = await browser.newPage();

    await page.setContent(html, {
    waitUntil: 'load',
    });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm',
      },
    });

    return Buffer.from(pdfBuffer);
  } catch (err) {
    if (err instanceof ConversionError) {
      throw err;
    }

    console.error(
      'HTML to PDF conversion error:',
      err
    );

    throw new ConversionError(
      'Failed to convert HTML to PDF.'
    );
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}