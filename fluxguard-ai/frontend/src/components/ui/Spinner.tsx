import { cn } from '@/utils/classNames';

export interface SpinnerProps {
  label?: string;
  isDecorative?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses: Record<NonNullable<SpinnerProps['size']>, string> = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-7 w-7',
};

export function Spinner({
  className,
  isDecorative = false,
  label = 'Loading',
  size = 'md',
}: SpinnerProps) {
  return (
    <span
      role={isDecorative ? undefined : 'status'}
      aria-hidden={isDecorative || undefined}
      aria-label={isDecorative ? undefined : label}
      className={cn(
        'inline-block animate-spin rounded-full border-2 border-current border-t-transparent',
        sizeClasses[size],
        className,
      )}
    />
  );
}
