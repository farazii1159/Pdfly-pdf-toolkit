import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default function Alert({
  type = 'error',
  message,
}: {
  type?: 'error' | 'success';
  message: string;
}) {
  if (!message) return null;

  const isError = type === 'error';

  return (
    <div
      className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${
        isError
          ? 'border-red-200 bg-red-50 text-red-700'
          : 'border-green-200 bg-green-50 text-green-700'
      }`}
    >
      {isError ? (
        <AlertCircle size={16} className="mt-0.5 shrink-0" />
      ) : (
        <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
      )}
      <p>{message}</p>
    </div>
  );
}
