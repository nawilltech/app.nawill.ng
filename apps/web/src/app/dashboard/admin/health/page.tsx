import { apiFetch } from '@/lib/api';
import { ApiError } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { ErrorAlert } from '@/components/ui/alert';

interface HealthCheckDetail {
  status: 'up' | 'down';
  [key: string]: unknown;
}

interface HealthResult {
  status: 'ok' | 'error' | 'shutting_down';
  info?: Record<string, HealthCheckDetail>;
  error?: Record<string, HealthCheckDetail>;
  details: Record<string, HealthCheckDetail>;
}

export default async function AdminHealthPage() {
  let health: HealthResult | null = null;
  let error: string | null = null;

  try {
    health = await apiFetch<HealthResult>('/health');
  } catch (e) {
    error = e instanceof ApiError ? e.message : 'Could not reach the API';
  }

  const overallOk = health?.status === 'ok';

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading text-2xl font-semibold text-neutral-900">System health</h1>

      {error && <ErrorAlert message={`API is unreachable: ${error}`} />}

      {health && (
        <>
          <Card
            className={
              overallOk ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
            }
          >
            <p className="text-sm text-neutral-500">Overall status</p>
            <p className={`mt-1 text-2xl font-semibold ${overallOk ? 'text-green-700' : 'text-red-700'}`}>
              {overallOk ? 'Healthy' : 'Degraded'}
            </p>
          </Card>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(health.details).map(([name, detail]) => (
              <Card key={name}>
                <p className="text-sm capitalize text-neutral-500">{name.replace(/_/g, ' ')}</p>
                <p className={`mt-1 text-lg font-semibold ${detail.status === 'up' ? 'text-green-700' : 'text-red-700'}`}>
                  {detail.status === 'up' ? 'Up' : 'Down'}
                </p>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
