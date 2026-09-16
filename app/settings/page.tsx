'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import {
  Building2, User, Zap, ShieldCheck, CreditCard,
  Mail, ExternalLink, LogOut, CheckCircle2, Globe, Sparkles
} from 'lucide-react';
import { getStoredAuth, logoutUser, getLiveQuota, type AuthUser, type AuthTenant } from '@/lib/api';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const [auth, setAuth] = useState<{ user: AuthUser; tenant: AuthTenant } | null>(null);
  const [currency, setCurrency] = useState('$ AUD');
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');

  useEffect(() => {
    const data = getStoredAuth();
    if (data) {
      setAuth(data);
    }

    // Always fetch live quota from backend
    getLiveQuota().then(res => {
      if (res && res.tenant) {
        const liveTenant = res.tenant;
        setAuth(prev => ({
          user: prev?.user || {
            name: 'Nithin',
            email: 'nithin@billanongsolar.com.au',
            role: 'admin',
            status: 'active'
          },
          tenant: {
            id: liveTenant.id,
            company_name: liveTenant.company_name,
            license_key: liveTenant.license_key,
            plan: liveTenant.plan,
            status: liveTenant.status,
            connection_id: liveTenant.connection_id,
            monthly_limit: liveTenant.monthly_limit,
            queries_used: liveTenant.queries_used,
          }
        }));
      }
    }).catch(() => {});

    // Reactive listener for real-time query increments
    const handleQuotaUpdated = (e: any) => {
      if (e.detail) {
        setAuth(prev => {
          if (!prev) return null;
          return {
            ...prev,
            tenant: {
              ...prev.tenant,
              queries_used: e.detail.queries_used,
              monthly_limit: e.detail.monthly_limit || prev.tenant.monthly_limit,
            }
          };
        });
      }
    };

    window.addEventListener('maifelz_quota_updated', handleQuotaUpdated);
    return () => window.removeEventListener('maifelz_quota_updated', handleQuotaUpdated);
  }, []);

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Display preferences saved successfully!');
  };

  const pct = auth && auth.tenant.monthly_limit > 0 
    ? Math.min(100, Math.round((auth.tenant.queries_used / auth.tenant.monthly_limit) * 100)) 
    : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header
        title="Workspace &amp; Usage Settings"
        subtitle="Manage your profile, company subscription, and AI quota"
      />

      <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">

        {/* 1. Subscription & AI Quota Overview Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 md:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-slate-900">{auth?.tenant?.company_name || 'Your Company'}</span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#5a165d]/10 text-[#5a165d] text-xs font-bold uppercase">
                  {auth?.tenant?.plan || 'Professional'} Plan
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Connected Odoo ERP with AI Copilot powered by mAifelZ Technologies
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Subscription Active
              </span>
            </div>
          </div>

          {/* AI Query Usage Meter */}
          <div className="p-5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-[#5a165d]" />
                <span className="text-sm font-bold text-slate-800">Monthly AI Query Quota</span>
              </div>
              <span className="text-xs font-bold text-slate-700">
                {auth?.tenant?.queries_used.toLocaleString()} / {auth?.tenant?.monthly_limit.toLocaleString()} Queries Used
              </span>
            </div>

            <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#5a165d] rounded-full transition-all duration-500"
                style={{ width: `${Math.max(4, pct)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <span>Remaining this cycle: <strong className="text-slate-800">{((auth?.tenant?.monthly_limit || 2500) - (auth?.tenant?.queries_used || 0)).toLocaleString()} queries</strong></span>
              <a
                href="mailto:sales@maifelz.com?subject=Upgrade%20Query%20Limit"
                className="text-[#5a165d] font-bold hover:underline flex items-center gap-1"
              >
                Top-Up Queries <ExternalLink size={11} />
              </a>
            </div>
          </div>

          {/* License Key Badge */}
          <div className="flex items-center justify-between text-xs pt-2">
            <div className="text-slate-500">
              Assigned License Key:
              <span className="ml-2 font-mono font-semibold text-slate-800 bg-slate-100 px-2 py-1 rounded-lg">
                {auth?.tenant?.license_key ? `${auth.tenant.license_key.substring(0, 11)}••••-••••` : 'MFZ-PRO-2026-••••'}
              </span>
            </div>
            <div className="text-slate-400 text-[11px]">
              Managed by mAifelZ Admin
            </div>
          </div>
        </div>

        {/* 2. User Profile Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 md:p-8 space-y-4">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
            <User size={18} className="text-[#5a165d]" />
            <h2 className="text-base font-bold text-slate-900">Your Login Profile</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="text-[11px] text-slate-400 font-semibold uppercase">Full Name</div>
              <div className="text-sm font-bold text-slate-900 mt-1">{auth?.user?.name || 'Nithin'}</div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="text-[11px] text-slate-400 font-semibold uppercase">Work Email</div>
              <div className="text-sm font-bold text-slate-900 mt-1 truncate">{auth?.user?.email || 'nithin@billanongsolar.com.au'}</div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="text-[11px] text-slate-400 font-semibold uppercase">Authorized Seat Role</div>
              <div className="text-sm font-bold text-[#5a165d] capitalize mt-1">{auth?.user?.role || 'Executive Admin'}</div>
            </div>
          </div>
        </div>

        {/* 3. Display Preferences */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 md:p-8 space-y-4">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
            <Globe size={18} className="text-[#5a165d]" />
            <h2 className="text-base font-bold text-slate-900">Display &amp; Localization Preferences</h2>
          </div>

          <form onSubmit={handleSavePreferences} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Default Currency Display
                </label>
                <select
                  value={currency}
                  onChange={e => setCurrency(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#5a165d]"
                >
                  <option value="$ AUD">$ AUD (Australian Dollar)</option>
                  <option value="$ USD">$ USD (US Dollar)</option>
                  <option value="AED">AED (UAE Dirham)</option>
                  <option value="€ EUR">€ EUR (Euro)</option>
                  <option value="£ GBP">£ GBP (British Pound)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Date Format
                </label>
                <select
                  value={dateFormat}
                  onChange={e => setDateFormat(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#5a165d]"
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY (Standard)</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY (US)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#5a165d] text-white font-bold text-xs hover:bg-[#48114a] transition-all shadow-xs"
            >
              Save Preferences
            </button>
          </form>
        </div>

        {/* 4. Logout / Session Box */}
        <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200/80">
          <div className="text-xs text-slate-500">
            Logged in on this device. Finished your session?
          </div>
          <button
            onClick={logoutUser}
            className="px-4 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 font-bold text-xs transition-colors flex items-center gap-1.5"
          >
            <LogOut size={13} /> Sign Out
          </button>
        </div>

      </div>
    </div>
  );
}
