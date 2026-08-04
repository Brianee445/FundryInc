import { cn } from "@/lib/utils";
import { forwardRef, ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    const base = "font-medium rounded-button transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primaryBlue/50 inline-flex items-center justify-center gap-2 cursor-pointer";
    
    const variants = {
      primary: "bg-primaryBlue hover:bg-hoverBlue text-white shadow-card hover:shadow-hover",
      secondary: "bg-secondaryBg hover:bg-borderColor text-primaryText border border-borderColor",
      ghost: "hover:bg-secondaryBg text-secondaryText hover:text-primaryText",
    };

    const sizes = {
      sm: "px-4 py-2 text-sm",
      md: "px-6 py-3 text-base",
      lg: "px-8 py-4 text-lg",
    };

    return (
      <button
        className={cn(base, variants[variant], sizes[size], className)}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export { Button };
