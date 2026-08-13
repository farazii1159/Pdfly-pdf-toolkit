import { execFile } from 'child_process';
import { promisify } from 'util';
import { randomUUID } from 'crypto';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import process from 'process';

const execFileAsync = promisify(execFile);

export class SystemToolError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SystemToolError';
  }
}

/* -------------------------------------------------------------------------- */
/* Temporary directory                                                       */
/* -------------------------------------------------------------------------- */

async function withTempDir<T>(
  fn: (dir: string) => Promise<T>
): Promise<T> {
  const dir = path.join(
    os.tmpdir(),
    `pdfly-${randomUUID()}`
  );

  await fs.mkdir(dir, {
    recursive: true,
  });

  try {
    return await fn(dir);
  } finally {
    await fs.rm(dir, {
      recursive: true,
      force: true,
    }).catch(() => {});
  }
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function isErrnoException(
  err: unknown
): err is NodeJS.ErrnoException {
  return err instanceof Error && 'code' in err;
}

function friendlyMissingBinary(
  binary: string,
  err: unknown
): never {
  if (
    isErrnoException(err) &&
    err.code === 'ENOENT'
  ) {
    throw new SystemToolError(
      `${binary} is not installed on the server.`
    );
  }

  if (err instanceof Error) {
    throw new SystemToolError(err.message);
  }

  throw new SystemToolError(
    'Unknown system tool error.'
  );
}

async function commandExists(
  command: string
): Promise<boolean> {
  try {
    await execFileAsync(
      command,
      ['--version'],
      {
        timeout: 10_000,
      }
    );

    return true;
  } catch (err) {
    return !(
      isErrnoException(err) &&
      err.code === 'ENOENT'
    );
  }
}

/* -------------------------------------------------------------------------- */
/* qpdf                                                                       */
/* -------------------------------------------------------------------------- */

async function requireQpdf(): Promise<void> {
  try {
    await execFileAsync(
      'qpdf',
      ['--version'],
      {
        timeout: 10_000,
      }
    );
  } catch (err) {
    friendlyMissingBinary('qpdf', err);
  }
}

/* -------------------------------------------------------------------------- */
/* Ghostscript                                                               */
/* -------------------------------------------------------------------------- */

function getGhostscriptBinary(): string {
  return process.platform === 'win32'
    ? 'gswin64c'
    : 'gs';
}

async function requireGhostscript(): Promise<void> {
  const binary = getGhostscriptBinary();

  try {
    await execFileAsync(
      binary,
      ['--version'],
      {
        timeout: 10_000,
      }
    );
  } catch (err) {
    friendlyMissingBinary(
      'ghostscript (gs)',
      err
    );
  }
}

/* -------------------------------------------------------------------------- */
/* Protect PDF                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Encrypt a PDF with a user-facing password using qpdf.
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

  await requireQpdf();

  return withTempDir(async (dir) => {
    const input = path.join(
      dir,
      'input.pdf'
    );

    const output = path.join(
      dir,
      'protected.pdf'
    );

    await fs.writeFile(
      input,
      buffer
    );

    try {
      await execFileAsync(
        'qpdf',
        [
          '--encrypt',
          password,
          password,
          '256',
          '--',
          input,
          output,
        ],
        {
          timeout: 60_000,
          maxBuffer: 10 * 1024 * 1024,
        }
      );
    } catch (err) {
      friendlyMissingBinary(
        'qpdf',
        err
      );
    }

    const result = await fs.readFile(
      output
    );

    if (!result.length) {
      throw new SystemToolError(
        'PDF protection produced an empty file.'
      );
    }

    return result;
  });
}

/* -------------------------------------------------------------------------- */
/* Unlock PDF                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Decrypt a password-protected PDF using qpdf.
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

  await requireQpdf();

  return withTempDir(async (dir) => {
    const input = path.join(
      dir,
      'input.pdf'
    );

    const output = path.join(
      dir,
      'unlocked.pdf'
    );

    await fs.writeFile(
      input,
      buffer
    );

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
          timeout: 60_000,
          maxBuffer: 10 * 1024 * 1024,
        }
      );
    } catch (err) {
      if (
        isErrnoException(err) &&
        err.code === 'ENOENT'
      ) {
        friendlyMissingBinary(
          'qpdf',
          err
        );
      }

      throw new SystemToolError(
        'Incorrect password, or the file is not password protected.'
      );
    }

    const result = await fs.readFile(
      output
    );

    if (!result.length) {
      throw new SystemToolError(
        'Unlocking the PDF produced an empty file.'
      );
    }

    return result;
  });
}

/* -------------------------------------------------------------------------- */
/* Compress PDF                                                               */
/* -------------------------------------------------------------------------- */

export async function compressPdf(
  buffer: Buffer,
  quality: 'low' | 'medium' | 'high' = 'medium'
): Promise<Buffer> {
  const settingMap: Record<
    'low' | 'medium' | 'high',
    string
  > = {
    low: '/screen',
    medium: '/ebook',
    high: '/printer',
  };

  const setting =
    settingMap[quality] ?? '/ebook';

  const gsBinary =
    getGhostscriptBinary();

  await requireGhostscript();

  return withTempDir(async (dir) => {
    const input = path.join(
      dir,
      'input.pdf'
    );

    const output = path.join(
      dir,
      'compressed.pdf'
    );

    await fs.writeFile(
      input,
      buffer
    );

    try {
      await execFileAsync(
        gsBinary,
        [
          '-sDEVICE=pdfwrite',
          '-dCompatibilityLevel=1.4',
          `-dPDFSETTINGS=${setting}`,
          '-dNOPAUSE',
          '-dBATCH',
          '-dSAFER',
          `-sOutputFile=${output}`,
          input,
        ],
        {
          timeout: 120_000,
          maxBuffer: 10 * 1024 * 1024,
        }
      );
    } catch (err) {
      friendlyMissingBinary(
        'ghostscript (gs)',
        err
      );

      throw new SystemToolError(
        'Ghostscript failed to compress the PDF.'
      );
    }

    const result =
      await fs.readFile(output);

    if (!result.length) {
      throw new SystemToolError(
        'Compression produced an empty PDF.'
      );
    }

    return result;
  });
}

/* -------------------------------------------------------------------------- */
/* PDF -> JPG                                                                 */
/* -------------------------------------------------------------------------- */

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

    await fs.writeFile(
      input,
      buffer
    );

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
          timeout: 120_000,
          maxBuffer: 10 * 1024 * 1024,
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
        (file) =>
          file.startsWith('page') &&
          file.endsWith('.jpg')
      )
      .sort((a, b) => {
        const aNumber =
          Number(
            a.match(/-(\d+)\.jpg$/)?.[1] ?? 0
          );

        const bNumber =
          Number(
            b.match(/-(\d+)\.jpg$/)?.[1] ?? 0
          );

        return aNumber - bNumber;
      });

    if (!files.length) {
      throw new SystemToolError(
        'No pages could be rendered from this PDF.'
      );
    }

    return Promise.all(
      files.map((file) =>
        fs.readFile(
          path.join(dir, file)
        )
      )
    );
  });
}

/* -------------------------------------------------------------------------- */
/* Repair PDF                                                                 */
/* -------------------------------------------------------------------------- */

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

    await fs.writeFile(
      input,
      buffer
    );

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

    /* ----------------------------- */
    /* Stage 1: QPDF                 */
    /* ----------------------------- */

    let qpdfAvailable = true;

    try {
      await requireQpdf();
    } catch {
      qpdfAvailable = false;
    }

    if (qpdfAvailable) {
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
            timeout: 120_000,
            maxBuffer:
              10 * 1024 * 1024,
          }
        );

        const repaired =
          await fs.readFile(
            qpdfOutput
          );

        if (
          repaired.length > 0 &&
          await isValidPdf(qpdfOutput)
        ) {
          return repaired;
        }
      } catch (err) {
        console.warn(
          'QPDF repair failed:',
          err
        );
      }
    } else {
      console.warn(
        'QPDF is unavailable; trying Ghostscript.'
      );
    }

    /* ----------------------------- */
    /* Stage 2: Ghostscript          */
    /* ----------------------------- */

    const gsBinary =
      getGhostscriptBinary();

    let gsAvailable = true;

    try {
      await requireGhostscript();
    } catch {
      gsAvailable = false;
    }

    if (gsAvailable) {
      try {
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
            timeout: 180_000,
            maxBuffer:
              10 * 1024 * 1024,
          }
        );

        const repaired =
          await fs.readFile(
            gsOutput
          );

        if (
          repaired.length > 0 &&
          await isValidPdf(gsOutput)
        ) {
          return repaired;
        }
      } catch (err) {
        console.warn(
          'Ghostscript repair failed:',
          err
        );
      }
    }

    if (!qpdfAvailable && !gsAvailable) {
      throw new SystemToolError(
        'PDF repair is unavailable because neither qpdf nor Ghostscript is installed.'
      );
    }

    throw new SystemToolError(
      'This PDF could not be repaired. The file may be severely corrupted or missing required data.'
    );
  });
}

/* -------------------------------------------------------------------------- */
/* Ghostscript resource discovery                                             */
/* -------------------------------------------------------------------------- */

async function findExistingPath(
  candidates: string[]
): Promise<string | null> {
  for (const candidate of candidates) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // Try next candidate.
    }
  }

  return null;
}

async function getGhostscriptVersion(): Promise<string> {
  const binary =
    getGhostscriptBinary();

  try {
    const result =
      await execFileAsync(
        binary,
        ['--version'],
        {
          timeout: 10_000,
        }
      );

    return result.stdout.trim();
  } catch (err) {
    friendlyMissingBinary(
      'ghostscript (gs)',
      err
    );
  }
}

async function findPdfaResources(): Promise<{
  pdfaDef: string;
  iccProfile: string;
}> {
  const version =
    await getGhostscriptVersion();

  const candidates =
    process.platform === 'win32'
      ? {
          pdfa: [
            path.join(
              'C:\\Program Files\\gs',
              `gs${version}`,
              'lib',
              'PDFA_def.ps'
            ),
            path.join(
              'C:\\Program Files\\gs',
              `gs${version}`,
              'lib',
              'PDFA_def.ps'
            ),
          ],

          icc: [
            path.join(
              'C:\\Program Files\\gs',
              `gs${version}`,
              'iccprofiles',
              'srgb.icc'
            ),
          ],
        }
      : {
          pdfa: [
            `/usr/share/ghostscript/${version}/lib/PDFA_def.ps`,
            `/usr/share/ghostscript/${version}/lib/PDFA_def.ps`,
            '/usr/share/ghostscript/lib/PDFA_def.ps',
          ],

          icc: [
            '/usr/share/color/icc/ghostscript/srgb.icc',
            '/usr/share/ghostscript/iccprofiles/srgb.icc',
            `/usr/share/ghostscript/${version}/iccprofiles/srgb.icc`,
          ],
        };

  const pdfaDef =
    await findExistingPath(
      candidates.pdfa
    );

  const iccProfile =
    await findExistingPath(
      candidates.icc
    );

  if (!pdfaDef) {
    throw new SystemToolError(
      `Ghostscript PDF/A definition file was not found. Ghostscript version: ${version}`
    );
  }

  if (!iccProfile) {
    throw new SystemToolError(
      `Ghostscript sRGB ICC profile was not found. Ghostscript version: ${version}`
    );
  }

  return {
    pdfaDef,
    iccProfile,
  };
}

/* -------------------------------------------------------------------------- */
/* PDF -> PDF/A-2b                                                            */
/* -------------------------------------------------------------------------- */

export async function pdfToPdfA(
  buffer: Buffer
): Promise<Buffer> {
  await requireGhostscript();

  return withTempDir(async (dir) => {
    const input = path.join(
      dir,
      'input.pdf'
    );

    const output = path.join(
      dir,
      'output-pdfa.pdf'
    );

    await fs.writeFile(
      input,
      buffer
    );

    const {
      pdfaDef: originalPdfaDef,
      iccProfile,
    } = await findPdfaResources();

    const pdfaDef = path.join(
      dir,
      'PDFA_def.ps'
    );

    let pdfaDefContent =
      await fs.readFile(
        originalPdfaDef,
        'utf8'
      );

    const escapedIccPath =
      iccProfile
        .replace(/\\/g, '/')
        .replace(/\(/g, '\\(')
        .replace(/\)/g, '\\)');

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

    const gsBinary =
      getGhostscriptBinary();

    try {
      await execFileAsync(
        gsBinary,
        [
          '-dBATCH',
          '-dNOPAUSE',
          '-dSAFER',

          `--permit-file-read=${pdfaDef}`,
          `--permit-file-read=${iccProfile}`,
          `--permit-file-read=${input}`,

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
          timeout: 180_000,
          maxBuffer:
            10 * 1024 * 1024,
        }
      );
    } catch (err) {
      if (
        isErrnoException(err) &&
        err.code === 'ENOENT'
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
        execError.message || err
      );

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