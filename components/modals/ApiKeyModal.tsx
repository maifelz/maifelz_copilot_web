'use client';

import { useState } from 'react';
import { X, Key, ExternalLink, Loader2, Sparkles, Check, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { saveApiKey } from '@/lib/api';
import toast from 'react-hot-toast';

interface Props {
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ApiKeyModal({ onClose, onSuccess }: Props) {
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!key.trim()) {
      toast.error('Please enter an API key');
      return;
    }
    setLoading(true);
    try {
      const res = await saveApiKey(key.trim());
      toast.success(res.message || 'AI engine connected successfully!');
      onSuccess?.();
      onClose();
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || 'Failed to save API key');
    } finally {
      setLoading(false);
    }
  };

  const detectedProvider = key.startsWith('sk-')
    ? 'OpenAI (GPT-4o)'
    : key.startsWith('gsk_')
    ? 'Groq (Llama 3)'
    : key.length > 10
    ? 'Google Gemini 2.0'
    : null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#5a165d]/10 text-[#5a165d]">
                  <Bot size={20} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Connect Conversational AI</h2>
                  <p className="text-xs text-slate-500">Google Gemini (Free) or OpenAI (ChatGPT)</p>
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700">
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Paste Your API Key
                </label>
                {detectedProvider && (
                  <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                    <Check size={11} /> {detectedProvider} detected
                  </span>
                )}
              </div>
              <input
                type="password"
                value={key}
                onChange={e => setKey(e.target.value)}
                placeholder="AIza... (Gemini) or sk-... (OpenAI)"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#5a165d] focus:bg-white transition-all"
              />
            </div>

            {/* Providers info */}
            <div className="space-y-2 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-800">Google Gemini (100% Free)</p>
                  <p className="text-[11px] text-slate-500">Official Google AI key — takes 10s to get</p>
                </div>
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1 rounded-lg bg-[#5a165d] text-white hover:bg-[#48114a] text-xs font-medium flex items-center gap-1 shadow-xs"
                >
                  Get Free Key <ExternalLink size={11} />
                </a>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-800">OpenAI (ChatGPT)</p>
                  <p className="text-[11px] text-slate-500">Paste your existing sk-... OpenAI key</p>
                </div>
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 text-xs font-medium flex items-center gap-1"
                >
                  Get Key <ExternalLink size={11} />
                </a>
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={loading || !key.trim()}
              className="w-full py-3 rounded-xl font-bold text-sm transition-all duration-200 bg-[#5a165d] text-white hover:bg-[#48114a] shadow-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader2 size={16} className="animate-spin" /> Activating AI...</>
              ) : (
                <><Key size={14} /> Connect & Activate AI</>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
