import Image from 'next/image';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
        <Image src="/logo.png" alt="Nawill" width={140} height={36} priority className="h-9 w-auto" />
        <nav className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium text-neutral-700 hover:text-brand">
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
          >
            Sign up
          </Link>
        </nav>
      </header>

      <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-6 px-6 py-16 text-center">
        <p className="font-mono text-xs font-medium uppercase tracking-[0.15em] text-brand-mid">
          For Founders Who Are Ready to Build
        </p>
        <h1 className="font-heading text-4xl font-bold leading-tight tracking-tight text-neutral-900 sm:text-5xl">
          You&apos;ve validated
          <br />
          the idea.
          <br />
          Now let&apos;s build it.
        </h1>
        <p className="max-w-xl text-base text-neutral-600 sm:text-lg">
          Nawill is the technical partner for product founders who are past the idea stage. We assemble your dev
          team, validate your product thinking, and connect you with the right talent.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/signup"
            className="rounded-md bg-brand px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-dark"
          >
            Get started
          </Link>
          <Link
            href="/login"
            className="rounded-md border border-neutral-300 px-6 py-3 text-sm font-semibold text-neutral-800 transition-colors hover:bg-neutral-100"
          >
            Log in to your account
          </Link>
        </div>
      </section>

      <footer className="border-t border-neutral-100 py-6 text-center text-xs text-neutral-400">
        &copy; {new Date().getFullYear()} <span className="font-display">Nawill Technology Ltd.</span> All rights
        reserved.
      </footer>
    </main>
  );
}
