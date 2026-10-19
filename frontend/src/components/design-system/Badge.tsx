import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'brand' | 'indigo' | 'gray' | 'success' | 'warning' | 'error' | 'rose' | 'blue' | 'purple' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  iconLeading?: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'brand',
  size = 'md',
  dot = false,
  iconLeading,
  className = '',
}) => {
  const baseClasses = 'inline-flex items-center font-medium rounded-full border transition-colors';

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2',
  };

  const variantClasses: Record<string, string> = {
    brand: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
    gray: 'bg-gray-50 text-gray-700 border-gray-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    error: 'bg-rose-50 text-rose-700 border-rose-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    dark: 'bg-slate-900/90 text-slate-200 border-slate-700/80',
  };

  const dotClasses: Record<string, string> = {
    brand: 'bg-indigo-500',
    indigo: 'bg-indigo-500',
    gray: 'bg-gray-500',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    error: 'bg-rose-500',
    rose: 'bg-rose-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    dark: 'bg-emerald-400',
  };

  return (
    <span className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotClasses[variant]}`} />}
      {iconLeading && <span className="shrink-0">{iconLeading}</span>}
      <span>{children}</span>
    </span>
  );
};
