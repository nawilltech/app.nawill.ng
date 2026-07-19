'use client';

import { InputHTMLAttributes, LabelHTMLAttributes, SelectHTMLAttributes, ReactNode, useState } from 'react';

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      {label}
      {children}
      {hint && <span className="text-xs text-neutral-500">{hint}</span>}
    </label>
  );
}

const FIELD_CLASSES =
  'w-full rounded-md border border-neutral-300 px-3 py-2 outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20';

function EyeIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M1.5 10s3-6 8.5-6 8.5 6 8.5 6-3 6-8.5 6-8.5-6-8.5-6Z"
      />
      <circle cx="10" cy="10" r="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.5 2.5l15 15M8.3 8.4a2.5 2.5 0 0 0 3.4 3.4M6.2 6.3C3.7 7.6 2 10 2 10s3 6 8 6c1.5 0 2.8-.5 3.9-1.2M11.8 4.2c.7.1 1.4.4 2 .8 3.2 2 4.2 5 4.2 5s-.4.9-1.3 2"
      />
    </svg>
  );
}

export function Input({ type, className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  const [visible, setVisible] = useState(false);

  if (type === 'password') {
    return (
      <div className="relative w-full">
        <input
          {...props}
          type={visible ? 'text' : 'password'}
          className={`${FIELD_CLASSES} pr-9 ${className ?? ''}`}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          className="absolute inset-y-0 right-2 flex items-center text-neutral-400 hover:text-neutral-600"
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
    );
  }

  return <input {...props} type={type} className={`${FIELD_CLASSES} ${className ?? ''}`} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${FIELD_CLASSES} ${props.className ?? ''}`} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${FIELD_CLASSES} ${props.className ?? ''}`} />;
}

export function Legend(props: LabelHTMLAttributes<HTMLLegendElement>) {
  return <legend {...props} className={`mb-1 text-sm ${props.className ?? ''}`} />;
}
