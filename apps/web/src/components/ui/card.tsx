import { ReactNode } from 'react';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-lg border border-neutral-200 bg-white p-4 shadow-sm ${className}`}>{children}</div>;
}

export function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <p className="text-sm text-neutral-500">{label}</p>
      <p className="mt-1 font-heading text-2xl font-semibold text-brand">{value}</p>
    </Card>
  );
}
