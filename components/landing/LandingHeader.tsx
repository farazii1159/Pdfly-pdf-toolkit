'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FileStack, Menu, X } from 'lucide-react';

const LINKS = [
  { href: '#tools', label: 'Tools' },
  { href: '#how-it-works', label: 'How It Works' },
  { href: '#about', label: 'About' },
];

export default function LandingHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="container-px mx-auto flex h-16 max-w-6xl items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
            <FileStack size={18} strokeWidth={2.25} />
          </span>
          <span className="text-lg font-semibold tracking-tight text-slate-900">PDFly</span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} className="transition-colors hover:text-slate-900">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/login"
            className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
          >
            Log In
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-card transition-colors hover:bg-brand-700"
          >
            Get Started
          </Link>
        </div>

        <button className="p-2 text-slate-600 md:hidden" onClick={() => setOpen((v) => !v)} aria-label="Toggle menu">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-200 bg-white md:hidden">
          <div className="container-px mx-auto flex max-w-6xl flex-col gap-1 py-3">
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-2 flex gap-2 px-3">
              <Link
                href="/login"
                className="flex-1 rounded-lg border border-slate-300 px-3.5 py-2 text-center text-sm font-medium text-slate-700"
              >
                Log In
              </Link>
              <Link
                href="/signup"
                className="flex-1 rounded-lg bg-brand-600 px-3.5 py-2 text-center text-sm font-semibold text-white"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
