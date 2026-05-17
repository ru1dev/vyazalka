import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

type FieldShellProps = {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
};

type FieldProps = Omit<FieldShellProps, 'children'>;

function FieldShell({ label, error, hint, children }: FieldShellProps) {
  return (
    <label className="grid gap-1.5">
      <span className="text-sm font-semibold text-ink">{label}</span>
      {children}
      {hint ? <span className="text-xs text-stone-600">{hint}</span> : null}
      {error ? <span className="text-xs font-medium text-red-700">{error}</span> : null}
    </label>
  );
}

export function Input({ label, error, hint, className = '', ...props }: InputHTMLAttributes<HTMLInputElement> & FieldProps) {
  return (
    <FieldShell label={label} error={error} hint={hint}>
      <input
        className={`min-h-12 rounded-lg border border-flax bg-white px-3 py-2 text-base outline-none focus:border-berry focus:ring-2 focus:ring-berry/20 ${className}`}
        {...props}
      />
    </FieldShell>
  );
}

export function Select({
  label,
  error,
  hint,
  className = '',
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & FieldProps) {
  return (
    <FieldShell label={label} error={error} hint={hint}>
      <select
        className={`min-h-12 rounded-lg border border-flax bg-white px-3 py-2 text-base outline-none focus:border-berry focus:ring-2 focus:ring-berry/20 ${className}`}
        {...props}
      >
        {children}
      </select>
    </FieldShell>
  );
}

export function Textarea({
  label,
  error,
  hint,
  className = '',
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & FieldProps) {
  return (
    <FieldShell label={label} error={error} hint={hint}>
      <textarea
        className={`min-h-28 rounded-lg border border-flax bg-white px-3 py-2 text-base outline-none focus:border-berry focus:ring-2 focus:ring-berry/20 ${className}`}
        {...props}
      />
    </FieldShell>
  );
}
