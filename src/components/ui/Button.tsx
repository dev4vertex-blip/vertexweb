import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const isButtonDisabled = Boolean(disabled || isLoading);

  const baseClasses =
    'inline-flex items-center justify-center font-medium transition-all duration-150 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 whitespace-nowrap select-none';

  const stateClasses = isLoading
    ? 'cursor-wait opacity-90'
    : 'disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer';

  const sizeClasses = {
    sm: 'text-xs px-3 py-1.5 gap-1.5 h-8',
    md: 'text-sm px-4 py-2 gap-2 h-10',
    lg: 'text-base px-5 py-2.5 gap-2.5 h-12',
  };

  const variantClasses = {
    primary:
      'bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-950 focus:ring-slate-900 shadow-sm',
    secondary:
      'bg-slate-100 text-slate-900 hover:bg-slate-200 active:bg-slate-300 focus:ring-slate-400',
    outline:
      'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 active:bg-slate-100 focus:ring-slate-400',
    accent:
      'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 focus:ring-blue-600 shadow-sm',
    danger: isLoading
      ? 'bg-rose-700 text-white shadow-sm focus:ring-rose-600'
      : 'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 focus:ring-rose-600 shadow-sm disabled:bg-slate-100 disabled:text-slate-400 disabled:border disabled:border-slate-200 disabled:shadow-none disabled:opacity-100',
    ghost:
      'bg-transparent text-slate-700 hover:bg-slate-100 active:bg-slate-200 focus:ring-slate-400',
  };

  return (
    <button
      className={`${baseClasses} ${stateClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      disabled={isButtonDisabled}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      {children && <span>{children}</span>}
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
};
