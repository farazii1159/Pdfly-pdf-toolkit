import { randomUUID } from 'crypto';

/**
 * Removes anything that isn't safe in a filename/storage path.
 * Keeps letters, numbers, dots, dashes and underscores only.
 */
export function sanitizeFilename(filename: string): string {
  const trimmed = filename.trim();
  const base = trimmed.replace(/[^a-zA-Z0-9._-]/g, '_');
  // Avoid empty or hidden-file names
  return base.length > 0 ? base.replace(/^\.+/, '') || 'file' : 'file';
}

/**
 * Generates a unique, collision-safe storage path for a given filename.
 * Example: 2026/08/03/9c2e2b7e-…/report.docx
 */
export function buildStoragePath(originalFilename: string, extension: string): string {
  const id = randomUUID();
  const safeName = sanitizeFilename(originalFilename.replace(/\.[^/.]+$/, ''));
  const now = new Date();
  const datePrefix = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(
    now.getDate()
  ).padStart(2, '0')}`;
  return `${datePrefix}/${id}/${safeName}.${extension}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export const MAX_FILE_SIZE_BYTES = Number(process.env.MAX_FILE_SIZE_MB || 10) * 1024 * 1024;

export function isDocxFile(file: { name: string; type?: string }): boolean {
  const nameOk = file.name.toLowerCase().endsWith('.docx');
  const validMimeTypes = [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/octet-stream', // some browsers/OSes send this for .docx
    '',
  ];
  const typeOk = !file.type || validMimeTypes.includes(file.type);
  return nameOk && typeOk;
}
