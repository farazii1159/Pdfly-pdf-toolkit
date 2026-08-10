import { FileText } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="container-px mx-auto max-w-6xl py-10">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-600 text-white">
              <FileText size={14} />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">Word2PDF</p>
              <p className="text-xs text-slate-500">
                Simple document conversion for everyone.
              </p>
            </div>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-600">
            <a href="#top" className="hover:text-slate-900">
              Home
            </a>
            <a href="#how-it-works" className="hover:text-slate-900">
              How It Works
            </a>
            <a href="#" className="hover:text-slate-900">
              Privacy
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-900"
            >
              GitHub
            </a>
          </nav>
        </div>

        <p className="mt-8 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} Word2PDF. Built for the DevOps Internship program.
        </p>
      </div>
    </footer>
  );
}
