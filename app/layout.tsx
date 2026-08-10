import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PDFly — Simple Online PDF Tools',
  description: 'Convert, merge, compress, edit and manage PDF files with PDFly.',
  openGraph: {
    title: 'PDFly — Simple Online PDF Tools',
    description: 'Convert, merge, compress, edit and manage PDF files with PDFly.',
    type: 'website',
    siteName: 'PDFly',
  },
  twitter: {
    card: 'summary',
    title: 'PDFly — Simple Online PDF Tools',
    description: 'Convert, merge, compress, edit and manage PDF files with PDFly.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased">{children}</body>
    </html>
  );
}
