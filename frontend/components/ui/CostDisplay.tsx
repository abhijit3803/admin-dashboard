import React from 'react';

interface CostDisplayProps {
  amount: number;
  currency?: string;
  colorCoded?: boolean;
  lowThreshold?: number;
  highThreshold?: number;
  className?: string;
}

export default function CostDisplay({
  amount,
  currency = '₹',
  colorCoded = false,
  lowThreshold = 100,
  highThreshold = 500,
  className = '',
}: CostDisplayProps) {
  let colorClass = '';
  if (colorCoded) {
    if (amount <= lowThreshold) {
      colorClass = 'cost-low';
    } else if (amount >= highThreshold) {
      colorClass = 'cost-high';
    } else {
      colorClass = 'cost-medium';
    }
  }

  const formatted = amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <span className={`cost-display ${colorClass} ${className}`}>
      <span className="cost-currency">{currency}</span>
      {formatted}
    </span>
  );
}
