import { cn } from '@/app/lib/utils';
import { forwardRef, type InputHTMLAttributes } from 'react';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
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
Input.displayName = 'Input';
