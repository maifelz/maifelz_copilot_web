'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const PLACEHOLDER_PROMPTS = [
  'How many leads were generated today, and provide details...',
  'Which is the highest value invoice this month?',
  'What is our last invoice number and customer details?',
  'Top 10 customers by revenue this year...',
  'Show all overdue invoices and outstanding balances...',
  'Sales pipeline by stage with expected values...',
];

interface Props {
  onSubmit: (prompt: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export default function PromptBar({ onSubmit, isLoading = false, disabled = false }: Props) {
  const [value, setValue] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex(i => (i + 1) % PLACEHOLDER_PROMPTS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [value]);

  const handleSubmit = () => {
    if (!value.trim() || isLoading || disabled) return;
    onSubmit(value.trim());
    setValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className={cn(
      'relative rounded-2xl border transition-all duration-200 bg-white shadow-xs',
      disabled
        ? 'border-slate-200 opacity-60 cursor-not-allowed bg-slate-50'
        : value
        ? 'border-[#5a165d] shadow-md shadow-[#5a165d]/5'
        : 'border-slate-300 hover:border-slate-400'
    )}>
      <div className="flex items-end gap-3 p-3.5">
        {/* AI Brand Icon */}
        <div className={cn(
          'flex-shrink-0 p-2.5 rounded-xl transition-colors',
          isLoading ? 'bg-[#5a165d]/10 text-[#5a165d]' : 'bg-slate-100 text-slate-500'
        )}>
          {isLoading ? (
            <Loader2 size={18} className="animate-spin text-[#5a165d]" />
          ) : (
            <Sparkles size={18} className="text-[#5a165d]" />
          )}
        </div>

        {/* Text Input */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || isLoading}
          placeholder={PLACEHOLDER_PROMPTS[placeholderIndex]}
          rows={1}
          className="flex-1 bg-transparent text-slate-900 text-sm resize-none outline-none placeholder:text-slate-400 min-h-[26px] max-h-[120px] scrollbar-thin py-1"
        />

        {/* Send Button */}
        <button
          onClick={handleSubmit}
          disabled={!value.trim() || isLoading || disabled}
          className={cn(
            'p-2.5 rounded-xl transition-all duration-200 flex-shrink-0',
            value.trim() && !isLoading && !disabled
              ? 'bg-[#5a165d] text-white shadow-sm hover:bg-[#48114a] hover:scale-105'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          )}
        >
          <Send size={16} />
        </button>
      </div>

      <div className="px-4 pb-2.5 flex items-center justify-between">
        <span className="text-[11px] text-slate-400">
          {isLoading ? 'Consulting your Odoo ERP database...' : 'Press Enter to send · Shift+Enter for new line'}
        </span>
        <span className="text-[10px] text-slate-400">{value.length}/2000</span>
      </div>
    </div>
  );
}
