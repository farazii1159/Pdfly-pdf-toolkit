'use client';

import {
  useEffect,
  useRef,
  useState,
  type DragEvent,
} from 'react';
import SignatureCanvas from 'react-signature-canvas';
import Link from 'next/link';

import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Code2,
  Combine,
  Crop,
  Download,
  Edit3,
  EyeOff,
  FileArchive,
  FileDown,
  FileImage,
  FileText,
  FileType,
  FormInput,
  GitCompare,
  GripVertical,
  Hash,
  Image as ImageIcon,
  Languages,
  ListOrdered,
  Loader2,
  Lock,
  Minimize2,
  PenLine,
  Presentation,
  RotateCcw,
  RotateCw,
  ScanLine,
  ScanText,
  Scissors,
  Sheet,
  Sparkles,
  Unlock,
  UploadCloud,
  Workflow,
  Wrench,
  X,
  type LucideIcon,
} from 'lucide-react';

import { getToolBySlug } from '@/lib/tools-config';

type Status =
  | 'idle'
  | 'selected'
  | 'processing'
  | 'success'
  | 'error';

type ApiResponse = {
  success?: boolean;
  downloadUrl?: string;
  filename?: string;
  error?: string;
};

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES =
  MAX_FILE_SIZE_MB * 1024 * 1024;

const ICONS: Record<string, LucideIcon> = {
  Combine,
  Scissors,
  Minimize2,
  FileType,
  Presentation,
  Sheet,
  ImageIcon,
  FileImage,
  Code2,
  FileDown,
  RotateCw,
  ListOrdered,
  Crop,
  Hash,
  PenLine,
  Edit3,
  FormInput,
  EyeOff,
  Lock,
  Unlock,
  ScanText,
  Wrench,
  GitCompare,
  FileArchive,
  Sparkles,
  Languages,
  ScanLine,
  Workflow,
};

function formatFileSize(bytes: number): string {
  if (bytes === 0) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB'];

  const index = Math.floor(
    Math.log(bytes) / Math.log(1024)
  );

  const safeIndex = Math.min(
    index,
    units.length - 1
  );

  const value =
    bytes / Math.pow(1024, safeIndex);

  return `${value.toFixed(
    safeIndex === 0 ? 0 : 1
  )} ${units[safeIndex]}`;
}

export default function ToolWorkspace({
  slug,
}: {
  slug: string;
}) {
  const tool = getToolBySlug(slug);

  /*
   * Hooks must always be declared before
   * any conditional return.
   */

  const inputRef =
    useRef<HTMLInputElement | null>(null);

  const signatureRef =
    useRef<SignatureCanvas | null>(null);

  const [status, setStatus] = useState<Status>('idle');

  const [files, setFiles] =
    useState<File[]>([]);

  const [errorMessage, setErrorMessage] =
    useState('');

  const [downloadUrl, setDownloadUrl] =
    useState('');

  const [downloadFilename, setDownloadFilename] =
    useState('');

  const [isDragging, setIsDragging] =
    useState(false);

  /*
   * Signature state
   */

  const [signaturePage, setSignaturePage] =
    useState('1');

  const [signatureX, setSignatureX] =
    useState('50');

  const [signatureY, setSignatureY] =
    useState('50');

  const [signatureWidth, setSignatureWidth] =
    useState('160');

  const [signatureHeight, setSignatureHeight] =
    useState('70');

  /*
   * Edit PDF state
   */

  const [editText, setEditText] =
    useState('');

  const [editPage, setEditPage] =
    useState('1');

  const [editX, setEditX] =
    useState('50');

  const [editY, setEditY] =
    useState('50');

  const [editFontSize, setEditFontSize] =
    useState('16');

  const [editMode, setEditMode] =
    useState(false);

  /*
   * PDF preview object URL.
   *
   * Created only when a file exists and
   * automatically revoked when replaced/unmounted.
   */

  const [previewUrl, setPreviewUrl] =
    useState('');

  useEffect(() => {
    if (
      tool?.slug !== 'edit' ||
      !files[0]
    ) {
      setPreviewUrl('');
      return;
    }

    const objectUrl =
      URL.createObjectURL(files[0]);

    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [files, tool?.slug]);

  /*
   * Dynamic tool fields
   */

  const [fieldValues, setFieldValues] =
    useState<Record<string, string>>(() =>
      Object.fromEntries(
        (tool?.fields || []).map((field) => [
          field.name,
          field.defaultValue || '',
        ])
      )
    );

  /*
   * Tool not found
   */

  if (!tool) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="rounded-xl2 border border-slate-200 bg-white p-8 text-center shadow-card">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
            <AlertCircle size={28} />
          </div>

          <h1 className="mt-4 text-xl font-bold text-slate-900">
            Tool not found
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            The requested PDF tool does not exist.
          </p>

          <Link
            href="/dashboard"
            className="mx-auto mt-6 flex w-fit items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const Icon =
    ICONS[tool.icon] ||
    ICONS[tool.name.replace(/\s+/g, '')] ||
    FileText;

  const acceptedExtensions =
    tool.accept
      .split(',')
      .map((extension) =>
        extension.trim().toLowerCase()
      )
      .filter(Boolean);

  /*
   * Validate selected files
   */

  const validateFiles = (
    selected: FileList | File[]
  ): File[] | null => {
    const list = Array.from(selected);

    if (list.length === 0) {
      return null;
    }

    for (const file of list) {
      const extension = file.name.includes('.')
        ? `.${file.name
            .split('.')
            .pop()
            ?.toLowerCase()}`
        : '';

      if (
        !acceptedExtensions.includes(extension)
      ) {
        setStatus('error');

        setErrorMessage(
          `Only ${tool.accept.toUpperCase()} files are supported.`
        );

        return null;
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        setStatus('error');

        setErrorMessage(
          `"${file.name}" exceeds the ${MAX_FILE_SIZE_MB} MB limit.`
        );

        return null;
      }

      if (file.size === 0) {
        setStatus('error');

        setErrorMessage(
          `"${file.name}" is empty.`
        );

        return null;
      }
    }

    /*
     * Single-file tools accept only one file.
     */

    if (!tool.multiple) {
      return [list[0]];
    }

    return list;
  };

  /*
   * Handle file selection
   */

  const handleFilesSelected = (
    selected: FileList | File[] | null
  ) => {
    if (!selected) {
      return;
    }

    const valid =
      validateFiles(selected);

    if (!valid || valid.length === 0) {
      return;
    }

    if (tool.multiple) {
      setFiles((current) => {
        const combined = [
          ...current,
          ...valid,
        ];

        /*
         * Remove duplicate files.
         */

        return combined.filter(
          (file, index, array) =>
            index ===
            array.findIndex(
              (other) =>
                other.name === file.name &&
                other.size === file.size &&
                other.lastModified ===
                  file.lastModified
            )
        );
      });
    } else {
      setFiles(valid);
    }

    setStatus('selected');
    setErrorMessage('');

    /*
     * Reset input so the same file
     * can be selected again.
     */

    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  /*
   * Drag and drop
   */

  const handleDrop = (
    event: DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
    event.stopPropagation();

    setIsDragging(false);

    handleFilesSelected(
      event.dataTransfer.files
    );
  };

  /*
   * Remove selected file
   */

  const removeFile = (index: number) => {
    setFiles((current) => {
      const next = current.filter(
        (_, currentIndex) =>
          currentIndex !== index
      );

      if (next.length === 0) {
        setStatus('idle');
        setErrorMessage('');
      }

      return next;
    });
  };

  /*
   * Move file up/down
   */

  const moveFile = (
    index: number,
    direction: -1 | 1
  ) => {
    setFiles((current) => {
      const next = [...current];

      const target =
        index + direction;

      if (
        target < 0 ||
        target >= next.length
      ) {
        return current;
      }

      [
        next[index],
        next[target],
      ] = [
        next[target],
        next[index],
      ];

      return next;
    });
  };

  /*
   * Reset workspace
   */

  const handleReset = () => {
    setFiles([]);

    setStatus('idle');

    setErrorMessage('');

    setDownloadUrl('');

    setDownloadFilename('');

    /*
     * Signature reset
     */

    setSignaturePage('1');
    setSignatureX('50');
    setSignatureY('50');
    setSignatureWidth('160');
    setSignatureHeight('70');

    signatureRef.current?.clear();

    /*
     * Edit reset
     */

    setEditText('');
    setEditPage('1');
    setEditX('50');
    setEditY('50');
    setEditFontSize('16');
    setEditMode(false);

    /*
     * Reset dynamic fields
     */

    setFieldValues(
      Object.fromEntries(
        (tool.fields || []).map((field) => [
          field.name,
          field.defaultValue || '',
        ])
      )
    );

    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  /*
   * Required fields
   */

  const missingRequiredField =
    (tool.fields || []).find(
      (field) =>
        field.required &&
        !fieldValues[field.name]?.trim()
    );

    const isProcessing = status === 'processing';

  /*
   * Handle processing
   */

  const handleProcess = async () => {
    /*
     * Prevent duplicate requests.
     */

    if (status === 'processing') {
      return;
    }

    /*
     * Validate files.
     */

    if (files.length === 0) {
      setStatus('error');

      setErrorMessage(
        'Please select at least one file.'
      );

      return;
    }

    /*
     * Merge requires at least two files.
     */

    if (
      tool.slug === 'merge' &&
      files.length < 2
    ) {
      setStatus('error');

      setErrorMessage(
        'Please select at least two PDF files to merge.'
      );

      return;
    }

    /*
     * Required dynamic fields.
     */

    if (missingRequiredField) {
      setStatus('error');

      setErrorMessage(
        `Please fill in "${missingRequiredField.label}".`
      );

      return;
    }

    /*
     * Edit PDF validation.
     */

    if (tool.slug === 'edit') {
      if (!editText.trim()) {
        setStatus('error');

        setErrorMessage(
          'Please enter the text you want to add.'
        );

        return;
      }

      const pageNumber =
        Number(editPage);

      const fontSize =
        Number(editFontSize);

      const x =
        Number(editX);

      const y =
        Number(editY);

      if (
        !Number.isFinite(pageNumber) ||
        pageNumber < 1
      ) {
        setStatus('error');

        setErrorMessage(
          'Please enter a valid PDF page number.'
        );

        return;
      }

      if (
        !Number.isFinite(fontSize) ||
        fontSize < 6 ||
        fontSize > 100
      ) {
        setStatus('error');

        setErrorMessage(
          'Font size must be between 6 and 100.'
        );

        return;
      }

      if (
        !Number.isFinite(x) ||
        x < 0
      ) {
        setStatus('error');

        setErrorMessage(
          'Please enter a valid X position.'
        );

        return;
      }

      if (
        !Number.isFinite(y) ||
        y < 0
      ) {
        setStatus('error');

        setErrorMessage(
          'Please enter a valid Y position.'
        );

        return;
      }
    }

    /*
     * Signature validation.
     */

    if (tool.slug === 'sign') {
      const canvas =
        signatureRef.current;

      if (
        !canvas ||
        canvas.isEmpty()
      ) {
        setStatus('error');

        setErrorMessage(
          'Please draw your signature before applying it.'
        );

        return;
      }

      const page =
        Number(signaturePage);

      const x =
        Number(signatureX);

      const y =
        Number(signatureY);

      const width =
        Number(signatureWidth);

      const height =
        Number(signatureHeight);

      if (
        !Number.isFinite(page) ||
        page < 1
      ) {
        setStatus('error');

        setErrorMessage(
          'Please enter a valid signature page number.'
        );

        return;
      }

      if (
        !Number.isFinite(x) ||
        x < 0 ||
        !Number.isFinite(y) ||
        y < 0
      ) {
        setStatus('error');

        setErrorMessage(
          'Please enter valid signature coordinates.'
        );

        return;
      }

      if (
        !Number.isFinite(width) ||
        width < 20 ||
        width > 500
      ) {
        setStatus('error');

        setErrorMessage(
          'Signature width must be between 20 and 500.'
        );

        return;
      }

      if (
        !Number.isFinite(height) ||
        height < 20 ||
        height > 300
      ) {
        setStatus('error');

        setErrorMessage(
          'Signature height must be between 20 and 300.'
        );

        return;
      }
    }

    setStatus('processing');
    setErrorMessage('');

    try {
      const formData =
        new FormData();

      /*
       * Tool slug
       */

      formData.append(
        'tool',
        tool.slug
      );

      /*
       * Selected files
       */

      files.forEach((file) => {
        formData.append(
          'files',
          file,
          file.name
        );
      });

      /*
       * Sign PDF
       */

      if (tool.slug === 'sign') {
        const canvas =
          signatureRef.current;

        if (
          !canvas ||
          canvas.isEmpty()
        ) {
          throw new Error(
            'Please draw your signature before applying it.'
          );
        }

        const signatureDataUrl =
          canvas.toDataURL(
            'image/png'
          );

        const signatureResponse =
          await fetch(
            signatureDataUrl
          );

        if (
          !signatureResponse.ok
        ) {
          throw new Error(
            'Could not read the signature image.'
          );
        }

        const signatureBlob =
          await signatureResponse.blob();

        const signatureFile =
          new File(
            [signatureBlob],
            'signature.png',
            {
              type: 'image/png',
            }
          );

        formData.append(
          'signature',
          signatureFile,
          'signature.png'
        );

        formData.append(
          'pageNumber',
          signaturePage
        );

        formData.append(
          'x',
          signatureX
        );

        formData.append(
          'y',
          signatureY
        );

        formData.append(
          'width',
          signatureWidth
        );

        formData.append(
          'height',
          signatureHeight
        );
      }

      /*
       * Edit PDF
       */

      if (tool.slug === 'edit') {
        formData.append(
          'text',
          editText.trim()
        );

        formData.append(
          'page',
          editPage
        );

        formData.append(
          'x',
          editX
        );

        formData.append(
          'y',
          editY
        );

        formData.append(
          'fontSize',
          editFontSize
        );
      }

      /*
       * Dynamic tool fields
       */

      Object.entries(
        fieldValues
      ).forEach(
        ([key, value]) => {
          formData.append(
            key,
            value
          );
        }
      );

      /*
       * API request
       */

      const response =
        await fetch(
          '/api/tools',
          {
            method: 'POST',
            body: formData,
          }
        );

      /*
       * Parse response safely.
       */

      let data: ApiResponse;

      try {
        data =
          (await response.json()) as ApiResponse;
      } catch {
        throw new Error(
          'The server returned an invalid response.'
        );
      }

      /*
       * API error
       */

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            'Processing failed. Please try again.'
        );
      }

      /*
       * Download URL is required.
       */

      if (!data.downloadUrl) {
        throw new Error(
          'The file was processed, but no download link was returned.'
        );
      }

      /*
       * Success
       */

      setDownloadUrl(
        data.downloadUrl
      );

      setDownloadFilename(
        data.filename ||
          'result.pdf'
      );

      setStatus('success');
    } catch (error) {
      setStatus('error');

      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Something went wrong. Please try again.'
      );
    }
  };

  /*
   * Keyboard accessibility for upload area.
   */

  const handleUploadKeyDown = (
    event: React.KeyboardEvent<HTMLDivElement>
  ) => {
    if (
      event.key === 'Enter' ||
      event.key === ' '
    ) {
      event.preventDefault();

      inputRef.current?.click();
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      {/* Back */}

      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft size={16} />
        Back to Dashboard
      </Link>

      {/* Header */}

      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
          <Icon size={22} />
        </span>

        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            {tool.name}
          </h1>

          <p className="text-sm text-slate-500">
            {tool.description}
          </p>
        </div>
      </div>

      {/* Workspace */}

      <div className="rounded-xl2 border border-slate-200 bg-white p-6 shadow-card sm:p-8">
        {/* Hidden file input */}

        <input
          ref={inputRef}
          type="file"
          accept={tool.accept}
          multiple={tool.multiple}
          className="hidden"
          onChange={(event) => {
            handleFilesSelected(
              event.target.files
            );
          }}
        />

        {/* Upload Area */}

        {(status === 'idle' ||
          (status === 'error' &&
            files.length === 0)) && (
          <>
            <div
              onDragOver={(event) => {
                event.preventDefault();
                event.stopPropagation();

                setIsDragging(true);
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                event.stopPropagation();

                setIsDragging(false);
              }}
              onDrop={handleDrop}
              onClick={() =>
                inputRef.current?.click()
              }
              onKeyDown={
                handleUploadKeyDown
              }
              role="button"
              tabIndex={0}
              aria-label={`Upload ${tool.multiple ? 'files' : 'file'}`}
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
                Drop your{' '}
                {tool.multiple
                  ? 'files'
                  : 'file'}{' '}
                here
              </p>

              <p className="mt-1 text-sm text-slate-500">
                or click to browse
              </p>

              <p className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-400">
                {tool.accept
                  .replace(/\./g, '')
                  .toUpperCase()}{' '}
                only • Max{' '}
                {MAX_FILE_SIZE_MB} MB
                {tool.multiple
                  ? ' each'
                  : ''}
              </p>
            </div>

            {status === 'error' &&
              files.length === 0 && (
                <div className="mt-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  <AlertCircle
                    size={18}
                    className="mt-0.5 shrink-0"
                  />

                  <p>
                    {errorMessage}
                  </p>
                </div>
              )}
          </>
        )}

        {/* Selected Files */}

        {status === 'selected' &&
          files.length > 0 && (
            <div className="space-y-5">
              {/* File List */}

              <div className="space-y-2">
                {files.map(
                  (file, index) => (
                    <div
                      key={`${file.name}-${file.lastModified}-${index}`}
                      className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3"
                    >
                      {tool.multiple &&
                        files.length > 1 && (
                          <span className="flex shrink-0 text-slate-300">
                            <GripVertical
                              size={16}
                            />
                          </span>
                        )}

                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
                        <FileText
                          size={18}
                        />
                      </span>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {file.name}
                        </p>

                        <p className="text-xs text-slate-500">
                          {formatFileSize(
                            file.size
                          )}
                        </p>
                      </div>

                      {tool.multiple &&
                        files.length > 1 && (
                          <div className="flex shrink-0 gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                moveFile(
                                  index,
                                  -1
                                )
                              }
                              disabled={
                                index === 0
                              }
                              className="rounded px-1.5 py-0.5 text-xs text-slate-400 hover:bg-slate-200 hover:text-slate-600 disabled:opacity-30"
                              aria-label="Move file up"
                            >
                              ↑
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                moveFile(
                                  index,
                                  1
                                )
                              }
                              disabled={
                                index ===
                                files.length -
                                  1
                              }
                              className="rounded px-1.5 py-0.5 text-xs text-slate-400 hover:bg-slate-200 hover:text-slate-600 disabled:opacity-30"
                              aria-label="Move file down"
                            >
                              ↓
                            </button>
                          </div>
                        )}

                      <button
                        type="button"
                        onClick={() =>
                          removeFile(index)
                        }
                        aria-label={`Remove ${file.name}`}
                        className="shrink-0 rounded-md p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )
                )}

                {/* Add more files */}

                {tool.multiple && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          inputRef.current
                        ) {
                          inputRef.current.value =
                            '';

                          inputRef.current.click();
                        }
                      }}
                      className="w-full rounded-lg border border-dashed border-slate-300 py-2.5 text-sm font-medium text-slate-500 hover:border-brand-400 hover:text-brand-600"
                    >
                      + Add more files
                    </button>

                    <p className="text-center text-xs text-slate-400">
                      {files.length}{' '}
                      file
                      {files.length ===
                      1
                        ? ''
                        : 's'}{' '}
                      selected
                    </p>
                  </>
                )}
              </div>

              {/* Edit PDF */}

              {tool.slug === 'edit' && (
                <div className="space-y-5 border-t border-slate-100 pt-5">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">
                      Add Text to PDF
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                      Enter your text, then choose where
                      you want to place it on the PDF.
                    </p>
                  </div>

                  {/* Text */}

                  <div>
                    <label
                      htmlFor="editText"
                      className="mb-1.5 block text-sm font-medium text-slate-700"
                    >
                      Text
                    </label>

                    <textarea
                      id="editText"
                      value={editText}
                      onChange={(event) =>
                        setEditText(
                          event.target.value
                        )
                      }
                      placeholder="Enter text to add to the PDF..."
                      rows={3}
                      className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>

                  {/* Controls */}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="editPage"
                        className="mb-1.5 block text-sm font-medium text-slate-700"
                      >
                        PDF Page
                      </label>

                      <input
                        id="editPage"
                        type="number"
                        min="1"
                        value={editPage}
                        onChange={(event) =>
                          setEditPage(
                            event.target.value
                          )
                        }
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="editFontSize"
                        className="mb-1.5 block text-sm font-medium text-slate-700"
                      >
                        Font Size
                      </label>

                      <input
                        id="editFontSize"
                        type="number"
                        min="6"
                        max="100"
                        value={editFontSize}
                        onChange={(event) =>
                          setEditFontSize(
                            event.target.value
                          )
                        }
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="editX"
                        className="mb-1.5 block text-sm font-medium text-slate-700"
                      >
                        X Position
                      </label>

                      <input
                        id="editX"
                        type="number"
                        min="0"
                        value={editX}
                        onChange={(event) =>
                          setEditX(
                            event.target.value
                          )
                        }
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="editY"
                        className="mb-1.5 block text-sm font-medium text-slate-700"
                      >
                        Y Position
                      </label>

                      <input
                        id="editY"
                        type="number"
                        min="0"
                        value={editY}
                        onChange={(event) =>
                          setEditY(
                            event.target.value
                          )
                        }
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                    </div>
                  </div>

                  {/* PDF Preview */}

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-700">
                        PDF Preview
                      </p>

                      <span className="text-xs text-slate-400">
                        {editMode
                          ? 'Click on the PDF'
                          : 'Choose a position'}
                      </span>
                    </div>

                    <div
                      className={`relative mx-auto w-full max-w-2xl overflow-hidden rounded-lg border bg-slate-100 ${
                        editMode
                          ? 'border-brand-400 ring-2 ring-brand-100'
                          : 'border-slate-300'
                      }`}
                      style={{
                        aspectRatio:
                          '595 / 842',
                      }}
                      onClick={(event) => {
                        if (!editMode) {
                          return;
                        }

                        const rect =
                          event.currentTarget.getBoundingClientRect();

                        const relativeX =
                          event.clientX -
                          rect.left;

                        const relativeY =
                          event.clientY -
                          rect.top;

                        /*
                         * A4 PDF coordinate system:
                         * 595 x 842 points.
                         */

                        const pdfX =
                          (relativeX /
                            rect.width) *
                          595;

                        const pdfY =
                          842 -
                          (relativeY /
                            rect.height) *
                            842;

                        setEditX(
                          String(
                            Math.round(
                              pdfX
                            )
                          )
                        );

                        setEditY(
                          String(
                            Math.round(
                              pdfY
                            )
                          )
                        );

                        setEditMode(false);
                      }}
                    >
                      {previewUrl ? (
                        <iframe
                          src={previewUrl}
                          title="PDF Preview"
                          className="absolute inset-0 h-full w-full border-0"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-400">
                          PDF preview unavailable
                        </div>
                      )}

                      {/* Click layer */}

                      {editMode && (
                        <div className="absolute inset-0 z-10 cursor-crosshair bg-brand-500/5">
                          <div className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 rounded-full bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-white">
                            Click where you want to place the text
                          </div>
                        </div>
                      )}

                      {/* Text preview */}

                      {editText.trim() && (
                        <div
                          className="pointer-events-none absolute z-20 max-w-[80%] whitespace-pre-wrap break-words border border-dashed border-brand-500 bg-white/80 px-1 text-slate-900"
                          style={{
                            left: `${
                              (Number(editX) /
                                595) *
                              100
                            }%`,
                            bottom: `${
                              (Number(editY) /
                                842) *
                              100
                            }%`,
                            fontSize: `${Math.min(
                              Math.max(
                                Number(
                                  editFontSize
                                ),
                                6
                              ),
                              100
                            )}px`,
                            transform:
                              'translateY(100%)',
                          }}
                        >
                          {editText}
                        </div>
                      )}
                    </div>

                    <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                      <button
                        type="button"
                        onClick={() =>
                          setEditMode(
                            (current) =>
                              !current
                          )
                        }
                        className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                          editMode
                            ? 'bg-brand-600 text-white hover:bg-brand-700'
                            : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <Edit3 size={16} />

                        {editMode
                          ? 'Click on PDF...'
                          : 'Choose Position'}
                      </button>
                    </div>

                    <p className="mt-2 text-center text-xs text-slate-400">
                      Current position: X{' '}
                      {editX}, Y{' '}
                      {editY}
                    </p>
                  </div>
                </div>
              )}

              {/* Sign PDF */}

              {tool.slug === 'sign' && (
                <div className="space-y-5 border-t border-slate-100 pt-5">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">
                      Draw your signature
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                      Draw your signature below using
                      your mouse or touch screen.
                    </p>
                  </div>

                  <div className="overflow-hidden rounded-lg border border-slate-300 bg-white">
                    <SignatureCanvas
                      ref={signatureRef}
                      penColor="black"
                      canvasProps={{
                        className:
                          'h-40 w-full touch-none',
                      }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      signatureRef.current?.clear();
                    }}
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Clear Signature
                  </button>

                  <div className="grid gap-4 sm:grid-cols-2">
                    {/* Page */}

                    <div>
                      <label
                        htmlFor="signaturePage"
                        className="mb-1.5 block text-sm font-medium text-slate-700"
                      >
                        PDF Page
                      </label>

                      <input
                        id="signaturePage"
                        type="number"
                        min="1"
                        value={
                          signaturePage
                        }
                        onChange={(event) =>
                          setSignaturePage(
                            event.target.value
                          )
                        }
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                    </div>

                    {/* Width */}

                    <div>
                      <label
                        htmlFor="signatureWidth"
                        className="mb-1.5 block text-sm font-medium text-slate-700"
                      >
                        Signature Width
                      </label>

                      <input
                        id="signatureWidth"
                        type="number"
                        min="20"
                        max="500"
                        value={
                          signatureWidth
                        }
                        onChange={(event) =>
                          setSignatureWidth(
                            event.target.value
                          )
                        }
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                    </div>

                    {/* X */}

                    <div>
                      <label
                        htmlFor="signatureX"
                        className="mb-1.5 block text-sm font-medium text-slate-700"
                      >
                        Horizontal Position
                      </label>

                      <input
                        id="signatureX"
                        type="number"
                        min="0"
                        value={signatureX}
                        onChange={(event) =>
                          setSignatureX(
                            event.target.value
                          )
                        }
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                    </div>

                    {/* Y */}

                    <div>
                      <label
                        htmlFor="signatureY"
                        className="mb-1.5 block text-sm font-medium text-slate-700"
                      >
                        Vertical Position
                      </label>

                      <input
                        id="signatureY"
                        type="number"
                        min="0"
                        value={signatureY}
                        onChange={(event) =>
                          setSignatureY(
                            event.target.value
                          )
                        }
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                    </div>

                    {/* Height */}

                    <div>
                      <label
                        htmlFor="signatureHeight"
                        className="mb-1.5 block text-sm font-medium text-slate-700"
                      >
                        Signature Height
                      </label>

                      <input
                        id="signatureHeight"
                        type="number"
                        min="20"
                        max="300"
                        value={
                          signatureHeight
                        }
                        onChange={(event) =>
                          setSignatureHeight(
                            event.target.value
                          )
                        }
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Dynamic Fields */}

              {tool.fields &&
                tool.fields.length > 0 && (
                  <div className="space-y-4 border-t border-slate-100 pt-5">
                    {tool.fields.map(
                      (field) => (
                        <div
                          key={
                            field.name
                          }
                        >
                          <label
                            htmlFor={
                              field.name
                            }
                            className="mb-1.5 block text-sm font-medium text-slate-700"
                          >
                            {field.label}

                            {field.required && (
                              <span className="ml-1 text-red-500">
                                *
                              </span>
                            )}
                          </label>

                          {field.type ===
                          'select' ? (
                            <select
                              id={
                                field.name
                              }
                              value={
                                fieldValues[
                                  field.name
                                ] || ''
                              }
                              onChange={(
                                event
                              ) =>
                                setFieldValues(
                                  (
                                    previous
                                  ) => ({
                                    ...previous,
                                    [field.name]:
                                      event
                                        .target
                                        .value,
                                  })
                                )
                              }
                              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                            >
                              {field.options?.map(
                                (
                                  option
                                ) => (
                                  <option
                                    key={
                                      option.value
                                    }
                                    value={
                                      option.value
                                    }
                                  >
                                    {
                                      option.label
                                    }
                                  </option>
                                )
                              )}
                            </select>
                          ) : (
                            <input
                              id={
                                field.name
                              }
                              type={
                                field.type
                              }
                              value={
                                fieldValues[
                                  field.name
                                ] || ''
                              }
                              onChange={(
                                event
                              ) =>
                                setFieldValues(
                                  (
                                    previous
                                  ) => ({
                                    ...previous,
                                    [field.name]:
                                      event
                                        .target
                                        .value,
                                  })
                                )
                              }
                              placeholder={
                                field.placeholder
                              }
                              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                            />
                          )}
                        </div>
                      )
                    )}
                  </div>
                )}

              {/* Process Button */}

              <button
                type="button"
                onClick={handleProcess}
                disabled={
               Boolean(missingRequiredField) ||
                isProcessing
                }
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-card transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isProcessing ? (
                  <>
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                    Processing...
                  </>
                ) : tool.slug === 'merge' ? (
                  <>
                    Merge{' '}
                    {files.length}{' '}
                    PDF
                    {files.length ===
                    1
                      ? ''
                      : 's'}
                  </>
                ) : tool.slug ===
                  'edit' ? (
                  <>
                    <Edit3 size={17} />
                    Edit PDF
                  </>
                ) : tool.slug ===
                  'sign' ? (
                  <>
                    <PenLine size={17} />
                    Sign PDF
                  </>
                ) : (
                  <>
                    <Wrench size={17} />
                    Process File
                  </>
                )}
              </button>
            </div>
          )}

        {/* Processing */}

        {status === 'processing' && (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <Loader2
              size={36}
              className="mb-4 animate-spin text-brand-600"
            />

            <p className="text-base font-medium text-slate-900">
              Processing your files...
            </p>

            <p className="mt-1 text-sm text-slate-500">
              This usually takes a few seconds.
            </p>
          </div>
        )}

        {/* Success */}

        {status === 'success' && (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
              <CheckCircle2
                size={28}
              />
            </span>

            <p className="text-lg font-semibold text-slate-900">
              Your file is ready!
            </p>

            <p className="mt-1 max-w-full truncate text-sm text-slate-500">
              {downloadFilename}
            </p>

            <div className="mt-6 flex w-full flex-col gap-3 sm:flex-row">
              <a
                href={downloadUrl}
                download={
                  downloadFilename
                }
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-card hover:bg-brand-700"
              >
                <Download size={16} />
                Download
              </a>

              <button
                type="button"
                onClick={
                  handleReset
                }
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <RotateCcw
                  size={16}
                />
                Start Again
              </button>
            </div>
          </div>
        )}

        {/* Error after files are selected */}

        {status === 'error' &&
          files.length > 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
                <AlertCircle
                  size={28}
                />
              </span>

              <p className="text-base font-semibold text-slate-900">
                Something went wrong
              </p>

              <p className="mt-1 max-w-sm text-sm text-slate-500">
                {errorMessage}
              </p>

              <div className="mt-6 flex w-full flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => {
                    setStatus(
                      'selected'
                    );

                    setErrorMessage(
                      ''
                    );
                  }}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700"
                >
                  <RotateCcw
                    size={16}
                  />
                  Continue
                </button>

                <button
                  type="button"
                  onClick={
                    handleReset
                  }
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Start Again
                </button>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}