import React from 'react';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Avatar({ className = '', ...props }: AvatarProps) {
  return (
    <div
      className={`relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full ${className}`}
      {...props}
    />
  );
}

interface AvatarImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  onLoadingStatusChange?: (status: 'loading' | 'loaded' | 'error') => void;
}

export function AvatarImage({
  className = '',
  onLoadingStatusChange,
  ...props
}: AvatarImageProps) {
  return (
    <img
      className={`aspect-square h-full w-full object-cover ${className}`}
      onLoad={() => onLoadingStatusChange && onLoadingStatusChange('loaded')}
      onError={() => onLoadingStatusChange && onLoadingStatusChange('error')}
      {...props}
    />
  );
}

interface AvatarFallbackProps extends React.HTMLAttributes<HTMLDivElement> {
  delayMs?: number;
}

export function AvatarFallback({
  className = '',
  delayMs = 0,
  ...props
}: AvatarFallbackProps) {
  const [isVisible, setIsVisible] = React.useState(delayMs === 0);

  React.useEffect(() => {
    if (delayMs > 0) {
      const timeout = setTimeout(() => setIsVisible(true), delayMs);
      return () => clearTimeout(timeout);
    }
  }, [delayMs]);

  if (!isVisible) return null;

  return (
    <div
      className={`flex h-full w-full items-center justify-center rounded-full bg-gray-100 text-gray-600 ${className}`}
      {...props}
    />
  );
}
