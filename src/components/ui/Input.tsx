import type { ReactNode, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</label>}
      <input
        className={cn(
          'bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-sm',
          'focus:outline-none focus:border-vitality-500 focus:ring-1 focus:ring-vitality-500/30',
          'placeholder-slate-500 transition-colors duration-200 w-full',
          error && 'border-rose-500',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-rose-400">{error}</p>}
    </div>
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  children: ReactNode;
}

export function Select({ label, children, className, ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</label>}
      <select
        className={cn(
          'bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-sm',
          'focus:outline-none focus:border-vitality-500 focus:ring-1 focus:ring-vitality-500/30',
          'transition-colors duration-200 w-full',
          className
        )}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export function Textarea({ label, className, ...props }: TextareaProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</label>}
      <textarea
        className={cn(
          'bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-sm',
          'focus:outline-none focus:border-vitality-500 focus:ring-1 focus:ring-vitality-500/30',
          'placeholder-slate-500 transition-colors duration-200 w-full resize-none',
          className
        )}
        {...props}
      />
    </div>
  );
}
