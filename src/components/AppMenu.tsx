import React, { useRef, useEffect } from 'react';
import { AppAction } from '@/utils/appRegistry';
import Link from 'next/link';
import { 
  X, 
  ExternalLink, 
  CircleIcon, 
  ChevronRight, 
  Plus, 
  List, 
  Search, 
  Clock, 
  Settings 
} from 'lucide-react';

interface AppMenuProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  moduleId: string;
  actions: AppAction[];
  mainHref: string;
}

// Mapa de cores padrão para diferentes tipos de ações
const DEFAULT_ACTION_COLORS = {
  'novo': 'bg-green-500',
  'nova': 'bg-green-500',
  'registrar': 'bg-green-500',
  'criar': 'bg-green-500',
  'cadastrar': 'bg-green-500',
  'listar': 'bg-blue-600',
  'lista': 'bg-blue-600',
  'ver': 'bg-cyan-500',
  'visualizar': 'bg-cyan-500',
  'acompanhar': 'bg-indigo-500',
  'rastrear': 'bg-indigo-500',
  'gerenciar': 'bg-purple-600',
  'pendentes': 'bg-amber-500',
  'lembretes': 'bg-amber-500',
  'configurar': 'bg-slate-500',
  'rotas': 'bg-blue-600',
  'editar': 'bg-orange-500',
  'default': 'bg-blue-500'
};

// Mapa de ícones padrão para diferentes tipos de ações
const DEFAULT_ACTION_ICONS = {
  'novo': Plus,
  'nova': Plus,
  'registrar': Plus,
  'criar': Plus,
  'cadastrar': Plus,
  'listar': List,
  'lista': List,
  'ver': List,
  'visualizar': List,
  'acompanhar': Search,
  'rastrear': Search,
  'gerenciar': Settings,
  'pendentes': Clock,
  'lembretes': Clock,
  'configurar': Settings,
  'rotas': ExternalLink,
  'editar': Settings,
  'default': CircleIcon
};

export default function AppMenu({ isOpen, onClose, title, moduleId, actions, mainHref }: AppMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Função para determinar a cor padrão com base no nome ou id da ação
  const getDefaultActionColor = (action: AppAction): string => {
    // Se já tiver uma cor definida e válida, usá-la
    if (action.color && 
        action.color !== 'transparent' && 
        action.color !== 'bg-transparent' && 
        action.color !== 'bg-white' && 
        action.color !== 'white') {
      return action.color;
    }
    
    // Caso contrário, procurar por uma cor com base no nome da ação
    const nameLower = action.name.toLowerCase();
    const idLower = action.id.toLowerCase();
    
    // Verificar primeiro palavras-chave no id
    for (const [keyword, color] of Object.entries(DEFAULT_ACTION_COLORS)) {
      if (idLower.includes(keyword)) {
        return color;
      }
    }
    
    // Depois verificar palavras-chave no nome
    for (const [keyword, color] of Object.entries(DEFAULT_ACTION_COLORS)) {
      if (nameLower.includes(keyword)) {
        return color;
      }
    }
    
    // Se nada for encontrado, usar a cor padrão
    return DEFAULT_ACTION_COLORS.default;
  };
  
  // Função para determinar o ícone padrão com base no nome ou id da ação
  const getDefaultActionIcon = (action: AppAction): React.ComponentType => {
    // Se já tiver um ícone definido, usá-lo
    if (action.icon) {
      return action.icon;
    }
    
    // Caso contrário, procurar por um ícone com base no nome da ação
    const nameLower = action.name.toLowerCase();
    const idLower = action.id.toLowerCase();
    
    // Verificar primeiro palavras-chave no id
    for (const [keyword, icon] of Object.entries(DEFAULT_ACTION_ICONS)) {
      if (idLower.includes(keyword)) {
        return icon;
      }
    }
    
    // Depois verificar palavras-chave no nome
    for (const [keyword, icon] of Object.entries(DEFAULT_ACTION_ICONS)) {
      if (nameLower.includes(keyword)) {
        return icon;
      }
    }
    
    // Se nada for encontrado, usar o ícone padrão
    return DEFAULT_ACTION_ICONS.default;
  };

  // Fecha o menu quando clica fora dele
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Fecha o menu com ESC
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-30 flex items-center justify-center p-4">
      <div 
        ref={menuRef} 
        className="bg-white rounded-xl shadow-xl max-w-sm w-full mx-auto overflow-hidden transform transition-all"
        style={{ maxHeight: '90vh' }}
      >
        <div className="bg-gray-50 px-4 py-3 flex justify-between items-center border-b">
          <h3 className="font-medium text-lg">{title}</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4">
          <div className="grid gap-3">
            {actions.map((action) => {
              // Obter a cor e o ícone mais adequados para esta ação
              const iconColor = getDefaultActionColor(action);
              const ActionIcon = getDefaultActionIcon(action);
              
              return (
                <Link
                  key={action.id}
                  href={action.href}
                  className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100 shadow-sm"
                  onClick={onClose}
                >
                  <div className={`p-2.5 rounded-md mr-4 ${iconColor} shadow-md flex items-center justify-center`}>
                    <ActionIcon size={20} className="text-white" strokeWidth={2.5} />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">{action.name}</div>
                    <div className="text-sm text-gray-500">{action.description || `Acessar ${action.name.toLowerCase()}`}</div>
                  </div>
                  <ChevronRight size={16} className="text-gray-400 ml-2" />
                </Link>
              );
            })}
            
            <Link
              href={mainHref}
              className="mt-2 text-center block w-full py-3 px-4 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium border border-blue-100"
              onClick={onClose}
            >
              Ver todas as opções
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 