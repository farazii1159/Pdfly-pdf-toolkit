'use client';

import { useCallback, useRef, useState } from 'react';
import {
  UploadCloud,
  FileText,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Download,
  RotateCcw,
} from 'lucide-react';

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

type Status = 'idle' | 'selected' | 'converting' | 'success' | 'error';

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export default function ConverterCard() {
  const [status, setStatus] = useState<Status>('idle');
  const [file, setFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [downloadUrl, setDownloadUrl] = useState<string>('');
  const [downloadFilename, setDownloadFilename] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndSetFile = useCallback((selected: File | undefined | null) => {
    if (!selected) return;

    if (!selected.name.toLowerCase().endsWith('.docx')) {
      setStatus('error');
      setErrorMessage('Only .docx (Word) files are supported.');
      return;
    }

    if (selected.size > MAX_FILE_SIZE_BYTES) {
      setStatus('error');
      setErrorMessage(`File is too large. Maximum size is ${MAX_FILE_SIZE_MB} MB.`);
      return;
    }

    if (selected.size === 0) {
      setStatus('error');
      setErrorMessage('The selected file is empty.');
      return;
    }

    setFile(selected);
    setStatus('selected');
    setErrorMessage('');
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    validateAndSetFile(e.target.files?.[0]);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    validateAndSetFile(e.dataTransfer.files?.[0]);
  };

  const handleRemove = () => {
    setFile(null);
    setStatus('idle');
    setErrorMessage('');
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleReset = () => {
    setFile(null);
    setStatus('idle');
    setErrorMessage('');
    setDownloadUrl('');
    setDownloadFilename('');
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleConvert = async () => {
    if (!file) return;
    setStatus('converting');
    setErrorMessage('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/convert', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Conversion failed. Please try again.');
      }

      setDownloadUrl(data.downloadUrl);
      setDownloadFilename(data.filename || 'converted.pdf');
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrorMessage(
        err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      );
    }
  };

  return (
    <section id="converter" className="container-px mx-auto max-w-2xl pb-16 pt-4">
      <div className="rounded-xl2 border border-slate-200 bg-white p-6 shadow-card sm:p-8">
        {/* IDLE / SELECTED — drop zone or error before a conversion has started */}
        {(status === 'idle' || status === 'selected' || status === 'error') && !file && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
            }}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-14 text-center transition-colors ${
              isDragging
                ? 'border-brand-500 bg-brand-50'
                : 'border-slate-300 bg-slate-50 hover:border-brand-400 hover:bg-brand-50/50'
            }`}
          >
            <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-600">
              <UploadCloud size={24} />
            </span>
            <p className="text-base font-medium text-slate-900">
              Drop your Word file here
            </p>
            <p className="mt-1 text-sm text-slate-500">or click to browse</p>
            <p className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-400">
              DOCX files only • Max {MAX_FILE_SIZE_MB} MB
            </p>
            <input
              ref={inputRef}
              type="file"
              accept=".docx"
              className="hidden"
              onChange={handleInputChange}
            />
          </div>
        )}

        {status === 'error' && !file && (
          <div className="mt-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <p>{errorMessage}</p>
          </div>
        )}

        {/* SELECTED — file chosen, ready to convert */}
        {status === 'selected' && file && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
                <FileText size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">{file.name}</p>
                <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
              </div>
              <button
                onClick={handleRemove}
                aria-label="Remove file"
                className="shrink-0 rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <button
              onClick={handleConvert}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-card transition-colors hover:bg-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
            >
              Convert to PDF
            </button>
          </div>
        )}

        {/* CONVERTING */}
        {status === 'converting' && (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <Loader2 size={36} className="mb-4 animate-spin text-brand-600" />
            <p className="text-base font-medium text-slate-900">
              Converting your document...
            </p>
            <p className="mt-1 text-sm text-slate-500">This usually takes a few seconds.</p>
          </div>
        )}

        {/* SUCCESS */}
        {status === 'success' && (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
              <CheckCircle2 size={28} />
            </span>
            <p className="text-lg font-semibold text-slate-900">Your PDF is ready!</p>
            <p className="mt-1 text-sm text-slate-500">{downloadFilename}</p>

            <div className="mt-6 flex w-full flex-col gap-3 sm:flex-row">
              <a
                href={downloadUrl}
                download={downloadFilename}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-card transition-colors hover:bg-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
              >
                <Download size={16} />
                Download PDF
              </a>
              <button
                onClick={handleReset}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                <RotateCcw size={16} />
                Convert Another File
              </button>
            </div>
          </div>
        )}

        {/* ERROR — shown after a failed conversion attempt (file was selected) */}
        {status === 'error' && file && (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
              <AlertCircle size={28} />
            </span>
            <p className="text-base font-semibold text-slate-900">Conversion failed</p>
            <p className="mt-1 max-w-sm text-sm text-slate-500">{errorMessage}</p>
            <button
              onClick={handleReset}
              className="mt-6 flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              <RotateCcw size={16} />
              Try Again
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
