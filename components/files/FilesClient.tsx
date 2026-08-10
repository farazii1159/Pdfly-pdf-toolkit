'use client';

import { useEffect, useState } from 'react';
import { FileText, Download, Trash2, Loader2, Inbox } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { getToolBySlug } from '@/lib/tools-config';

type FileOperation = {
  id: string;
  original_filename: string;
  output_file_path: string | null;
  tool_name: string;
  status: 'processing' | 'completed' | 'failed';
  created_at: string;
};

function bucketForPath(path: string): string {
  return path.endsWith('.zip') ? 'images' : 'pdf-files';
}

function statusBadge(status: FileOperation['status']) {
  const styles: Record<string, string> = {
    completed: 'bg-green-100 text-green-700',
    processing: 'bg-amber-100 text-amber-700',
    failed: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${styles[status]}`}>
      {status}
    </span>
  );
}

export default function FilesClient() {
  const [rows, setRows] = useState<FileOperation[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const supabase = getSupabaseBrowserClient();

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('file_operations')
      .select('id, original_filename, output_file_path, tool_name, status, created_at')
      .order('created_at', { ascending: false })
      .limit(50);
    setRows((data as FileOperation[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDownload = async (row: FileOperation) => {
    if (!row.output_file_path) return;
    setBusyId(row.id);
    const bucket = bucketForPath(row.output_file_path);
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(row.output_file_path, 60 * 5);
    setBusyId(null);
    if (error || !data) {
      alert('Could not generate a download link. The file may have been removed.');
      return;
    }
    window.location.href = data.signedUrl;
  };

  const handleDelete = async (row: FileOperation) => {
    if (!confirm(`Delete "${row.original_filename}"? This can't be undone.`)) return;
    setBusyId(row.id);

    if (row.output_file_path) {
      const bucket = bucketForPath(row.output_file_path);
      await supabase.storage.from(bucket).remove([row.output_file_path]);
    }
    await supabase.from('file_operations').delete().eq('id', row.id);

    setRows((prev) => prev.filter((r) => r.id !== row.id));
    setBusyId(null);
  };

const handleClearAll = async () => {
  if (rows.length === 0) return;

  const confirmed = confirm(
    `Delete all ${rows.length} files? This can't be undone.`
  );

  if (!confirmed) return;

  setBusyId('clear-all');

  try {
    // Delete files from storage
    const pdfPaths: string[] = [];
    const imagePaths: string[] = [];

    rows.forEach((row) => {
      if (!row.output_file_path) return;

      const bucket = bucketForPath(row.output_file_path);

      if (bucket === 'images') {
        imagePaths.push(row.output_file_path);
      } else {
        pdfPaths.push(row.output_file_path);
      }
    });

    if (pdfPaths.length > 0) {
      await supabase.storage
        .from('pdf-files')
        .remove(pdfPaths);
    }

    if (imagePaths.length > 0) {
      await supabase.storage
        .from('images')
        .remove(imagePaths);
    }

    // Delete database records
    const { error } = await supabase
      .from('file_operations')
      .delete()
      .in(
        'id',
        rows.map((row) => row.id)
      );

    if (error) {
      throw error;
    }

    // Clear UI
    setRows([]);
  } catch (error) {
    console.error('Clear all files error:', error);
    alert('Could not delete all files. Please try again.');
  } finally {
    setBusyId(null);
  }
};


  if (loading) {
    return (
      <div className="flex justify-center py-16 text-slate-400">
        <Loader2 size={24} className="animate-spin" />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
        <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          <Inbox size={22} />
        </span>
        <p className="text-sm font-medium text-slate-900">No files yet</p>
        <p className="mt-1 text-sm text-slate-500">
          Files you process will show up here once you use a tool.
        </p>
      </div>
    );
  }

return (
  <div className="space-y-4">
    {/* Header */}
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">
          Recent Files
        </h2>

        <p className="text-sm text-slate-500">
          {rows.length} file{rows.length === 1 ? '' : 's'} saved
        </p>
      </div>

      <button
        type="button"
        onClick={handleClearAll}
        disabled={busyId === 'clear-all'}
        className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busyId === 'clear-all' ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Trash2 size={16} />
        )}

        {busyId === 'clear-all' ? 'Clearing...' : 'Clear All'}
      </button>
    </div>

    {/* Files */}
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      {rows.map((row) => {
        const tool = getToolBySlug(row.tool_name);

        return (
          <div
            key={row.id}
            className="flex items-center gap-4 border-b border-slate-100 p-4 last:border-b-0"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
              <FileText size={18} />
            </span>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">
                {row.original_filename}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {tool?.name || row.tool_name} •{' '}
                {new Date(row.created_at).toLocaleString()}
              </p>
            </div>

            {statusBadge(row.status)}

            {row.status === 'completed' && row.output_file_path && (
              <button
                type="button"
                onClick={() => handleDownload(row)}
                disabled={busyId === row.id}
                aria-label="Download"
                className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-brand-600 disabled:opacity-50"
              >
                {busyId === row.id ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Download size={18} />
                )}
              </button>
            )}

            <button
              type="button"
              onClick={() => handleDelete(row)}
              disabled={busyId === row.id || busyId === 'clear-all'}
              aria-label="Delete"
              className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-red-600 disabled:opacity-50"
            >
              <Trash2 size={18} />
            </button>
          </div>
        );
      })}
    </div>
  </div>
);
}