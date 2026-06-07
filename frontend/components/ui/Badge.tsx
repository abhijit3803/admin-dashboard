import React from 'react';

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
}

export default function Badge({
  variant = 'default',
  dot = false,
  children,
  className = '',
}: BadgeProps) {
  return (
    <span
      className={`badge badge-${variant} ${dot ? 'badge-dot' : ''} ${className}`}
    >
      {children}
    </span>
  );
}
