import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'subtle' | 'elevated' | 'dark' | 'outline';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  padding = 'lg',
  children,
  className = '',
  ...props
}) => {
  const baseClasses = 'rounded-2xl transition-all duration-200';

  const variantClasses = {
    default: 'bg-white border border-gray-200/80 shadow-xs text-gray-900',
    subtle: 'bg-gray-50/70 border border-gray-200/60 shadow-xs text-gray-900',
    elevated: 'bg-white border border-gray-200/60 shadow-lg text-gray-900',
    dark: 'bg-slate-900 border border-slate-800 shadow-xl text-slate-100',
    outline: 'bg-transparent border border-gray-200 text-gray-900',
  };

  const paddingClasses = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-5',
    lg: 'p-6 sm:p-7',
    xl: 'p-8 sm:p-10',
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${paddingClasses[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
