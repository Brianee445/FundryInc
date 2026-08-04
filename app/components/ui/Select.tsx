import { cn } from '@/app/lib/utils';
import { forwardRef, type SelectHTMLAttributes } from 'react';

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        'w-full appearance-none rounded-input border border-borderColor bg-secondaryBg px-5 py-4 text-primaryText outline-none transition',
        'focus:border-primaryBlue focus:ring-1 focus:ring-primaryBlue',
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
);
Select.displayName = 'Select';
