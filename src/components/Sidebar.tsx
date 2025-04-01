import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  CalendarDays, 
  Home, 
  Menu, 
  X, 
  Clock,
  Users,
  PhoneCall
} from 'lucide-react';

type SidebarProps = {
  className?: string;
  isOpen: boolean;
  onClose: () => void;
};

export default function Sidebar({ className = '', isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  
  // Lista de itens do menu
  const menuItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: <Home className="h-5 w-5" />,
      exact: true,
    },
    {
      name: 'Recorrências',
      href: '/dashboard/recorrencias',
      icon: <CalendarDays className="h-5 w-5" />,
      exact: false,
    },
    {
      name: 'CRM',
      href: '/dashboard/crm',
      icon: <PhoneCall className="h-5 w-5" />,
      exact: false,
    },
    {
      name: 'Operadores',
      href: '/dashboard/operadores',
      icon: <Users className="h-5 w-5" />,
      exact: false,
    },
    {
      name: 'Histórico',
      href: '/dashboard/historico',
      icon: <Clock className="h-5 w-5" />,
      exact: false,
    },
  ];
  
  // Verifica se um item do menu está ativo
  const isActive = (href: string, exact: boolean) => {
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };
  
  return (
    <>
      {/* Overlay para dispositivos móveis */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar para dispositivos móveis e desktop */}
      <div 
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          ${className}
        `}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">N-Malls App</h2>
          <button 
            className="p-1 text-gray-600 hover:text-gray-900 focus:outline-none lg:hidden"
            onClick={onClose}
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <nav className="mt-4 px-3">
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={`
                    group flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors
                    ${isActive(item.href, item.exact) 
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}
                  `}
                >
                  <span className={`mr-3 ${isActive(item.href, item.exact) ? 'text-blue-700' : 'text-gray-500 group-hover:text-gray-900'}`}>
                    {item.icon}
                  </span>
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
} 