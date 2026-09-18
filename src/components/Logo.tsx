import React from 'react';
import { Leaf } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  className,
  size = 'md',
  showSubtitle = true,
}) => {
  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  return (
    <div className={cn('flex flex-col items-center select-none', className)}>
      <div className="flex items-center gap-2.5">
        <div className="relative flex items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 p-2.5 shadow-lg shadow-emerald-500/25">
          <Leaf className={cn('text-white', iconSizes[size])} strokeWidth={2.2} />
          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-300 rounded-full border-2 border-white animate-pulse" />
        </div>
        <div className="flex flex-col">
          <span className={cn('font-extrabold tracking-tight text-slate-900', textSizes[size])}>
            Nutri<span className="text-emerald-600">Connect</span>
          </span>
        </div>
      </div>
      {showSubtitle && (
        <span className="mt-1 text-xs font-medium uppercase tracking-wider text-emerald-700/70">
          Plataforma para Nutricionistas
        </span>
      )}
    </div>
  );
};
