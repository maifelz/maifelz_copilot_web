'use client';

import { useState, useEffect } from 'react';
import { Menu, Database, ChevronDown, Sparkles, LogOut, User, Zap } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { getStoredAuth, logoutUser, getLiveQuota, getAIStatus, type AuthUser, type AuthTenant } from '@/lib/api';

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
  aiActive,
  aiEngineLabel,
}: HeaderProps) {
  const { setSidebarOpen, sidebarOpen, connections, activeConnectionId } = useAppStore();
  const activeConn = connections.find(c => c.id === activeConnectionId);
  const [auth, setAuth] = useState<{ user: AuthUser; tenant: AuthTenant } | null>(null);
  const [quota, setQuota] = useState<{ queries_used: number; monthly_limit: number } | null>(null);
  const [aiStatus, setAiStatus] = useState<{ gemini_active: boolean; engine: string } | null>(null);

  useEffect(() => {
    const stored = getStoredAuth();
    setAuth(stored);
    if (stored?.tenant) {
      setQuota({
        queries_used: stored.tenant.queries_used || 0,
        monthly_limit: stored.tenant.monthly_limit || 2500,
      });
    }

    // Auto-fetch live AI status
    getAIStatus()
      .then(status => {
        if (status) setAiStatus(status);
      })
      .catch(() => {});

    // Auto-fetch live quota
    getLiveQuota(activeConnectionId || undefined)
      .then(res => {
        const live = res?.tenant || (res as any);
        if (live && typeof live.queries_used === 'number') {
          setQuota({
            queries_used: live.queries_used,
            monthly_limit: live.monthly_limit || 2500,
          });
        }
      })
      .catch(() => {});

    // Reactive listener for real-time query updates from PromptBar / Dashboard
    const handleQuotaUpdated = (e: any) => {
      if (e.detail) {
        setQuota({
          queries_used: e.detail.queries_used,
          monthly_limit: e.detail.monthly_limit || 2500,
        });
      }
    };
    window.addEventListener('maifelz_quota_updated', handleQuotaUpdated);
    return () => window.removeEventListener('maifelz_quota_updated', handleQuotaUpdated);
  }, [activeConnectionId]);

  const effectiveAiActive = aiActive !== undefined ? aiActive : Boolean(aiStatus?.gemini_active);
  const effectiveEngineLabel = aiEngineLabel || aiStatus?.engine || 'Google Gemini 2.0 Flash';

  return (
    <header className="h-16 flex items-center justify-between px-3 sm:px-6 border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-30 shadow-xs">
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 flex-shrink-0"
        >
          <Menu size={20} />
        </button>
        <div className="min-w-0">
          <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight truncate">{title}</h1>
          {subtitle && <p className="text-[11px] sm:text-xs text-slate-500 truncate hidden xs:block">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {/* AI Engine Status Badge */}
        <div
          className={cn(
            'flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-semibold border shadow-xs',
            effectiveAiActive
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-[#5a165d]/5 text-[#5a165d] border-[#5a165d]/20'
          )}
        >
          <Sparkles size={13} className={effectiveAiActive ? 'text-emerald-600' : 'text-[#5a165d]'} />
          <span className="hidden sm:inline">
            {effectiveAiActive ? `${effectiveEngineLabel} Active` : 'Smart ERP Intelligence'}
          </span>
          <span className="sm:hidden text-[11px]">
            {effectiveAiActive ? 'Gemini' : 'ERP'}
          </span>
          {auth?.user?.role === 'master_admin' && onOpenAIConfig && (
            <button
              onClick={onOpenAIConfig}
              className="text-[10px] text-[#5a165d] font-bold underline ml-1 hover:text-[#451048]"
            >
              Config AI
            </button>
          )}
        </div>

        {/* Live Quota Pill */}
        {quota && (
          <a
            href="/settings"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-semibold border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors shadow-xs"
            title="Monthly AI Query Quota (Click to view in Settings)"
          >
            <Zap size={13} className="text-[#5a165d] fill-[#5a165d]/30" />
            <span>{quota.queries_used.toLocaleString()} / {quota.monthly_limit.toLocaleString()}</span>
            <span className="hidden sm:inline text-slate-400 font-normal text-[11px]">Queries</span>
          </a>
        )}

        {/* Database Selector Pill */}
        {connections.length > 0 && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium">
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

