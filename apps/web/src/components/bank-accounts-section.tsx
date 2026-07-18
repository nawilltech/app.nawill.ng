'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { addBankAccount, setDefaultBankAccount, removeBankAccount } from '@/lib/actions/bank-accounts';
import { Field, Input, Select } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ErrorAlert, SuccessAlert } from '@/components/ui/alert';
import { ActionResult } from '@/lib/action-result';

interface Bank {
  name: string;
  code: string;
}

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  isDefault: boolean;
}

function SubmitButton({ children, variant }: { children: React.ReactNode; variant?: 'primary' | 'secondary' | 'danger' }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} disabled={pending} className="text-xs">
      {pending ? '…' : children}
    </Button>
  );
}

function BankAccountRow({ account }: { account: BankAccount }) {
  const [defaultState, defaultAction] = useFormState<ActionResult, FormData>(setDefaultBankAccount, {});
  const [removeState, removeAction] = useFormState<ActionResult, FormData>(removeBankAccount, {});

  return (
    <Card>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">
            {account.bankName} {account.isDefault && <span className="text-brand">(default)</span>}
          </p>
          <p className="text-sm text-neutral-500">
            {account.accountName} · •••{account.accountNumber.slice(-4)}
          </p>
        </div>
        <div className="flex gap-2">
          {!account.isDefault && (
            <form action={defaultAction}>
              <input type="hidden" name="id" value={account.id} />
              <SubmitButton variant="secondary">Set default</SubmitButton>
            </form>
          )}
          <form action={removeAction}>
            <input type="hidden" name="id" value={account.id} />
            <SubmitButton variant="danger">Remove</SubmitButton>
          </form>
        </div>
      </div>
      {defaultState.error && <ErrorAlert message={defaultState.error} />}
      {removeState.error && <ErrorAlert message={removeState.error} />}
    </Card>
  );
}

function AddBankAccountForm({ banks }: { banks: Bank[] }) {
  const [state, formAction] = useFormState<ActionResult, FormData>(addBankAccount, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field label="Bank">
        <Select name="bankCode" required defaultValue="" onChange={(e) => {
          const option = e.currentTarget.selectedOptions[0];
          const nameInput = e.currentTarget.form?.elements.namedItem('bankName') as HTMLInputElement | null;
          if (nameInput) nameInput.value = option.text;
        }}>
          <option value="" disabled>
            Select a bank
          </option>
          {banks.map((bank) => (
            <option key={bank.code} value={bank.code}>
              {bank.name}
            </option>
          ))}
        </Select>
      </Field>
      <input type="hidden" name="bankName" />
      <Field label="Account number">
        <Input name="accountNumber" required minLength={10} maxLength={10} inputMode="numeric" />
      </Field>

      {state.error && <ErrorAlert message={state.error} />}
      {state.ok && <SuccessAlert message={state.message ?? 'Added'} />}

      <div>
        <SubmitButton>Verify & add</SubmitButton>
      </div>
    </form>
  );
}

export function BankAccountsSection({ accounts, banks }: { accounts: BankAccount[]; banks: Bank[] }) {
  return (
    <div className="flex flex-col gap-4">
      {accounts.length === 0 ? (
        <p className="text-sm text-neutral-500">No bank accounts added yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {accounts.map((account) => (
            <BankAccountRow key={account.id} account={account} />
          ))}
        </div>
      )}
      <AddBankAccountForm banks={banks} />
    </div>
  );
}
