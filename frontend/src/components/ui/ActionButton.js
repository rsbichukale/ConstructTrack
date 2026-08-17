import React from 'react';
import { Loader2 } from 'lucide-react';

export const ActionButton = ({
  children,
  onClick,
  variant = 'primary', // 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'
  size = 'md', // 'sm' | 'md' | 'lg'
  icon: Icon,
  loading = false,
  disabled = false,
  className = '',
  type = 'button'
}) => {
  const variantMap = {
    primary: 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold border-amber-400/30 shadow-lg shadow-amber-500/20',
    secondary: 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700',
    danger: 'bg-rose-500 hover:bg-rose-400 text-white font-bold border-rose-400/30 shadow-lg shadow-rose-500/20',
    ghost: 'bg-transparent hover:bg-slate-800 text-slate-300 hover:text-white border-transparent',
    outline: 'bg-transparent hover:bg-slate-800/60 text-amber-400 border-amber-500/30 hover:border-amber-500/60'
  };

  const sizeMap = {
    sm: 'px-2.5 py-1 text-xs gap-1.5',
    md: 'px-4 py-2 text-xs font-semibold gap-2',
    lg: 'px-5 py-2.5 text-sm font-bold gap-2.5'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center rounded-xl border transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${variantMap[variant]} ${sizeMap[size]} ${className}`}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        Icon && <Icon className="h-4 w-4 shrink-0" />
      )}
      <span>{children}</span>
    </button>
  );
};

export default ActionButton;
