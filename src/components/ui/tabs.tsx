import React, { createContext, useContext, useState } from 'react';

interface TabsContextType {
  selectedTab: string;
  setSelectedTab: (id: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

function useTabs() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('useTabs must be used within a TabsProvider');
  }
  return context;
}

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

export function Tabs({
  defaultValue,
  value,
  onValueChange,
  children,
  className = '',
  ...props
}: TabsProps) {
  const [selectedTab, setSelectedTab] = useState(value || defaultValue || '');

  const handleTabChange = (id: string) => {
    if (onValueChange) {
      onValueChange(id);
    } else {
      setSelectedTab(id);
    }
  };

  return (
    <TabsContext.Provider
      value={{
        selectedTab: value !== undefined ? value : selectedTab,
        setSelectedTab: handleTabChange,
      }}
    >
      <div className={`${className}`} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {}

export function TabsList({ className = '', ...props }: TabsListProps) {
  return (
    <div
      className={`inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 text-gray-500 ${className}`}
      {...props}
    />
  );
}

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

export function TabsTrigger({ className = '', value, ...props }: TabsTriggerProps) {
  const { selectedTab, setSelectedTab } = useTabs();
  const isSelected = selectedTab === value;

  return (
    <button
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
        isSelected
          ? 'bg-white text-gray-900 shadow-sm'
          : 'text-gray-500 hover:text-gray-900'
      } ${className}`}
      onClick={() => setSelectedTab(value)}
      data-state={isSelected ? 'active' : 'inactive'}
      {...props}
    />
  );
}

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

export function TabsContent({ className = '', value, ...props }: TabsContentProps) {
  const { selectedTab } = useTabs();
  const isSelected = selectedTab === value;

  if (!isSelected) return null;

  return (
    <div
      className={`mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${className}`}
      data-state={isSelected ? 'active' : 'inactive'}
      {...props}
    />
  );
}
