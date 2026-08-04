import React from 'react';
import { Sparkles } from 'lucide-react';

interface AiAutofillToggleProps {
  isEnabled: boolean;
  onToggle: () => void;
  disabled?: boolean;
  className?: string;
}

export const AiAutofillToggle: React.FC<AiAutofillToggleProps> = ({
  isEnabled,
  onToggle,
  disabled = false,
  className = ''
}) => {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 border select-none ${
        isEnabled
          ? 'bg-gradient-to-r from-violet-600/30 to-indigo-600/30 border-violet-500/50 text-violet-300 shadow-[0_0_12px_rgba(139,92,246,0.25)] hover:border-violet-400'
          : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
      title={isEnabled ? 'Auto Metadata Engine is ON' : 'Auto Metadata Engine is OFF'}
    >
      <Sparkles className={`h-3.5 w-3.5 transition-transform duration-300 ${isEnabled ? 'text-amber-400 scale-110 animate-pulse' : 'text-zinc-500'}`} />
      <span>✨ Smart Metadata Engine</span>
      <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold uppercase tracking-wider ${
        isEnabled ? 'bg-violet-500/30 text-violet-200 border border-violet-400/30' : 'bg-zinc-800 text-zinc-500'
      }`}>
        {isEnabled ? 'ON' : 'OFF'}
      </span>
    </button>
  );
};
