import React from 'react';
import { RiAlarmWarningFill } from 'react-icons/ri';

interface WarningIconProps {
  size?: number;
  className?: string;
}

export const WarningIcon: React.FC<WarningIconProps> = ({ size = 24, className = '' }) => {
  return (
    <span className={className}>
      {React.createElement('span', { className: 'text-red-500' })}
    </span>
  );
}; 