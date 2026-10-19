import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  iconLeading?: React.ReactNode;
  iconTrailing?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, helperText, error, iconLeading, iconTrailing, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-gray-700">
            {label}
          </label>
        )}
        <div className="relative rounded-lg shadow-xs">
          {iconLeading && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              {iconLeading}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`w-full rounded-lg border text-sm transition-colors duration-150 py-2 ${
              iconLeading ? 'pl-9' : 'pl-3.5'
            } ${iconTrailing ? 'pr-9' : 'pr-3.5'} ${
              error
                ? 'border-red-300 text-red-900 focus:border-red-500 focus:ring-4 focus:ring-red-100'
                : 'border-gray-300 text-gray-900 placeholder:text-gray-400 hover:border-gray-400 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100'
            } focus:outline-none ${className}`}
            {...props}
          />
          {iconTrailing && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
              {iconTrailing}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-xs text-red-600 font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-gray-500">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
