import React, { createContext, useContext, useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectContextType {
  value: string;
  onValueChange: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SelectContext = createContext<SelectContextType | undefined>(undefined);

function useSelect() {
  const context = useContext(SelectContext);
  if (!context) {
    throw new Error('useSelect must be used within a Select');
  }
  return context;
}

interface SelectProps {
  children: React.ReactNode;
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
}

export function Select({
  children,
  defaultValue = '',
  value,
  onValueChange,
  disabled = false,
}: SelectProps) {
  const [selectedValue, setSelectedValue] = useState(value || defaultValue);
  const [open, setOpen] = useState(false);

  const handleValueChange = (newValue: string) => {
    if (onValueChange) {
      onValueChange(newValue);
    } else {
      setSelectedValue(newValue);
    }
    setOpen(false);
  };

  return (
    <SelectContext.Provider
      value={{
        value: value !== undefined ? value : selectedValue,
        onValueChange: handleValueChange,
        open,
        setOpen,
      }}
    >
      <div className="relative">
        {children}
      </div>
    </SelectContext.Provider>
  );
}

interface SelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export function SelectTrigger({ className = '', children, ...props }: SelectTriggerProps) {
  const { open, setOpen, value } = useSelect();

  return (
    <button
      type="button"
      className={`flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      onClick={() => setOpen(!open)}
      aria-expanded={open}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 opacity-50" />
    </button>
  );
}

interface SelectValueProps {
  placeholder?: string;
}

export function SelectValue({ placeholder = 'Selecione uma opção' }: SelectValueProps) {
  const { value } = useSelect();
  
  return (
    <span className={value ? '' : 'text-gray-500'}>
      {value || placeholder}
    </span>
  );
}

interface SelectContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export function SelectContent({ className = '', ...props }: SelectContentProps) {
  const { open } = useSelect();

  if (!open) return null;

  return (
    <div
      className={`absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white text-gray-700 shadow-md ${className}`}
      {...props}
    />
  );
}

interface SelectItemProps extends React.LiHTMLAttributes<HTMLLIElement> {
  value: string;
}

export function SelectItem({ className = '', value, children, ...props }: SelectItemProps) {
  const { value: selectedValue, onValueChange } = useSelect();
  const isSelected = selectedValue === value;

  return (
    <li
      className={`relative flex cursor-pointer select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none hover:bg-gray-100 ${
        isSelected ? 'bg-gray-100 font-medium' : ''
      } ${className}`}
      onClick={() => onValueChange(value)}
      {...props}
    >
      <span className="flex-1">{children}</span>
      {isSelected && (
        <span className="ml-auto h-4 w-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
      )}
    </li>
  );
}
