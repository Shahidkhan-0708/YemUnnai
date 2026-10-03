import * as React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'green' | 'orange' | 'walkin' | 'order';
  size?: 'default' | 'sm' | 'lg' | 'icon' | 'xs';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-[10px] text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer active:scale-97 select-none';

    const variants: Record<string, string> = {
      default: 'bg-[#F06A05] text-white hover:bg-[#D85800] btn-orange-shadow',
      green: 'bg-emerald-600 text-white hover:bg-emerald-700 btn-green-shadow',
      walkin: 'border border-[#007A55] bg-white text-[#007A55] hover:bg-emerald-50',
      order: 'bg-[#F06A05] text-white hover:bg-[#D85800]',
      orange: 'bg-[#F06A05] text-white hover:bg-[#D85800]',
      secondary: 'bg-[#DDE2E8] text-[#1F140A] hover:bg-[#D4DCE4]',
      outline: 'border border-[#D6DCE2] bg-white text-[#1F140A] hover:bg-[#E8ECEF]',
      ghost: 'hover:bg-black/5 text-[#1F140A]',
      link: 'text-[#F06A05] underline-offset-4 hover:underline'
    };

    const sizes: Record<string, string> = {
      default: 'h-9 px-4 py-2',
      xs: 'h-6 px-2.5 text-[9px]',
      sm: 'h-8 px-3 text-[10px]',
      lg: 'h-11 px-6 text-sm',
      icon: 'h-9 w-9 p-0'
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
