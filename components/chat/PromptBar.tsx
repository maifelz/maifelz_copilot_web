'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Loader2, Mic, MicOff, Globe, ChevronDown, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const PLACEHOLDER_PROMPTS = [
  'ഏറ്റവും കൂടുതൽ തുകയുള്ള പർച്ചേസ് ഓർഡർ ഏതാണ്?',
  'How many leads were generated today, and provide details...',
  'Which is the highest value invoice this month?',
  'കഴിഞ്ഞ മാസത്തെ ടോപ്പ് സെയിൽസ് ഓർഡറുകൾ ഏതൊക്കെയാണ്?',
  'What is our last invoice number and customer details?',
  'Top 10 customers by revenue this year...',
  'ഷോ ഓൾ പ്രൊജക്റ്റുകൾ ആൻഡ് ടാസ്ക് സ്റ്റാറ്റസ്...',
];

const VOICE_LANGUAGES = [
  { code: 'ml-IN', label: 'മലയാളം', short: 'ML', flag: '🇮🇳' },
  { code: 'en-US', label: 'English', short: 'EN', flag: '🇬🇧' },
  { code: 'hi-IN', label: 'हिन्दी', short: 'HI', flag: '🇮🇳' },
  { code: 'ar-SA', label: 'العربية', short: 'AR', flag: '🇸🇦' },
];

interface Props {
  onSubmit: (prompt: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export default function PromptBar({ onSubmit, isLoading = false, disabled = false }: Props) {
  const [value, setValue] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [selectedLang, setSelectedLang] = useState('ml-IN');
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem('maifelz_voice_lang');
    if (saved) {
      setSelectedLang(saved);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex(i => (i + 1) % PLACEHOLDER_PROMPTS.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [value]);

  const setLanguage = (code: string) => {
    setSelectedLang(code);
    localStorage.setItem('maifelz_voice_lang', code);
    setShowLangMenu(false);
  };

  const startVoiceRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error('Voice input is not supported in this browser. Please use Chrome, Safari, or Edge.');
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      recognition.lang = selectedLang;
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
        const langObj = VOICE_LANGUAGES.find(l => l.code === selectedLang);
        toast(`Listening in ${langObj?.label || 'selected language'}... Speak now!`, { icon: '🎙️', duration: 3000 });
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript.trim()) {
          setValue(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error !== 'no-speech') {
          toast.error(`Voice error: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('Failed to start recognition:', err);
      toast.error('Could not access microphone');
      setIsListening(false);
    }
  };

  const stopVoiceRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const toggleVoice = () => {
    if (isListening) {
      stopVoiceRecognition();
    } else {
      startVoiceRecognition();
    }
  };

  const handleSubmit = () => {
    if (isListening) {
      stopVoiceRecognition();
    }
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

  const activeLangObj = VOICE_LANGUAGES.find(l => l.code === selectedLang) || VOICE_LANGUAGES[0];

  return (
    <div className={cn(
      'relative rounded-2xl border transition-all duration-200 bg-white shadow-xs',
      disabled
        ? 'border-slate-200 opacity-60 cursor-not-allowed bg-slate-50'
        : isListening
        ? 'border-rose-500 shadow-md shadow-rose-500/15 ring-2 ring-rose-200'
        : value
        ? 'border-[#5a165d] shadow-md shadow-[#5a165d]/5'
        : 'border-slate-300 hover:border-slate-400'
    )}>
      {/* Listening Banner */}
      {isListening && (
        <div className="px-4 py-2 bg-rose-50 border-b border-rose-100 rounded-t-2xl flex items-center justify-between text-xs text-rose-700">
          <div className="flex items-center gap-2 font-medium">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600"></span>
            </span>
            <span>Listening in <strong>{activeLangObj.label} ({activeLangObj.short})</strong>... Speak now</span>
          </div>
          <button
            onClick={stopVoiceRecognition}
            className="text-[11px] font-bold text-rose-800 bg-rose-200/60 hover:bg-rose-200 px-2 py-0.5 rounded-md transition-colors"
          >
            Done Speaking
          </button>
        </div>
      )}

      <div className="flex items-end gap-2 sm:gap-3 p-3 sm:p-3.5">
        {/* AI Brand Icon */}
        <div className={cn(
          'flex-shrink-0 p-2 sm:p-2.5 rounded-xl transition-colors',
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
          placeholder={placeholderIndex % 2 === 0 ? PLACEHOLDER_PROMPTS[placeholderIndex] : `${activeLangObj.flag} ${PLACEHOLDER_PROMPTS[placeholderIndex]}`}
          rows={1}
          className="flex-1 bg-transparent text-slate-900 text-xs sm:text-sm resize-none outline-none placeholder:text-slate-400 min-h-[26px] max-h-[120px] scrollbar-thin py-1"
        />

        {/* Multilingual Voice Controls */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Language Selector Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowLangMenu(!showLangMenu)}
              title="Change Voice & Query Language"
              className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
            >
              <span>{activeLangObj.flag}</span>
              <span className="hidden sm:inline text-[11px]">{activeLangObj.short}</span>
              <ChevronDown size={12} className="text-slate-400" />
            </button>

            {showLangMenu && (
              <div className="absolute right-0 bottom-full mb-2 w-44 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-50 text-xs animate-in fade-in zoom-in-95">
                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  Voice & Input Language
                </div>
                {VOICE_LANGUAGES.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className={cn(
                      'w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 transition-colors',
                      selectedLang === lang.code ? 'bg-[#5a165d]/5 text-[#5a165d] font-bold' : 'text-slate-700'
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <span>{lang.flag}</span>
                      <span>{lang.label}</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{lang.short}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Microphone Voice Input Button */}
          <button
            type="button"
            onClick={toggleVoice}
            disabled={disabled || isLoading}
            title={isListening ? 'Stop Listening' : `Speak in ${activeLangObj.label}`}
            className={cn(
              'p-2.5 rounded-xl transition-all duration-200 flex items-center justify-center',
              isListening
                ? 'bg-rose-600 text-white shadow-md animate-pulse'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-[#5a165d]'
            )}
          >
            {isListening ? <MicOff size={16} /> : <Mic size={16} />}
          </button>

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
      </div>

      <div className="px-3 sm:px-4 pb-2.5 flex items-center justify-between">
        <span className="text-[11px] text-slate-400 truncate max-w-[280px] sm:max-w-none">
          {isLoading
            ? 'Consulting your Odoo ERP database...'
            : isListening
            ? `Speaking in ${activeLangObj.label}...`
            : `Ask in ${activeLangObj.label} or English · Press Enter to send`}
        </span>
        <span className="text-[10px] text-slate-400">{value.length}/2000</span>
      </div>
    </div>
  );
}
