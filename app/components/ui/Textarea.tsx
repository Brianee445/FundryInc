import { cn } from '@/app/lib/utils';
import { forwardRef, type TextareaHTMLAttributes } from 'react';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'w-full rounded-input border border-borderColor bg-secondaryBg px-5 py-4 text-primaryText placeholder-secondaryText outline-none transition',
        'focus:border-primaryBlue focus:ring-1 focus:ring-primaryBlue',
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = 'Textarea';
