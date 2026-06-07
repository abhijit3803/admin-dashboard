'use client';

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  children,
  className = '',
  ...props
}: ButtonProps) {
  const isIconOnly = icon && !children;

  const classes = [
    'btn',
    `btn-${variant}`,
    `btn-${size}`,
    isIconOnly ? 'btn-icon' : '',
    loading ? 'btn-loading' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <span className="btn-spinner" />
          {children && <span className="btn-text">{children}</span>}
        </>
      ) : (
        <>
          {icon && <span className="btn-icon-el">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
}
