import { cn } from '@/app/lib/utils';
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

const VARIANTS = {
  primary: 'bg-primaryBlue hover:bg-hoverBlue text-white shadow-card hover:shadow-hover',
  secondary: 'bg-secondaryBg hover:bg-borderColor text-primaryText border border-borderColor',
  ghost: 'hover:bg-secondaryBg text-secondaryText hover:text-primaryText',
} as const;

const SIZES = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
} as const;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          'inline-flex cursor-pointer items-center justify-center gap-2 rounded-button font-medium transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-primaryBlue/50',
          'disabled:cursor-not-allowed disabled:opacity-50',
          VARIANTS[variant],
          SIZES[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
