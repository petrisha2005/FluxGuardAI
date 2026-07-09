import type { FocusEvent, MouseEvent, ReactElement, ReactNode } from 'react';
import { cloneElement, useId, useState } from 'react';

import { cn } from '@/utils/classNames';

export interface TooltipProps {
  content: ReactNode;
  children: ReactElement<TooltipTriggerProps>;
  className?: string;
}

type TooltipTriggerProps = {
  'aria-describedby'?: string;
  onBlur?: (event: FocusEvent<HTMLElement>) => void;
  onFocus?: (event: FocusEvent<HTMLElement>) => void;
  onMouseEnter?: (event: MouseEvent<HTMLElement>) => void;
  onMouseLeave?: (event: MouseEvent<HTMLElement>) => void;
};

export function Tooltip({ children, className, content }: TooltipProps) {
  const tooltipId = useId();
  const [isVisible, setIsVisible] = useState(false);
  const triggerProps = children.props;

  return (
    <span className={cn('relative inline-flex', className)}>
      {cloneElement(children, {
        'aria-describedby': tooltipId,
        onBlur: (event: FocusEvent<HTMLElement>) => {
          triggerProps.onBlur?.(event);
          setIsVisible(false);
        },
        onFocus: (event: FocusEvent<HTMLElement>) => {
          triggerProps.onFocus?.(event);
          setIsVisible(true);
        },
        onMouseEnter: (event: MouseEvent<HTMLElement>) => {
          triggerProps.onMouseEnter?.(event);
          setIsVisible(true);
        },
        onMouseLeave: (event: MouseEvent<HTMLElement>) => {
          triggerProps.onMouseLeave?.(event);
          setIsVisible(false);
        },
      })}
      <span
        id={tooltipId}
        role="tooltip"
        hidden={!isVisible}
        className={cn(
          'pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-max max-w-56 -translate-x-1/2 rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-xs text-ink shadow-command',
          isVisible ? 'opacity-100' : 'opacity-0',
        )}
      >
        {content}
      </span>
    </span>
  );
}
