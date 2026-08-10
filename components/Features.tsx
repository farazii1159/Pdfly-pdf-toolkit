import { Zap, MousePointerClick, ShieldCheck, Smartphone } from 'lucide-react';

const features = [
  {
    icon: Zap,
    title: 'Fast Conversion',
    description: 'Your document is converted to PDF in seconds.',
  },
  {
    icon: MousePointerClick,
    title: 'Simple Interface',
    description: 'No clutter, no learning curve — just upload and convert.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure File Storage',
    description: 'Files are stored securely using Supabase Storage.',
  },
  {
    icon: Smartphone,
    title: 'Mobile Friendly',
    description: 'Works smoothly on your phone, tablet, or desktop.',
  },
];

export default function Features() {
  return (
    <section id="about" className="bg-white py-16">
      <div className="container-px mx-auto max-w-6xl">
        <div className="mx-auto mb-10 max-w-xl text-center">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Why PDFly?
          </h2>
          <p className="mt-2 text-slate-600">
            Everything you need for quick, reliable document conversion.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-slate-200 bg-slate-50 p-6"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-brand-100 text-brand-600">
                <feature.icon size={20} />
              </div>
              <p className="text-base font-semibold text-slate-900">{feature.title}</p>
              <p className="mt-2 text-sm text-slate-500">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
