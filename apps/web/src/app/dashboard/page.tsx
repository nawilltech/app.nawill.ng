import { apiFetch } from '@/lib/api';
import { ApiError } from '@/lib/types';

interface AnalyticsOverview {
  projects: { total: number; byPhase: Record<string, number> };
  wallet: { balanceMinor: string; currency: string } | null;
  invoices: { total: number; byStatus: Record<string, number>; totalOutstandingMinor: string };
  supportTickets: { total: number; byStatus: Record<string, number> };
}

function formatMinor(minor: string, currency: string): string {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency }).format(Number(minor) / 100);
}

export default async function OverviewPage() {
  let overview: AnalyticsOverview | null = null;
  let error: string | null = null;

  try {
    overview = await apiFetch<AnalyticsOverview>('/analytics/me/overview');
  } catch (e) {
    error = e instanceof ApiError ? e.message : 'Could not reach the API';
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Overview</h1>

      {error && (
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {error} — is the API running at <code>NAWILL_API_URL</code>?
        </p>
      )}

      {overview && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Projects" value={String(overview.projects.total)} />
          <StatCard
            label="Wallet balance"
            value={overview.wallet ? formatMinor(overview.wallet.balanceMinor, overview.wallet.currency) : '—'}
          />
          <StatCard label="Invoices" value={String(overview.invoices.total)} />
          <StatCard label="Open tickets" value={String(overview.supportTickets.byStatus['open'] ?? 0)} />
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <p className="text-sm text-neutral-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}
