'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store';
import { getStoredAuth, type AuthUser, type AuthTenant } from '@/lib/api';
import {
  LayoutDashboard, Database, FileText, Settings,
  ChevronLeft, ChevronRight, BarChart3, ShieldCheck, Shield
} from 'lucide-react';

const ALL_NAV_ITEMS = [
  { href: '/dashboard', label: 'AI Copilot', icon: LayoutDashboard },
  { href: '/reports', label: 'Report History', icon: FileText },
  { href: '/settings', label: 'Workspace & Quota', icon: Settings },
  { href: '/connections', label: 'Odoo Connections', icon: Database, adminOnly: true },
  { href: '/admin', label: 'Master Admin', icon: Shield, adminOnly: true },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen, connections, activeConnectionId } = useAppStore();
  const activeConn = connections.find(c => c.id === activeConnectionId);
  const [auth, setAuth] = useState<{ user: AuthUser; tenant: AuthTenant } | null>(null);

  useEffect(() => {
    setAuth(getStoredAuth());
  }, []);

  const isMasterAdmin = !auth || auth.user?.email?.toLowerCase().includes('maifelz') || auth.user?.role === 'master_admin';

  const visibleNavItems = ALL_NAV_ITEMS.filter(item => {
    if (item.adminOnly) return isMasterAdmin;
    return true;
  });


  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 h-full z-50 transition-all duration-300 ease-in-out',
          'flex flex-col bg-white border-r border-slate-200 shadow-lg lg:shadow-sm',
          sidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0 lg:w-20',
          'lg:relative lg:z-auto'
        )}
      >
        {/* Brand Logo Header */}
        <div className={cn(
          'flex items-center h-20 px-4 border-b border-slate-100',
          sidebarOpen ? 'justify-between' : 'justify-center'
        )}>
          {sidebarOpen ? (
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <img
                src="/maifelz_logo.png"
                alt="mAifelZ"
                className="h-10 object-contain"
              />
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#5a165d]">
                  AI Copilot
                </span>
                <span className="text-[9px] text-slate-400 font-medium -mt-0.5">
                  for Odoo ERP
                </span>
              </div>
            </Link>
          ) : (
            <Link href="/dashboard">
              <img
                src="/maifelz_logo.png"
                alt="mAifelZ"
                className="h-8 object-contain"
              />
            </Link>
          )}

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>

        {/* Active Odoo DB Card */}
        {activeConn && sidebarOpen && (
          <div className="mx-3 mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-semibold text-slate-700">Connected DB</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#5a165d]/10 text-[#5a165d] font-semibold">
                v{activeConn.odoo_version}
              </span>
            </div>
            <div className="text-xs font-bold text-slate-900 mt-1 truncate">
              {activeConn.company_name || activeConn.label}
            </div>
            <div className="text-[10px] text-slate-400 truncate mt-0.5 font-mono">
              {activeConn.database}
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 py-4 px-2 space-y-1">
          {visibleNavItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/');

            return (
              <Link
                key={href}
                href={href}
                onClick={() => {
                  if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                    setSidebarOpen(false);
                  }
                }}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150',
                  'group relative text-sm font-medium',
                  active
                    ? 'bg-[#5a165d] text-white shadow-sm shadow-[#5a165d]/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                )}
              >
                <Icon
                  size={18}
                  className={cn(active ? 'text-white' : 'text-slate-400 group-hover:text-slate-700')}
                />
                {sidebarOpen && <span>{label}</span>}
                {!sidebarOpen && (
                  <div className="absolute left-full ml-2 px-2.5 py-1 bg-slate-900 text-white text-xs rounded-lg
                    opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-md">
                    {label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        {sidebarOpen && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2 text-slate-500">
              <ShieldCheck size={14} className="text-[#5a165d]" />
              <span className="text-[11px] font-semibold text-slate-700">Enterprise Edition</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Official Odoo Ready Partner
            </p>
          </div>
        )}
      </aside>
    </>
  );
}
