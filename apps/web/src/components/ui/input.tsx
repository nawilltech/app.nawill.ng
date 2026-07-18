import { InputHTMLAttributes, LabelHTMLAttributes, SelectHTMLAttributes, ReactNode } from 'react';

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      {label}
      {children}
      {hint && <span className="text-xs text-neutral-500">{hint}</span>}
    </label>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`rounded-md border border-neutral-300 px-3 py-2 ${props.className ?? ''}`} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`rounded-md border border-neutral-300 px-3 py-2 ${props.className ?? ''}`} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`rounded-md border border-neutral-300 px-3 py-2 ${props.className ?? ''}`} />;
}

export function Legend(props: LabelHTMLAttributes<HTMLLegendElement>) {
  return <legend {...props} className={`mb-1 text-sm ${props.className ?? ''}`} />;
}
