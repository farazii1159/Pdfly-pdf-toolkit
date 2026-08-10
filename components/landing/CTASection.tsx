import Link from 'next/link';

export default function CTASection() {
  return (
    <section className="container-px mx-auto max-w-6xl py-16 text-center">
      <div className="rounded-xl2 bg-brand-600 px-6 py-14 sm:px-14">
        <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Ready to work with your files?
        </h2>
        <p className="mx-auto mt-2 max-w-md text-brand-100">
          Create a free account and start converting, merging, and managing your
          PDFs in seconds.
        </p>
        <Link
          href="/signup"
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 text-sm font-semibold text-brand-700 shadow-card transition-colors hover:bg-brand-50"
        >
          Get Started
        </Link>
      </div>
    </section>
  );
}
