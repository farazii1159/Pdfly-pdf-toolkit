import { execFile } from 'child_process';
import { promisify } from 'util';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';

const execFileAsync = promisify(execFile);

export class OcrToolError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OcrToolError';
  }
}

function getOcrCommand(): string {
  return process.platform === 'win32'
    ? 'ocrmypdf.exe'
    : 'ocrmypdf';
}

export async function checkOcrAvailable(): Promise<boolean> {
  try {
    await execFileAsync(
      getOcrCommand(),
      ['--version'],
      {
        timeout: 15_000,
      }
    );

    return true;
  } catch {
    return false;
  }
}

export async function ocrPdf(
  input: Buffer,
  language = 'eng'
): Promise<Buffer> {
  const tempDirectory = await fs.mkdtemp(
    path.join(os.tmpdir(), 'pdfly-ocr-')
  );
  const id = crypto.randomUUID();

  const inputPath = path.join(
    tempDirectory,
    `${id}-input.pdf`
  );

  const outputPath = path.join(
    tempDirectory,
    `${id}-output.pdf`
  );

  try {
    await fs.writeFile(inputPath, input);

    const command = getOcrCommand();

    try {
      await execFileAsync(
        command,
        [
          '--force-ocr',
          '--rotate-pages',
          '--output-type',
          'pdf',
          '--language',
          language,
          inputPath,
          outputPath,
        ],
        {
          timeout: 120_000,
          maxBuffer: 10 * 1024 * 1024,
        }
      );
    } catch (error: unknown) {
      const err = error as {
        message?: string;
        stderr?: string;
      };

      const details =
        err.stderr ||
        err.message ||
        '';

      const lowerDetails =
        details.toLowerCase();

      if (
        lowerDetails.includes('command not found') ||
        lowerDetails.includes('not recognized') ||
        lowerDetails.includes('enoent')
      ) {
        throw new OcrToolError(
          'OCR is not installed on the server. Please install OCRmyPDF and Tesseract OCR.'
        );
      }

      if (
        lowerDetails.includes('tesseract')
      ) {
        throw new OcrToolError(
          'Tesseract OCR is not installed or the required language data is missing.'
        );
      }

      throw new OcrToolError(
        `OCR processing failed. ${details.slice(0, 500)}`
      );
    }

    const output = await fs.readFile(
      outputPath
    );

    if (!output.length) {
      throw new OcrToolError(
        'OCR completed but produced an empty PDF.'
      );
    }

    return output;
  } finally {
    await fs.rm(
      tempDirectory,
      {
        recursive: true,
        force: true,
      }
    );
  }
}