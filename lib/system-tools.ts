import { execFileSync } from 'child_process';

import { execFile } from 'child_process';
import { promisify } from 'util';
import { randomUUID } from 'crypto';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import process from 'process';

const execFileAsync = promisify(execFile);

export class SystemToolError extends Error {}

async function withTempDir<T>(fn: (dir: string) => Promise<T>): Promise<T> {
  const dir = path.join(os.tmpdir(), `pdfly-${randomUUID()}`);
  await fs.mkdir(dir, { recursive: true });
  try {
    return await fn(dir);
  } finally {
    await fs.rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

function friendlyMissingBinary(binary: string, err: unknown): never {
  if (err instanceof Error && 'code' in err && (err as NodeJS.ErrnoException).code === 'ENOENT') {
    throw new SystemToolError(
      `${binary} is not installed on the server. See the README for setup instructions.`
    );
  }
  throw err instanceof Error ? new SystemToolError(err.message) : new SystemToolError('Unknown error.');
}

/** Encrypt a PDF with a user-facing password using qpdf. */
export async function protectPdf(buffer: Buffer, password: string): Promise<Buffer> {
  if (!password || password.length < 4) {
    throw new SystemToolError('Password must be at least 4 characters.');
  }

  return withTempDir(async (dir) => {
    const input = path.join(dir, 'input.pdf');
    const output = path.join(dir, 'output.pdf');
    await fs.writeFile(input, buffer);

    try {
      await execFileAsync(
        'qpdf',
        ['--encrypt', password, password, '256', '--', input, output],
        { timeout: 30_000 }
      );
    } catch (err) {
      friendlyMissingBinary('qpdf', err);
    }

    return fs.readFile(output);
  });
}

/** Decrypt a password-protected PDF using qpdf, given the current password. */
export async function unlockPdf(buffer: Buffer, password: string): Promise<Buffer> {
  if (!password) {
    throw new SystemToolError('Please enter the current password.');
  }

  return withTempDir(async (dir) => {
    const input = path.join(dir, 'input.pdf');
    const output = path.join(dir, 'output.pdf');
    await fs.writeFile(input, buffer);

    try {
      await execFileAsync(
        'qpdf',
        [`--password=${password}`, '--decrypt', '--', input, output],
        { timeout: 30_000 }
      );
    } catch (err) {
      if (err instanceof Error && 'code' in err && (err as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw new SystemToolError('Incorrect password, or the file is not password protected.');
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
    low: '/screen', // smallest file, lowest quality
    medium: '/ebook',
    high: '/printer', // largest file, best quality
  };
  const setting = settingMap[quality] ?? '/ebook';

  return withTempDir(async (dir) => {
    const input = path.join(dir, 'input.pdf');
    const output = path.join(dir, 'output.pdf');
    await fs.writeFile(input, buffer);

    try {
      await execFileAsync(
        process.platform === 'win32' ? 'gswin64c' : 'gs',
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
        { timeout: 60_000 }
      );
    } catch (err) {
      friendlyMissingBinary('ghostscript (gs)', err);
    }

    return fs.readFile(output);
  });
}

/** Rasterize every page of a PDF into a JPG using pdftoppm (poppler-utils). */
export async function pdfToJpgPages(buffer: Buffer): Promise<Buffer[]> {
  return withTempDir(async (dir) => {
    const input = path.join(dir, 'input.pdf');
    const outPrefix = path.join(dir, 'page');
    await fs.writeFile(input, buffer);

    try {
      await execFileAsync('pdftoppm', ['-jpeg', '-r', '150', input, outPrefix], {
        timeout: 60_000,
      });
    } catch (err) {
      friendlyMissingBinary('poppler-utils (pdftoppm)', err);
    }

    const files = (await fs.readdir(dir))
      .filter((f) => f.startsWith('page') && f.endsWith('.jpg'))
      .sort();

    if (files.length === 0) {
      throw new SystemToolError('No pages could be rendered from this PDF.');
    }

    return Promise.all(files.map((f) => fs.readFile(path.join(dir, f))));
  });
}


/** Repair/rebuild a damaged PDF using qpdf with Ghostscript fallback. */
export async function repairPdf(
  buffer: Buffer
): Promise<Buffer> {
  return withTempDir(async (dir) => {
    const input = path.join(dir, 'input.pdf');
    const qpdfOutput = path.join(dir, 'qpdf-repaired.pdf');
    const gsOutput = path.join(dir, 'gs-repaired.pdf');

    await fs.writeFile(input, buffer);

    // ---------------------------------------------
    // Helper: validate a PDF with qpdf --check
    // ---------------------------------------------
    async function isValidPdf(filePath: string): Promise<boolean> {
      try {
        await execFileAsync(
          'qpdf',
          ['--check', '--', filePath],
          {
            timeout: 30_000,
            maxBuffer: 10 * 1024 * 1024,
          }
        );

        return true;
      } catch {
        return false;
      }
    }

    // ---------------------------------------------
    // Stage 1: QPDF
    // ---------------------------------------------
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
          maxBuffer: 10 * 1024 * 1024,
        }
      );

      const exists = await fs
        .access(qpdfOutput)
        .then(() => true)
        .catch(() => false);

      if (exists) {
        const repaired = await fs.readFile(qpdfOutput);

        if (
          repaired.length > 0 &&
          await isValidPdf(qpdfOutput)
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

    // ---------------------------------------------
    // Stage 2: Ghostscript fallback
    // ---------------------------------------------
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
          maxBuffer: 10 * 1024 * 1024,
        }
      );

      const exists = await fs
        .access(gsOutput)
        .then(() => true)
        .catch(() => false);

      if (exists) {
        const repaired = await fs.readFile(gsOutput);

        if (
          repaired.length > 0 &&
          await isValidPdf(gsOutput)
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

    // ---------------------------------------------
    // Nothing produced a valid PDF
    // ---------------------------------------------
    throw new SystemToolError(
      'This PDF could not be repaired. The file may be severely corrupted or missing required data.'
    );
  });
}

/** Convert a PDF to PDF/A-2b using Ghostscript. */
export async function pdfToPdfA(
  buffer: Buffer
): Promise<Buffer> {
  return withTempDir(async (dir) => {
    const input = path.join(dir, 'input.pdf');
    const output = path.join(dir, 'output-pdfa.pdf');

    await fs.writeFile(input, buffer);

    const gsBinary =
      process.platform === 'win32'
        ? 'gswin64c'
        : 'gs';

        const gsRoot =
  process.platform === 'win32'
    ? 'C:\\Program Files\\gs\\gs10.07.1'
    : path.join(
        '/usr/share/ghostscript',
        execFileSync('gs', ['--version'], { encoding: 'utf8' }).trim()
      );


    // const gsRoot =
    //   process.platform === 'win32'
    //     ? 'C:\\Program Files\\gs\\gs10.07.1'
    //     : '/usr/share/ghostscript';

    const originalPdfaDef = path.join(
      gsRoot,
      'lib',
      'PDFA_def.ps'
    );

    const iccProfile = path.join(
      gsRoot,
      'iccprofiles',
      'srgb.icc'
    );

    const pdfaDef = path.join(
      dir,
      'PDFA_def.ps'
    );

    // Verify Ghostscript files exist.
    try {
      await fs.access(originalPdfaDef);
    } catch {
      throw new SystemToolError(
        `Ghostscript PDF/A definition file was not found: ${originalPdfaDef}`
      );
    }

    try {
      await fs.access(iccProfile);
    } catch {
      throw new SystemToolError(
        `Ghostscript ICC profile was not found: ${iccProfile}`
      );
    }

    // Read the standard Ghostscript PDF/A definition file.
    let pdfaDefContent = await fs.readFile(
      originalPdfaDef,
      'utf8'
    );

    // Make the ICC profile path absolute so Ghostscript can
    // reliably locate it on Windows and Linux.
    const escapedIccPath = iccProfile
      .replace(/\\/g, '/')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)');

    pdfaDefContent = pdfaDefContent.replace(
      /\/ICCProfile\s+\(srgb\.icc\)/,
      `/ICCProfile (${escapedIccPath})`
    );

    // Write the corrected PDF/A definition file into the
    // temporary working directory.
    await fs.writeFile(
      pdfaDef,
      pdfaDefContent,
      'utf8'
    );

    try {
      const result = await execFileAsync(
        gsBinary,
        [
          '-dBATCH',
          '-dNOPAUSE',
          '-dSAFER',

          // Allow Ghostscript to read the PDF/A definition
          // and ICC profile.
          `--permit-file-read=${pdfaDef}`,
          `--permit-file-read=${iccProfile}`,

          '-sDEVICE=pdfwrite',

          // PDF/A-2b
          '-dPDFA=2',
          '-dPDFACompatibilityPolicy=1',

          // RGB output
          '-sColorConversionStrategy=RGB',
          `-sOutputICCProfile=${iccProfile}`,

          `-sOutputFile=${output}`,

          // PDF/A definition MUST come before input PDF.
          pdfaDef,
          input,
        ],
        {
          timeout: 120_000,
          maxBuffer: 10 * 1024 * 1024,
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
        (err as NodeJS.ErrnoException).code === 'ENOENT'
      ) {
        friendlyMissingBinary(
          'ghostscript (gs)',
          err
        );
      }

      const execError = err as {
        message?: string;
        stdout?: string;
        stderr?: string;
      };

      console.error(
        'Ghostscript PDF/A conversion failed:',
        execError.message || err
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

    const exists = await fs
      .access(output)
      .then(() => true)
      .catch(() => false);

    if (!exists) {
      throw new SystemToolError(
        'Ghostscript did not produce a PDF/A file.'
      );
    }

    const result = await fs.readFile(output);

    if (!result.length) {
      throw new SystemToolError(
        'PDF/A conversion produced an empty file.'
      );
    }

    return result;
  });
}