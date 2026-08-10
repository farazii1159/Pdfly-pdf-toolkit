import { UploadCloud, RefreshCw, Download } from 'lucide-react';

const steps = [
  {
    icon: UploadCloud,
    title: 'Upload',
    description: 'Choose or drag in the .docx file you want to convert.',
  },
  {
    icon: RefreshCw,
    title: 'Convert',
    description: 'We convert your document to a high-quality PDF on the server.',
  },
  {
    icon: Download,
    title: 'Download',
    description: 'Download your finished PDF straight to your device.',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="container-px mx-auto max-w-6xl py-16">
      <div className="mx-auto mb-10 max-w-xl text-center">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          How It Works
        </h2>
        <p className="mt-2 text-slate-600">Three simple steps, no sign-up required.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        {steps.map((step, i) => (
          <div
            key={step.title}
            className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-card"
          >
            <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-brand-100 text-brand-600">
              <step.icon size={20} />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
              Step {i + 1}
            </p>
            <p className="mt-1 text-base font-semibold text-slate-900">{step.title}</p>
            <p className="mt-2 text-sm text-slate-500">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
