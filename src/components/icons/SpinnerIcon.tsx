import React from 'react';
import { ImSpinner2 } from 'react-icons/im';

interface SpinnerIconProps {
  className?: string;
}

export const SpinnerIcon: React.FC<SpinnerIconProps> = ({ className = '' }) => {
  return (
    <span className={className}>
      {React.createElement('span', { className: 'animate-spin' })}
    </span>
  );
}; 