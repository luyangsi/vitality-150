import type { ReactNode, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</label>}
      <input
        className={cn(
          'bg-white border border-gray-200 text-gray-900 rounded-lg px-3 py-2 text-sm',
          'focus:outline-none focus:border-vitality-500 focus:ring-1 focus:ring-vitality-500/20',
          'placeholder-gray-400 transition-colors duration-200 w-full',
          error && 'border-red-400',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
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
      {label && <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</label>}
      <select
        className={cn(
          'bg-white border border-gray-200 text-gray-900 rounded-lg px-3 py-2 text-sm',
          'focus:outline-none focus:border-vitality-500 focus:ring-1 focus:ring-vitality-500/20',
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
      {label && <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</label>}
      <textarea
        className={cn(
          'bg-white border border-gray-200 text-gray-900 rounded-lg px-3 py-2 text-sm',
          'focus:outline-none focus:border-vitality-500 focus:ring-1 focus:ring-vitality-500/20',
          'placeholder-gray-400 transition-colors duration-200 w-full resize-none',
          className
        )}
        {...props}
      />
    </div>
  );
}
