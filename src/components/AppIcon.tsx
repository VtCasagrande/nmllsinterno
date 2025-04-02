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
}

export function AppIcon({
  href,
  icon: Icon,
  label,
  color,
  onClick,
  size = 'md',
  isFavorite,
  onToggleFavorite
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
  
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(e);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex flex-col items-center gap-1 relative">
            <Link 
              href={href} 
              onClick={onClick}
              className="relative"
            >
              <div 
                className={cn(
                  `rounded-2xl flex items-center justify-center ${sizeClasses[size]}`,
                  color
                )}
              >
                <Icon size={iconSizes[size]} className="text-white" />
              </div>
              {isFavorite !== undefined && (
                <button 
                  onClick={handleFavoriteClick}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full shadow flex items-center justify-center"
                >
                  <span className={cn("text-yellow-500", isFavorite ? "opacity-100" : "opacity-40")}>
                    ★
                  </span>
                </button>
              )}
            </Link>
            <span className="text-xs text-center font-medium text-gray-800 max-w-[80px] truncate">
              {label}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
} 