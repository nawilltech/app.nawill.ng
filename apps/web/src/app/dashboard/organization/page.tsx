import { apiFetch } from '@/lib/api';
import { ApiError } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { ErrorAlert } from '@/components/ui/alert';
import { OrganizationForm, KycDocumentForm } from '@/components/organization-form';

interface Profile {
  organizationId: string | null;
}

interface Organization {
  id: string;
  name: string;
  sector: string;
  headOffice: string;
  sizeRange: string;
  kycStatus: string;
}

interface KycDocument {
  id: string;
  docType: string;
  reviewStatus: string;
  reviewNote: string | null;
  createdAt: string;
}

export default async function OrganizationPage() {
  let organization: Organization | null = null;
  let documents: KycDocument[] = [];
  let error: string | null = null;

  try {
    const profile = await apiFetch<Profile>('/users/me');
    if (!profile.organizationId) {
      error = 'No organization on this account.';
    } else {
      [organization, documents] = await Promise.all([
        apiFetch<Organization>(`/organizations/${profile.organizationId}`),
        apiFetch<KycDocument[]>(`/organizations/${profile.organizationId}/kyc-documents`),
      ]);
    }
  } catch (e) {
    error = e instanceof ApiError ? e.message : 'Could not reach the API';
  }

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <h1 className="text-2xl font-semibold">Organization</h1>

      {error && <ErrorAlert message={error} />}

      {organization && (
        <>
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Details</h2>
              <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs capitalize text-neutral-600">
                KYC: {organization.kycStatus}
              </span>
            </div>
            <Card>
              <OrganizationForm organization={organization} />
            </Card>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-medium">KYC documents</h2>
            {documents.length > 0 && (
              <div className="flex flex-col gap-2">
                {documents.map((doc) => (
                  <Card key={doc.id}>
                    <p className="text-sm font-medium capitalize">{doc.docType.replace(/_/g, ' ')}</p>
                    <p className="text-sm capitalize text-neutral-500">
                      {doc.reviewStatus}
                      {doc.reviewNote ? ` — ${doc.reviewNote}` : ''}
                    </p>
                  </Card>
                ))}
              </div>
            )}
            <Card>
              <KycDocumentForm organizationId={organization.id} />
            </Card>
          </section>
        </>
      )}
    </div>
  );
}
