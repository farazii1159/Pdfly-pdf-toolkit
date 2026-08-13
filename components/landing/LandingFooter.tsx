import Link from 'next/link';
import { FileStack } from 'lucide-react';

export default function LandingFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-6 py-10 sm:px-8">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center gap-2 md:justify-start">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
                <FileStack size={19} />
              </span>

              <span className="text-lg font-bold text-slate-900">
                PDFly
              </span>
            </div>

            <p className="mt-2 text-sm text-slate-500">
              Everything you need to work with your documents.
            </p>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-600">
            <Link
              href="/"
              className="hover:text-slate-900"
            >
              Home
            </Link>

            <a
              href="#tools"
              className="hover:text-slate-900"
            >
              Tools
            </a>

            <a
              href="#privacy"
              className="hover:text-slate-900"
            >
              Privacy
            </a>

            <a
              href="#terms"
              className="hover:text-slate-900"
            >
              Terms
            </a>

            <a
              href="mailto:support@pdfly.app"
              className="hover:text-slate-900"
            >
              Contact
            </a>

            <a
              href="https://github.com/farazii1159/Pdfly-pdf-toolkit.git"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-900"
            >
              GitHub
            </a>
          </nav>
        </div>

        <p className="mt-8 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} PDFly. Built for the DevOps
          Internship program.
        </p>
      </div>
    </footer>
  );
}