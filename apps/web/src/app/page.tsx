import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="text-sm font-medium uppercase tracking-wide text-brand">Nawill Technology Ltd</p>
      <h1 className="text-4xl font-semibold tracking-tight">Your Product. Our Team. Zero Compromise.</h1>
      <p className="max-w-xl text-neutral-600">
        This is a structural scaffold for the client portal — routing, auth, and the dashboard shell are wired to the
        live API. Feature UI (forms, tables, project/invoice management) is intentionally not built yet.
      </p>
      <div className="flex gap-3">
        <Link href="/login" className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800">
          Log in
        </Link>
        <Link href="/signup" className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-100">
          Sign up
        </Link>
      </div>
    </main>
  );
}
