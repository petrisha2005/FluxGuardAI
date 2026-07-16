import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { Spinner } from './Spinner';
import { cn } from '@/utils/classNames';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'border-brand-primary/70 bg-brand-primary text-slate-950 shadow-glow hover:bg-sky-300',
  secondary:
    'border-brand-secondary/70 bg-brand-secondary/15 text-brand-secondary hover:bg-brand-secondary/25',
  ghost: 'border-white/10 bg-white/5 text-ink hover:bg-white/10',
  danger: 'border-risk-critical/70 bg-risk-critical/15 text-red-200 hover:bg-risk-critical/25',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'min-h-9 px-3 text-sm',
  md: 'min-h-10 px-4 text-sm',
  lg: 'min-h-12 px-5 text-base',
};

export function Button({
  children,
  className,
  disabled,
  isLoading = false,
  leftIcon,
  rightIcon,
  size = 'md',
  type = 'button',
  variant = 'primary',
  ...props
}: ButtonProps) {
  const isDisabled = disabled || isLoading;

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-command border font-semibold transition-colors',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary',
        'disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-ink-subdued',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      disabled={isDisabled}
      type={type}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {isLoading ? <Spinner size="sm" isDecorative /> : leftIcon}
      <span>{children}</span>
      {!isLoading ? rightIcon : null}
    </button>
  );
}
