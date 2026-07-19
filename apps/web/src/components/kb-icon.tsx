const PATHS: Record<string, string> = {
  rocket: 'M12 2c-2 3-3 6-3 9 0 1.5.5 3 1 4l-3 3 1 1 3-3c1 .5 2.5 1 4 1 3-2 5-6 5-11-5 0-8 1-8 1Zm-1 12-3 5 5-3-2-2Z',
  'credit-card': 'M3 6h18v3H3V6Zm0 5h18v7a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-7Zm3 4h4v2H6v-2Z',
  shield: 'M12 2 4 5v6c0 5 3.5 8.7 8 11 4.5-2.3 8-6 8-11V5l-8-3Z',
  ticket: 'M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8Z',
  book: 'M4 4h9a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4V4Zm16 0v14h-9a3 3 0 0 0-3 3V7a3 3 0 0 1 3-3h9Z',
};

export function KbIcon({ name, className = 'h-6 w-6' }: { name: string | null; className?: string }) {
  const d = (name && PATHS[name]) || PATHS.book;
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" className={className}>
      <path d={d} />
    </svg>
  );
}
