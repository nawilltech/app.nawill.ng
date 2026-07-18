import { apiFetch } from '@/lib/api';
import { ApiError } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { ErrorAlert } from '@/components/ui/alert';
import { ProfileForm, ChangePasswordForm } from '@/components/profile-form';
import { TwoFactorSection } from '@/components/two-factor-section';
import { BankAccountsSection } from '@/components/bank-accounts-section';

interface Profile {
  name: string;
  email: string;
  phoneNo: string | null;
  userType: string;
  clientType: string | null;
  twoFactorMethod: 'none' | 'email' | 'totp';
}

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  isDefault: boolean;
}

interface Bank {
  name: string;
  code: string;
}

export default async function SettingsPage() {
  let profile: Profile | null = null;
  let bankAccounts: BankAccount[] = [];
  let banks: Bank[] = [];
  let error: string | null = null;

  try {
    [profile, bankAccounts, banks] = await Promise.all([
      apiFetch<Profile>('/users/me'),
      apiFetch<BankAccount[]>('/bank-accounts/me'),
      apiFetch<Bank[]>('/bank-accounts/banks'),
    ]);
  } catch (e) {
    error = e instanceof ApiError ? e.message : 'Could not reach the API';
  }

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <h1 className="text-2xl font-semibold">Settings</h1>

      {error && <ErrorAlert message={error} />}

      {profile && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-medium">Profile</h2>
          <Card>
            <ProfileForm name={profile.name} phoneNo={profile.phoneNo} />
          </Card>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Password</h2>
        <Card>
          <ChangePasswordForm />
        </Card>
      </section>

      {profile && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-medium">Two-factor authentication</h2>
          <Card>
            <TwoFactorSection currentMethod={profile.twoFactorMethod} />
          </Card>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Bank accounts</h2>
        <p className="text-xs text-neutral-500">Used for refunds and payouts — verified against the bank before being saved.</p>
        <BankAccountsSection accounts={bankAccounts} banks={banks} />
      </section>
    </div>
  );
}
