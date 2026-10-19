import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'primary-white' | 'outline-white' | 'destructive' | 'destructive-secondary' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  iconLeading?: React.ReactNode;
  iconTrailing?: React.ReactNode;
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  iconLeading,
  iconTrailing,
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-medium transition-all duration-150 ease-in-out cursor-pointer select-none focus:outline-none focus:ring-4 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]';

  const sizeClasses = {
    sm: 'text-xs px-3 py-1.5 rounded-lg gap-1.5 shadow-xs',
    md: 'text-sm px-4 py-2 rounded-lg gap-2 shadow-xs',
    lg: 'text-base px-5 py-2.5 rounded-xl gap-2.5 shadow-xs',
    xl: 'text-base px-6 py-3.5 rounded-xl gap-3 shadow-sm font-semibold',
  };

  const variantClasses = {
    primary:
      'bg-indigo-600 hover:bg-indigo-700 text-white border border-transparent shadow-xs focus:ring-indigo-100 active:bg-indigo-800',
    secondary:
      'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 shadow-xs focus:ring-gray-100 active:bg-gray-100',
    tertiary:
      'bg-transparent hover:bg-gray-100/80 text-gray-600 hover:text-gray-900 border border-transparent focus:ring-gray-100',
    'primary-white':
      'bg-white hover:bg-gray-100 text-gray-900 border border-transparent shadow-xs focus:ring-white/20 active:bg-gray-200',
    'outline-white':
      'bg-transparent hover:bg-white/10 text-white border border-white/30 focus:ring-white/20',
    destructive:
      'bg-rose-600 hover:bg-rose-700 text-white border border-transparent shadow-xs focus:ring-rose-100 active:bg-rose-800',
    'destructive-secondary':
      'bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 shadow-xs focus:ring-rose-100',
    success:
      'bg-emerald-600 hover:bg-emerald-700 text-white border border-transparent shadow-xs focus:ring-emerald-100 active:bg-emerald-800',
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        iconLeading && <span className="shrink-0">{iconLeading}</span>
      )}
      <span>{children}</span>
      {!isLoading && iconTrailing && <span className="shrink-0">{iconTrailing}</span>}
    </button>
  );
};
