import React from 'react';

interface CheckboxProps {
  id: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  children?: React.ReactNode;
}

export const Checkbox: React.FC<CheckboxProps> = ({ id, checked, onCheckedChange, children }) => {
  return (
    <div className="flex items-center">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onCheckedChange(e.target.checked)}
        className="w-4 h-4 text-accent bg-gray-700 border-gray-600 rounded focus:ring-accent focus:ring-2 cursor-pointer"
      />
      {children && (
        <label htmlFor={id} className="ml-2 text-sm font-medium text-gray-300">
          {children}
        </label>
      )}
    </div>
  );
};
