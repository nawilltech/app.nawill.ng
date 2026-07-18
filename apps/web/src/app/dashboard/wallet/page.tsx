import { apiFetch, apiFetchPage } from '@/lib/api';
import { ApiError } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { ErrorAlert } from '@/components/ui/alert';
import { FundWalletForm } from '@/components/fund-wallet-form';

interface Wallet {
  balanceMinor: string;
  currency: string;
  walletStatus: string;
}

interface WalletTransaction {
  id: string;
  direction: 'credit' | 'debit';
  source: string;
  amountMinor: string;
  balanceAfterMinor: string;
  description: string;
  createdAt: string;
}

function formatMinor(minor: string, currency: string): string {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency }).format(Number(minor) / 100);
}

export default async function WalletPage() {
  let wallet: Wallet | null = null;
  let transactions: WalletTransaction[] = [];
  let error: string | null = null;

  try {
    [wallet, { items: transactions }] = await Promise.all([
      apiFetch<Wallet>('/wallets/me'),
      apiFetchPage<WalletTransaction>('/wallets/me/transactions?limit=20'),
    ]);
  } catch (e) {
    error = e instanceof ApiError ? e.message : 'Could not reach the API';
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Wallet</h1>

      {error && <ErrorAlert message={error} />}

      {wallet && (
        <div className="flex flex-wrap gap-6">
          <Card className="min-w-[200px]">
            <p className="text-sm text-neutral-500">Balance</p>
            <p className="mt-1 text-3xl font-semibold">{formatMinor(wallet.balanceMinor, wallet.currency)}</p>
          </Card>
          <Card className="flex-1">
            <p className="mb-2 text-sm font-medium text-neutral-700">Add funds</p>
            <FundWalletForm />
          </Card>
        </div>
      )}

      {transactions.length > 0 && (
        <table className="w-full text-left text-sm">
          <thead className="text-neutral-500">
            <tr>
              <th className="pb-2 font-medium">Date</th>
              <th className="pb-2 font-medium">Description</th>
              <th className="pb-2 font-medium">Amount</th>
              <th className="pb-2 font-medium">Balance after</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {transactions.map((txn) => (
              <tr key={txn.id}>
                <td className="py-2">{new Date(txn.createdAt).toLocaleDateString()}</td>
                <td className="py-2">{txn.description}</td>
                <td className={`py-2 ${txn.direction === 'credit' ? 'text-green-700' : 'text-neutral-900'}`}>
                  {txn.direction === 'credit' ? '+' : '-'}
                  {formatMinor(txn.amountMinor, wallet?.currency ?? 'NGN')}
                </td>
                <td className="py-2">{formatMinor(txn.balanceAfterMinor, wallet?.currency ?? 'NGN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
