import { FileText } from 'lucide-react';

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="container-px mx-auto flex h-16 max-w-6xl items-center justify-between">
        <a href="#top" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
            <FileText size={18} strokeWidth={2.25} />
          </span>
          <span className="text-lg font-semibold tracking-tight text-slate-900">
            Word2PDF
          </span>
        </a>

        <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
          <a href="#top" className="transition-colors hover:text-slate-900">
            Home
          </a>
          <a href="#how-it-works" className="transition-colors hover:text-slate-900">
            How It Works
          </a>
          <a href="#about" className="transition-colors hover:text-slate-900">
            About
          </a>
        </nav>

        <a
          href="#converter"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-card transition-colors hover:bg-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
          Convert Now
        </a>
      </div>
    </header>
  );
}
