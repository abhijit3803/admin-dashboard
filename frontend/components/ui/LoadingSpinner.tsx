import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export default function LoadingSpinner({
  size = 'md',
  text,
  className = '',
}: LoadingSpinnerProps) {
  if (text) {
    return (
      <div className={`loading-overlay ${className}`}>
        <div className={`loading-spinner ${size}`} />
        <span className="loading-overlay-text">{text}</span>
      </div>
    );
  }

  return <div className={`loading-spinner ${size} ${className}`} />;
}
