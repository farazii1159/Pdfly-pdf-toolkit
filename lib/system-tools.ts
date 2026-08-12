import { execFileSync } from 'child_process';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { randomUUID } from 'crypto';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import process from 'process';

import { encryptPDF } from '@pdfsmaller/pdf-encrypt';

const execFileAsync = promisify(execFile);

export class SystemToolError extends Error {}

async function withTempDir<T>(
  fn: (dir: string) => Promise<T>
): Promise<T> {
  const dir = path.join(os.tmpdir(), `pdfly-${randomUUID()}`);

  await fs.mkdir(dir, { recursive: true });

  try {
    return await fn(dir);
  } finally {
    await fs
      .rm(dir, {
        recursive: true,
        force: true,
      })
      .catch(() => {});
  }
}

function friendlyMissingBinary(
  binary: string,
  err: unknown
): never {
  if (
    err instanceof Error &&
    'code' in err &&
    (err as NodeJS.ErrnoException).code === 'ENOENT'
  ) {
    throw new SystemToolError(
      `${binary} is not installed on the server. See the README for setup instructions.`
    );
  }

  throw err instanceof Error
    ? new SystemToolError(err.message)
    : new SystemToolError('Unknown error.');
}

/**
 * Protect/encrypt a PDF with a user-facing password.
 *
 * Uses @pdfsmaller/pdf-encrypt instead of qpdf so this
 * works on serverless platforms such as Vercel.
 */
export async function protectPdf(
  buffer: Buffer,
  password: string
): Promise<Buffer> {
  if (!password || password.length < 4) {
    throw new SystemToolError(
      'Password must be at least 4 characters.'
    );
  }

   try {
    const encrypted = await encryptPDF(
      buffer,
      password
    );

    if (!encrypted || encrypted.length === 0) {
      throw new SystemToolError(
        'PDF protection produced an empty file.'
      );
    }

    return Buffer.isBuffer(encrypted)
      ? encrypted
      : Buffer.from(encrypted);
  } catch (error) {
    console.error('PDF protection failed:', error);

    if (error instanceof SystemToolError) {
      throw error;
    }

    throw new SystemToolError(
      error instanceof Error
        ? error.message
        : 'Could not protect this PDF.'
    );
  }
}

/**
 * Decrypt a password-protected PDF using qpdf,
 * given the current password.
 *
 * NOTE:
 * This still requires qpdf on the server.
 */
export async function unlockPdf(
  buffer: Buffer,
  password: string
): Promise<Buffer> {
  if (!password) {
    throw new SystemToolError(
      'Please enter the current password.'
    );
  }

  return withTempDir(async (dir) => {
    const input = path.join(dir, 'input.pdf');
    const output = path.join(dir, 'output.pdf');

    await fs.writeFile(input, buffer);

    try {
      await execFileAsync(
        'qpdf',
        [
          `--password=${password}`,
          '--decrypt',
          '--',
          input,
          output,
        ],
        {
          timeout: 30_000,
        }
      );
    } catch (err) {
      if (
        err instanceof Error &&
        'code' in err &&
        (err as NodeJS.ErrnoException).code !== 'ENOENT'
      ) {
        throw new SystemToolError(
          'Incorrect password, or the file is not password protected.'
        );
      }

      friendlyMissingBinary('qpdf', err);
    }

    return fs.readFile(output);
  });
}

/** Compress a PDF using Ghostscript. */
export async function compressPdf(
  buffer: Buffer,
  quality: 'low' | 'medium' | 'high' = 'medium'
): Promise<Buffer> {
  const settingMap: Record<string, string> = {
    low: '/screen',
    medium: '/ebook',
    high: '/printer',
  };

  const setting =
    settingMap[quality] ?? '/ebook';

  return withTempDir(async (dir) => {
    const input = path.join(dir, 'input.pdf');
    const output = path.join(dir, 'output.pdf');

    await fs.writeFile(input, buffer);

    try {
      await execFileAsync(
        process.platform === 'win32'
          ? 'gswin64c'
          : 'gs',
        [
          '-sDEVICE=pdfwrite',
          '-dCompatibilityLevel=1.4',
          `-dPDFSETTINGS=${setting}`,
          '-dNOPAUSE',
          '-dBATCH',
          '-dQUIET',
          `-sOutputFile=${output}`,
          input,
        ],
        {
          timeout: 60_000,
        }
      );
    } catch (err) {
      friendlyMissingBinary(
        'ghostscript (gs)',
        err
      );
    }

    return fs.readFile(output);
  });
}

/**
 * Rasterize every page of a PDF into JPG
 * using pdftoppm (poppler-utils).
 */
export async function pdfToJpgPages(
  buffer: Buffer
): Promise<Buffer[]> {
  return withTempDir(async (dir) => {
    const input = path.join(
      dir,
      'input.pdf'
    );

    const outPrefix = path.join(
      dir,
      'page'
    );

    await fs.writeFile(input, buffer);

    try {
      await execFileAsync(
        'pdftoppm',
        [
          '-jpeg',
          '-r',
          '150',
          input,
          outPrefix,
        ],
        {
          timeout: 60_000,
        }
      );
    } catch (err) {
      friendlyMissingBinary(
        'poppler-utils (pdftoppm)',
        err
      );
    }

    const files = (
      await fs.readdir(dir)
    )
      .filter(
        (f) =>
          f.startsWith('page') &&
          f.endsWith('.jpg')
      )
      .sort();

    if (files.length === 0) {
      throw new SystemToolError(
        'No pages could be rendered from this PDF.'
      );
    }

    return Promise.all(
      files.map((f) =>
        fs.readFile(
          path.join(dir, f)
        )
      )
    );
  });
}

/**
 * Repair/rebuild a damaged PDF using qpdf
 * with Ghostscript fallback.
 */
export async function repairPdf(
  buffer: Buffer
): Promise<Buffer> {
  return withTempDir(async (dir) => {
    const input = path.join(
      dir,
      'input.pdf'
    );

    const qpdfOutput = path.join(
      dir,
      'qpdf-repaired.pdf'
    );

    const gsOutput = path.join(
      dir,
      'gs-repaired.pdf'
    );

    await fs.writeFile(input, buffer);

    async function isValidPdf(
      filePath: string
    ): Promise<boolean> {
      try {
        await execFileAsync(
          'qpdf',
          [
            '--check',
            '--',
            filePath,
          ],
          {
            timeout: 30_000,
            maxBuffer:
              10 * 1024 * 1024,
          }
        );

        return true;
      } catch {
        return false;
      }
    }

    // Stage 1: QPDF
    try {
      await execFileAsync(
        'qpdf',
        [
          '--warning-exit-0',
          '--object-streams=generate',
          '--stream-data=compress',
          '--',
          input,
          qpdfOutput,
        ],
        {
          timeout: 60_000,
          maxBuffer:
            10 * 1024 * 1024,
        }
      );

      const exists = await fs
        .access(qpdfOutput)
        .then(() => true)
        .catch(() => false);

      if (exists) {
        const repaired =
          await fs.readFile(
            qpdfOutput
          );

        if (
          repaired.length > 0 &&
          await isValidPdf(
            qpdfOutput
          )
        ) {
          return repaired;
        }
      }
    } catch (err) {
      console.warn(
        'QPDF repair failed:',
        err
      );
    }

    // Stage 2: Ghostscript fallback
    try {
      const gsBinary =
        process.platform === 'win32'
          ? 'gswin64c'
          : 'gs';

      await execFileAsync(
        gsBinary,
        [
          '-sDEVICE=pdfwrite',
          '-dCompatibilityLevel=1.7',
          '-dNOPAUSE',
          '-dBATCH',
          '-dSAFER',
          `-sOutputFile=${gsOutput}`,
          input,
        ],
        {
          timeout: 120_000,
          maxBuffer:
            10 * 1024 * 1024,
        }
      );

      const exists = await fs
        .access(gsOutput)
        .then(() => true)
        .catch(() => false);

      if (exists) {
        const repaired =
          await fs.readFile(
            gsOutput
          );

        if (
          repaired.length > 0 &&
          await isValidPdf(
            gsOutput
          )
        ) {
          return repaired;
        }
      }
    } catch (err) {
      console.warn(
        'Ghostscript repair failed:',
        err
      );
    }

    throw new SystemToolError(
      'This PDF could not be repaired. The file may be severely corrupted or missing required data.'
    );
  });
}

/**
 * Convert a PDF to PDF/A-2b using Ghostscript.
 */
export async function pdfToPdfA(
  buffer: Buffer
): Promise<Buffer> {
  return withTempDir(async (dir) => {
    const input = path.join(
      dir,
      'input.pdf'
    );

    const output = path.join(
      dir,
      'output-pdfa.pdf'
    );

    await fs.writeFile(input, buffer);

    const gsBinary =
      process.platform === 'win32'
        ? 'gswin64c'
        : 'gs';

    let gsRoot: string;

    try {
      if (process.platform === 'win32') {
        gsRoot =
          'C:\\Program Files\\gs\\gs10.07.1';
      } else {
        const version =
          execFileSync(
            'gs',
            ['--version'],
            {
              encoding: 'utf8',
            }
          ).trim();

        gsRoot = path.join(
          '/usr/share/ghostscript',
          version
        );
      }
    } catch (err) {
      friendlyMissingBinary(
        'ghostscript (gs)',
        err
      );
    }

    const originalPdfaDef =
      path.join(
        gsRoot!,
        'lib',
        'PDFA_def.ps'
      );

    const iccProfile =
      path.join(
        gsRoot!,
        'iccprofiles',
        'srgb.icc'
      );

    const pdfaDef =
      path.join(
        dir,
        'PDFA_def.ps'
      );

    try {
      await fs.access(
        originalPdfaDef
      );
    } catch {
      throw new SystemToolError(
        `Ghostscript PDF/A definition file was not found: ${originalPdfaDef}`
      );
    }

    try {
      await fs.access(
        iccProfile
      );
    } catch {
      throw new SystemToolError(
        `Ghostscript ICC profile was not found: ${iccProfile}`
      );
    }

    let pdfaDefContent =
      await fs.readFile(
        originalPdfaDef,
        'utf8'
      );

    const escapedIccPath =
      iccProfile
        .replace(/\\/g, '/')
        .replace(
          /\(/g,
          '\\('
        )
        .replace(
          /\)/g,
          '\\)'
        );

    pdfaDefContent =
      pdfaDefContent.replace(
        /\/ICCProfile\s+\(srgb\.icc\)/,
        `/ICCProfile (${escapedIccPath})`
      );

    await fs.writeFile(
      pdfaDef,
      pdfaDefContent,
      'utf8'
    );

    try {
      const result =
        await execFileAsync(
          gsBinary,
          [
            '-dBATCH',
            '-dNOPAUSE',
            '-dSAFER',

            `--permit-file-read=${pdfaDef}`,
            `--permit-file-read=${iccProfile}`,

            '-sDEVICE=pdfwrite',

            '-dPDFA=2',
            '-dPDFACompatibilityPolicy=1',

            '-sColorConversionStrategy=RGB',
            `-sOutputICCProfile=${iccProfile}`,

            `-sOutputFile=${output}`,

            pdfaDef,
            input,
          ],
          {
            timeout: 120_000,
            maxBuffer:
              10 * 1024 * 1024,
          }
        );

      if (result.stdout) {
        console.log(
          'Ghostscript PDF/A stdout:',
          result.stdout
        );
      }

      if (result.stderr) {
        console.warn(
          'Ghostscript PDF/A stderr:',
          result.stderr
        );
      }
    } catch (err) {
      if (
        err instanceof Error &&
        'code' in err &&
        (err as NodeJS.ErrnoException)
          .code === 'ENOENT'
      ) {
        friendlyMissingBinary(
          'ghostscript (gs)',
          err
        );
      }

      const execError =
        err as {
          message?: string;
          stdout?: string;
          stderr?: string;
        };

      console.error(
        'Ghostscript PDF/A conversion failed:',
        execError.message ||
          err
      );

      if (execError.stdout) {
        console.error(
          'Ghostscript stdout:',
          execError.stdout
        );
      }

      if (execError.stderr) {
        console.error(
          'Ghostscript stderr:',
          execError.stderr
        );
      }

      throw new SystemToolError(
        execError.stderr?.trim() ||
          execError.message ||
          'Ghostscript failed to create the PDF/A file.'
      );
    }

    const exists =
      await fs
        .access(output)
        .then(() => true)
        .catch(() => false);

    if (!exists) {
      throw new SystemToolError(
        'Ghostscript did not produce a PDF/A file.'
      );
    }

    const result =
      await fs.readFile(output);

    if (!result.length) {
      throw new SystemToolError(
        'PDF/A conversion produced an empty file.'
      );
    }

    return result;
  });
}