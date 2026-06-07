import React from 'react';

interface SkeletonProps {
  variant?: 'text' | 'heading' | 'avatar' | 'button' | 'card';
  width?: string;
  height?: string;
  className?: string;
  count?: number;
}

export default function Skeleton({
  variant = 'text',
  width,
  height,
  className = '',
  count = 1,
}: SkeletonProps) {
  const variantClass = `skeleton-${variant}`;

  const style: React.CSSProperties = {};
  if (width) style.width = width;
  if (height) style.height = height;

  if (count > 1) {
    return (
      <>
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className={`skeleton ${variantClass} ${className}`}
            style={style}
          />
        ))}
      </>
    );
  }

  return (
    <div
      className={`skeleton ${variantClass} ${className}`}
      style={style}
    />
  );
}
