'use client';

import { useMemo, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { createInvoice } from '@/lib/actions/admin';
import { Field, Input, Select, Textarea } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ErrorAlert, SuccessAlert } from '@/components/ui/alert';
import { ActionResult } from '@/lib/action-result';

interface Option {
  id: string;
  label: string;
}

interface ItemRow {
  itemName: string;
  period: string;
  quantity: string;
  unitAmountMinor: string;
}

const BLANK_ITEM: ItemRow = { itemName: '', period: '', quantity: '1', unitAmountMinor: '' };
const DEFAULT_VAT_RATE = '7.5';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Creating…' : 'Create invoice'}
    </Button>
  );
}

function formatMinor(minor: number, currency: string): string {
  if (!Number.isFinite(minor)) return '—';
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency }).format(minor / 100);
}

export function NewInvoiceForm({ organizations }: { organizations: Option[] }) {
  const [state, formAction] = useFormState<ActionResult, FormData>(createInvoice, {});
  const [formKey, setFormKey] = useState(0);
  const [currency, setCurrency] = useState('NGN');
  const [items, setItems] = useState<ItemRow[]>([{ ...BLANK_ITEM }]);
  const [discountMinor, setDiscountMinor] = useState('');
  const [vatEnabled, setVatEnabled] = useState(false);
  const [vatRate, setVatRate] = useState(DEFAULT_VAT_RATE);

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => {
      const qty = Number(item.quantity) || 0;
      const unit = Number(item.unitAmountMinor) || 0;
      return sum + qty * unit;
    }, 0);
    const discount = Number(discountMinor) || 0;
    const taxable = Math.max(subtotal - discount, 0);
    const vat = vatEnabled ? Math.round(taxable * ((Number(vatRate) || 0) / 100)) : 0;
    return { subtotal, discount, taxable, vat, total: taxable + vat };
  }, [items, discountMinor, vatEnabled, vatRate]);

  function updateItem(index: number, patch: Partial<ItemRow>) {
    setItems((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function addItem() {
    setItems((rows) => [...rows, { ...BLANK_ITEM }]);
  }

  function removeItem(index: number) {
    setItems((rows) => (rows.length > 1 ? rows.filter((_, i) => i !== index) : rows));
  }

  function onCancel() {
    setItems([{ ...BLANK_ITEM }]);
    setDiscountMinor('');
    setVatEnabled(false);
    setVatRate(DEFAULT_VAT_RATE);
    setCurrency('NGN');
    setFormKey((k) => k + 1); // remounts the form, clearing organization/dueDate/notes too
  }

  return (
    <form key={formKey} action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="items" value={JSON.stringify(items)} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Organization">
          <Select name="organizationId" required defaultValue="">
            <option value="" disabled>
              Select an organization
            </option>
            {organizations.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Currency">
          <Select name="currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
            <option value="NGN">NGN</option>
            <option value="USD">USD</option>
          </Select>
        </Field>

        <Field label="Due date">
          <Input name="dueDate" type="date" required />
        </Field>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-neutral-900">Line items</p>
          <button type="button" onClick={addItem} className="text-sm font-medium text-brand hover:underline">
            + Add item
          </button>
        </div>

        {items.map((item, index) => (
          <div key={index} className="grid grid-cols-1 gap-2 rounded-md border border-neutral-200 p-3 sm:grid-cols-12">
            <div className="sm:col-span-4">
              <Field label="Item name">
                <Input required value={item.itemName} onChange={(e) => updateItem(index, { itemName: e.target.value })} />
              </Field>
            </div>
            <div className="sm:col-span-3">
              <Field label="Period" hint="e.g. 1 Year, One-off">
                <Input value={item.period} onChange={(e) => updateItem(index, { period: e.target.value })} />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Qty">
                <Input
                  type="number"
                  min={1}
                  required
                  value={item.quantity}
                  onChange={(e) => updateItem(index, { quantity: e.target.value })}
                />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Unit amount (minor)">
                <Input
                  type="number"
                  min={0}
                  required
                  value={item.unitAmountMinor}
                  onChange={(e) => updateItem(index, { unitAmountMinor: e.target.value })}
                />
              </Field>
            </div>
            <div className="flex items-end justify-end sm:col-span-1">
              <button
                type="button"
                onClick={() => removeItem(index)}
                disabled={items.length === 1}
                className="text-sm font-medium text-red-600 hover:underline disabled:cursor-not-allowed disabled:opacity-40"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Discount (minor units)">
          <Input
            name="discountMinor"
            type="number"
            min={0}
            value={discountMinor}
            onChange={(e) => setDiscountMinor(e.target.value)}
          />
        </Field>

        <Field label="VAT">
          <label className="flex h-10 items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="vatEnabled"
              value="true"
              checked={vatEnabled}
              onChange={(e) => setVatEnabled(e.target.checked)}
            />
            Include VAT
          </label>
        </Field>

        <Field label="VAT rate (%)">
          <Input
            name="vatRate"
            type="number"
            min={0}
            max={100}
            step="0.1"
            disabled={!vatEnabled}
            value={vatRate}
            onChange={(e) => setVatRate(e.target.value)}
          />
        </Field>
      </div>

      <Field label="Notes" hint="Shown on the invoice PDF">
        <Textarea name="notes" rows={2} />
      </Field>

      <div className="rounded-md bg-brand-50 p-4 text-sm">
        <div className="flex justify-between py-0.5">
          <span className="text-neutral-600">Subtotal</span>
          <span>{formatMinor(totals.subtotal, currency)}</span>
        </div>
        {totals.discount > 0 && (
          <div className="flex justify-between py-0.5">
            <span className="text-neutral-600">Discount</span>
            <span>−{formatMinor(totals.discount, currency)}</span>
          </div>
        )}
        {vatEnabled && (
          <div className="flex justify-between py-0.5">
            <span className="text-neutral-600">VAT ({vatRate || 0}%)</span>
            <span>{formatMinor(totals.vat, currency)}</span>
          </div>
        )}
        <div className="mt-1 flex justify-between border-t border-brand/20 pt-1 font-semibold text-brand">
          <span>Total</span>
          <span>{formatMinor(totals.total, currency)}</span>
        </div>
      </div>

      {state.error && <ErrorAlert message={state.error} />}
      {state.ok && <SuccessAlert message={state.message ?? 'Created'} />}

      <div className="flex gap-3">
        <SubmitButton />
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
