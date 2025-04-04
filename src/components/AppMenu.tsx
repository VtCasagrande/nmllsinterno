'use client';

import React from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';

interface AppMenuAction {
  id: string;
  name: string;
  href: string;
  description?: string;
  icon: any;
  color: string;
}

interface AppMenuProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  moduleId: string;
  actions: AppMenuAction[];
  mainHref: string;
}

export default function AppMenu({ isOpen, onClose, title, actions, mainHref }: AppMenuProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-4">
          <div className="mb-4">
            <Link 
              href={mainHref}
              className="block w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-center"
              onClick={onClose}
            >
              Acessar {title}
            </Link>
          </div>
          
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-500 mb-2">Ações disponíveis:</h4>
            {actions.map(action => (
              <Link
                key={action.id}
                href={action.href}
                className="flex items-center p-3 rounded-md hover:bg-gray-100 transition-colors"
                onClick={onClose}
              >
                <div className={`p-2 rounded-md mr-3 ${action.color} text-white`}>
                  <action.icon className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-medium">{action.name}</div>
                  {action.description && (
                    <div className="text-sm text-gray-500">{action.description}</div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 