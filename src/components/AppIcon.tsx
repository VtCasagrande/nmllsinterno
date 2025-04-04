'use client';

import React, { ElementType } from 'react';
import Link from 'next/link';
import { MoreVertical, Star, StarOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

interface AppIconProps {
  href: string;
  icon: ElementType;
  label: string;
  color: string;
  isFavorite: boolean;
  onToggleFavorite: (e: React.MouseEvent) => void;
  showMenu: () => void;
}

// Cores padrão para garantir visibilidade
const DEFAULT_COLORS = {
  entregas: 'bg-blue-500',
  devolucoes: 'bg-orange-500',
  trocas: 'bg-purple-500',
  recorrencias: 'bg-green-500',
  medicamentos: 'bg-red-500',
  avisos: 'bg-yellow-500',
  sugestoes: 'bg-sky-500',
  reembolsos: 'bg-emerald-500',
  crm: 'bg-indigo-500',
  usuarios: 'bg-pink-500',
  logs: 'bg-gray-600',
  configuracoes: 'bg-slate-500',
  ajuda: 'bg-teal-500',
  default: 'bg-blue-500'
};

export function AppIcon({
  href,
  icon: Icon,
  label,
  color,
  isFavorite,
  onToggleFavorite,
  showMenu
}: AppIconProps) {
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleFavorite(e);
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    showMenu();
  };

  // Determina uma cor de fundo baseada no label ou no id extraído do href
  const getDefaultColorFromLabel = () => {
    try {
      // Tenta extrair o ID do módulo a partir do href
      const pathParts = href.split('/');
      const moduleId = pathParts[pathParts.length - 1] || pathParts[pathParts.length - 2];
      
      // Tenta encontrar a cor padrão para este módulo
      const moduleColor = DEFAULT_COLORS[moduleId as keyof typeof DEFAULT_COLORS];
      if (moduleColor) return moduleColor;
      
      // Se não encontrou pelo ID do módulo, tenta pelo label
      const labelLower = label.toLowerCase();
      const matchedKey = Object.keys(DEFAULT_COLORS).find(key => 
        labelLower.includes(key)
      );
      
      return matchedKey 
        ? DEFAULT_COLORS[matchedKey as keyof typeof DEFAULT_COLORS] 
        : DEFAULT_COLORS.default;
    } catch (error) {
      console.error('Erro ao determinar cor padrão:', error);
      return DEFAULT_COLORS.default;
    }
  };
  
  // Garantir que todos os ícones tenham uma cor de fundo
  let ensureColor = color;
  
  // Se a cor estiver faltando ou for inválida, usar uma cor padrão
  if (!color || color === 'transparent' || color === 'bg-transparent' || color === 'bg-white' || color === 'white') {
    ensureColor = getDefaultColorFromLabel();
  }

  // Componente básico sem tooltip em caso de erro
  const iconComponent = (
    <div className="relative">
      <Link 
        href={href} 
        className="flex flex-col items-center p-4 rounded-lg transition-all hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <div className={`p-3 rounded-lg ${ensureColor} mb-2 text-white`}>
          <Icon className="h-6 w-6" />
        </div>
        <span className="text-sm text-center font-medium text-gray-700">{label}</span>
      </Link>
      
      <button 
        onClick={handleFavoriteClick}
        className="absolute top-2 right-10 text-gray-400 hover:text-yellow-500 transition-colors"
        aria-label={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      >
        {isFavorite ? (
          <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
        ) : (
          <StarOff className="h-5 w-5" />
        )}
      </button>
      
      <button 
        onClick={handleMenuClick}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-800 transition-colors"
        aria-label="Mostrar menu"
      >
        <MoreVertical className="h-5 w-5" />
      </button>
    </div>
  );

  // Tentar renderizar com tooltip, com fallback para renderização básica
  try {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {iconComponent}
          </TooltipTrigger>
          <TooltipContent>
            <p>{label}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  } catch (error) {
    console.error('Erro ao renderizar tooltip do AppIcon:', error);
    return iconComponent;
  }
} 