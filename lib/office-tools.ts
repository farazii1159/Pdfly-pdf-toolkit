import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';

const execFileAsync = promisify(execFile);

function getLibreOfficeCommand() {
  return process.platform === 'win32'
    ? 'soffice.exe'
    : 'soffice';
}

export async function officeFileToPdf(
  inputBuffer: Buffer,
  originalFilename: string
): Promise<Buffer> {
  const tempDir = await fs.mkdtemp(
    path.join(os.tmpdir(), 'pdf-tool-')
  );

  try {
    const inputPath = path.join(
      tempDir,
      originalFilename
    );

    await fs.writeFile(inputPath, inputBuffer);

    const outputDir = path.join(
      tempDir,
      'output'
    );

    await fs.mkdir(outputDir);

    const soffice = getLibreOfficeCommand();

    await execFileAsync(
      soffice,
      [
        '--headless',
        '--convert-to',
        'pdf',
        '--outdir',
        outputDir,
        inputPath,
      ],
      {
        timeout: 55_000,
        windowsHide: true,
      }
    );

    const outputFilename =
      path.basename(originalFilename, path.extname(originalFilename)) +
      '.pdf';

    const outputPath = path.join(
      outputDir,
      outputFilename
    );

    return await fs.readFile(outputPath);
  } catch (error) {
    console.error(
      'LibreOffice conversion error:',
      error
    );

    throw new Error(
      'Could not convert this file to PDF. Please make sure the file is valid.'
    );
  } finally {
    await fs.rm(tempDir, {
      recursive: true,
      force: true,
    });
  }
}