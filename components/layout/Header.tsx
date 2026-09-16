'use client';

import { useState, useEffect } from 'react';
import { Menu, Database, ChevronDown, Sparkles, LogOut, User } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { getStoredAuth, logoutUser, type AuthUser, type AuthTenant } from '@/lib/api';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  onOpenAIConfig?: () => void;
  aiActive?: boolean;
  aiEngineLabel?: string;
}

export default function Header({
  title = 'AI Copilot',
  subtitle,
  onOpenAIConfig,
  aiActive = false,
  aiEngineLabel = 'AI Engine',
}: HeaderProps) {
  const { setSidebarOpen, sidebarOpen, connections, activeConnectionId } = useAppStore();
  const activeConn = connections.find(c => c.id === activeConnectionId);
  const [auth, setAuth] = useState<{ user: AuthUser; tenant: AuthTenant } | null>(null);

  useEffect(() => {
    setAuth(getStoredAuth());
  }, []);

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-30 shadow-xs">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800"
        >
          <Menu size={20} />
        </button>
        <div>
          <h1 className="text-base font-bold text-slate-900 tracking-tight">{title}</h1>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* AI Engine Status Button */}
        {onOpenAIConfig && (
          <button
            onClick={onOpenAIConfig}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border shadow-xs',
              aiActive
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                : 'bg-[#5a165d]/5 text-[#5a165d] border-[#5a165d]/20 hover:bg-[#5a165d]/10'
            )}
          >
            <Sparkles size={13} className={aiActive ? 'text-emerald-600' : 'text-[#5a165d]'} />
            <span>{aiEngineLabel}</span>
            <span className="text-[10px] text-slate-400 font-normal underline">Connect AI</span>
          </button>
        )}

        {/* Database Selector Pill */}
        {connections.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium">
            <div className={cn(
              'w-2 h-2 rounded-full',
              activeConn ? 'bg-emerald-500' : 'bg-slate-300'
            )} />
            <Database size={13} className="text-slate-400" />
            <span className="max-w-[140px] truncate">
              {auth?.tenant?.company_name || (activeConn ? (activeConn.company_name || activeConn.label) : 'Select DB')}
            </span>
          </div>
        )}

        {/* User Pill / Login Link */}
        {auth ? (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="hidden sm:block text-right">
              <div className="text-xs font-bold text-slate-800 leading-tight">{auth.user.name}</div>
              <div className="text-[10px] text-slate-400 capitalize">{auth.user.role}</div>
            </div>
            <div className="w-8 h-8 rounded-full bg-[#5a165d] flex items-center justify-center text-xs font-bold text-white shadow-xs">
              {auth.user.name.charAt(0).toUpperCase()}
            </div>
            <button
              onClick={logoutUser}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Sign Out"
            >
              <LogOut size={15} />
            </button>
          </div>
        ) : (
          <a
            href="/login"
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
          >
            Sign In
          </a>
        )}
      </div>
    </header>
  );
}

