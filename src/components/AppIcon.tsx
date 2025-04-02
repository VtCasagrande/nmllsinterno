import React from 'react';
import Link from 'next/link';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

interface AppIconProps {
  href: string;
  icon: LucideIcon;
  label: string;
  color: string;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  isFavorite?: boolean;
  onToggleFavorite?: (e: React.MouseEvent) => void;
  showMenu?: () => void;
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
  onClick,
  size = 'md',
  isFavorite,
  onToggleFavorite,
  showMenu
}: AppIconProps) {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-20 h-20',
    lg: 'w-24 h-24'
  };
  
  const iconSizes = {
    sm: 24,
    md: 32,
    lg: 40
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
  
  const handleFavoriteClick = (e: React.MouseEvent) => {
    try {
      e.preventDefault();
      e.stopPropagation();
      if (onToggleFavorite) {
        onToggleFavorite(e);
      }
    } catch (error) {
      console.error('Erro ao clicar no favorito:', error);
    }
  };

  const handleAppClick = (e: React.MouseEvent) => {
    if (showMenu) {
      e.preventDefault();
      showMenu();
    }
    // Se não tiver showMenu, o link funcionará normalmente
  };

  // Componente básico sem tooltip em caso de erro
  const iconComponent = (
    <div className="flex flex-col items-center gap-1 relative">
      <Link 
        href={href} 
        onClick={handleAppClick}
        className="relative focus:outline-none group"
      >
        <div 
          className={cn(
            `rounded-2xl flex items-center justify-center shadow-lg transition-transform transform group-hover:scale-105 ${sizeClasses[size]}`,
            ensureColor.startsWith('bg-') ? ensureColor : ''
          )}
          style={{ backgroundColor: !ensureColor.startsWith('bg-') ? ensureColor : undefined }}
        >
          <Icon 
            size={iconSizes[size]} 
            className="text-white drop-shadow-md" 
            strokeWidth={2.5}
          />
        </div>
        {isFavorite !== undefined && (
          <button 
            onClick={handleFavoriteClick}
            className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center focus:outline-none hover:bg-gray-50"
          >
            <span className={cn("text-yellow-500 drop-shadow-sm", isFavorite ? "opacity-100" : "opacity-40")}>
              ★
            </span>
          </button>
        )}
      </Link>
      <span className="text-xs text-center font-semibold text-gray-800 max-w-[80px] truncate mt-1">
        {label}
      </span>
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