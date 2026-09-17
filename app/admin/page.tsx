'use client';

import { useState, useEffect } from 'react';
import {
  Users, Key, Shield, ShieldAlert, ShieldCheck, Plus, Copy, Check,
  RefreshCw, Power, DollarSign, Activity, AlertTriangle, ExternalLink,
  ChevronRight, ArrowUpRight, UserPlus, Trash2, Zap, Database, Link2,
  Globe, Server, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import Header from '@/components/layout/Header';
import {
  getAdminSummary, createTenant, updateTenantStatus, resetTenantUsage,
  addTenantUser, deleteTenantUser, topupTenantCredits,
  getConnections, assignTenantConnection, connectAndAssignOdoo,
  type Tenant, type AdminSummary, type TenantUser, type OdooConnection
} from '@/lib/api';
import toast from 'react-hot-toast';

export default function MasterAdminPage() {
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [connections, setConnections] = useState<OdooConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Selected tenant for Seat Management Modal
  const [selectedTenantForSeats, setSelectedTenantForSeats] = useState<Tenant | null>(null);
  const [newSeatEmail, setNewSeatEmail] = useState('');
  const [newSeatName, setNewSeatName] = useState('');
  const [newSeatRole, setNewSeatRole] = useState('manager');
  const [newSeatPassword, setNewSeatPassword] = useState('');
  const [seatActionLoading, setSeatActionLoading] = useState(false);

  // Top-Up Modal State
  const [selectedTenantForTopup, setSelectedTenantForTopup] = useState<Tenant | null>(null);
  const [topupAmount, setTopupAmount] = useState(500);
  const [topupLoading, setTopupLoading] = useState(false);

  // Database Assignment Modal State
  const [selectedTenantForDB, setSelectedTenantForDB] = useState<Tenant | null>(null);
  const [dbModalTab, setDbModalTab] = useState<'select' | 'new'>('select');
  const [selectedConnId, setSelectedConnId] = useState('');
  const [newDbForm, setNewDbForm] = useState({
    url: '',
    database: '',
    username: '',
    password: '',
    label: '',
  });
  const [dbLoading, setDbLoading] = useState(false);

  // New Tenant Form
  const [form, setForm] = useState({
    company_name: '',
    contact_email: '',
    plan: 'professional',
    connection_id: '',
    custom_limit: 2500,
    notes: '',
  });
  const [creating, setCreating] = useState(false);


  const loadData = async () => {
    try {
      const [data, conns] = await Promise.all([
        getAdminSummary(),
        getConnections().catch(() => []),
      ]);
      setSummary(data);
      setConnections(conns || []);
    } catch {
      toast.error('Failed to load admin summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    toast.success('License key copied to clipboard!');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleToggleStatus = async (tenant: Tenant) => {
    const newStatus = tenant.status === 'active' ? 'suspended' : 'active';
    const action = newStatus === 'suspended' ? 'SUSPEND (Kill Switch)' : 'ACTIVATE';
    if (!confirm(`Are you sure you want to ${action} client "${tenant.company_name}"?`)) return;

    try {
      await updateTenantStatus(tenant.id, newStatus);
      toast.success(`Client ${tenant.company_name} is now ${newStatus.toUpperCase()}`);
      loadData();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleResetUsage = async (tenant: Tenant) => {
    if (!confirm(`Reset monthly query count to 0 for "${tenant.company_name}"?`)) return;
    try {
      await resetTenantUsage(tenant.id, 0);
      toast.success(`Reset query counter for ${tenant.company_name}`);
      loadData();
    } catch {
      toast.error('Failed to reset usage');
    }
  };

  const handleCreateTenant = async () => {
    if (!form.company_name.trim() || !form.contact_email.trim()) {
      toast.error('Please enter company name and email');
      return;
    }

    setCreating(true);
    try {
      const res = await createTenant({
        company_name: form.company_name,
        contact_email: form.contact_email,
        plan: form.plan,
        connection_id: form.connection_id || undefined,
        custom_limit: Number(form.custom_limit) || 2500,
        notes: form.notes,
      });

      if (res.success) {
        toast.success(`Client "${res.tenant.company_name}" created!`);
        setShowModal(false);
        setForm({
          company_name: '',
          contact_email: '',
          plan: 'professional',
          connection_id: '',
          custom_limit: 2500,
          notes: '',
        });
        loadData();
      }
    } catch {
      toast.error('Failed to provision client');
    } finally {
      setCreating(false);
    }
  };

  const handleOpenDbModal = (tenant: Tenant) => {
    setSelectedTenantForDB(tenant);
    setSelectedConnId(tenant.connection_id || (connections[0]?.id || ''));
    setDbModalTab('select');
    setNewDbForm({
      url: '',
      database: '',
      username: '',
      password: '',
      label: tenant.company_name,
    });
  };

  const handleAssignExistingDb = async () => {
    if (!selectedTenantForDB) return;
    setDbLoading(true);
    try {
      const res = await assignTenantConnection(selectedTenantForDB.id, selectedConnId);
      if (res.success) {
        toast.success(res.message || `Database assigned to ${selectedTenantForDB.company_name}`);
        setSelectedTenantForDB(null);
        loadData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to assign database');
    } finally {
      setDbLoading(false);
    }
  };

  const handleConnectNewDb = async () => {
    if (!selectedTenantForDB) return;
    if (!newDbForm.url.trim() || !newDbForm.database.trim() || !newDbForm.username.trim() || !newDbForm.password.trim()) {
      toast.error('Please fill in all Odoo connection fields');
      return;
    }
    setDbLoading(true);
    try {
      const res = await connectAndAssignOdoo(selectedTenantForDB.id, {
        url: newDbForm.url.trim(),
        database: newDbForm.database.trim(),
        username: newDbForm.username.trim(),
        password: newDbForm.password.trim(),
        label: newDbForm.label.trim() || selectedTenantForDB.company_name,
      });
      if (res.success) {
        toast.success(res.message || 'Odoo database connected & assigned!');
        setSelectedTenantForDB(null);
        loadData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to connect to Odoo');
    } finally {
      setDbLoading(false);
    }
  };

  const handleAddSeat = async () => {
    if (!selectedTenantForSeats || !newSeatEmail.trim()) {
      toast.error('Please enter employee email');
      return;
    }
    setSeatActionLoading(true);
    try {
      const res = await addTenantUser(
        selectedTenantForSeats.id,
        newSeatEmail.trim(),
        newSeatName.trim() || newSeatEmail.split('@')[0],
        newSeatRole,
        newSeatPassword.trim() || undefined
      );
      if (res.success) {
        toast.success(res.message);
        if (res.initial_password) {
          toast.success(`Generated Password: ${res.initial_password}`, { duration: 6000 });
        }
        setSelectedTenantForSeats(res.tenant);
        setNewSeatEmail('');
        setNewSeatName('');
        setNewSeatPassword('');
        loadData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to add user seat');
    } finally {
      setSeatActionLoading(false);
    }
  };

  const handleCopyCredentials = (user: any) => {
    const pass = user.password || 'Solar2026!';
    const text = `mAifelZ AI Copilot Login Credentials\nPortal: https://copilot.maifelz.com\nUser: ${user.name}\nEmail: ${user.email}\nPassword: ${pass}`;
    navigator.clipboard.writeText(text);
    toast.success(`Copied login credentials for ${user.email}!`);
  };

  const handleRemoveSeat = async (email: string) => {
    if (!selectedTenantForSeats) return;
    if (!confirm(`Revoke login seat for ${email}?`)) return;

    setSeatActionLoading(true);
    try {
      const res = await deleteTenantUser(selectedTenantForSeats.id, email);
      if (res.success) {
        toast.success(res.message);
        setSelectedTenantForSeats(res.tenant);
        loadData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to remove user seat');
    } finally {
      setSeatActionLoading(false);
    }
  };


  const handleTopup = async () => {
    if (!selectedTenantForTopup) return;
    setTopupLoading(true);
    try {
      const res = await topupTenantCredits(selectedTenantForTopup.id, topupAmount);
      if (res.success) {
        toast.success(res.message);
        setSelectedTenantForTopup(null);
        loadData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to top up credits');
    } finally {
      setTopupLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-slate-50">
      <Header
        title="mAifelZ Master Command Center"
        subtitle="Centralized Client Provisioning, Licensing & Metering (Controlled by mAifelZ)"
      />

      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">

        {/* ── Top SaaS KPIs ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Estimated MRR</span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                <DollarSign size={16} />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2">
              ${summary?.estimated_mrr_usd?.toLocaleString() || 0}
              <span className="text-xs text-slate-400 font-normal"> / mo</span>
            </p>
            <p className="text-[11px] text-emerald-600 font-medium mt-1">Based on active plan subscriptions</p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Clients</span>
              <div className="p-2 rounded-xl bg-[#5a165d]/10 text-[#5a165d]">
                <Users size={16} />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2">{summary?.total_clients || 0}</p>
            <p className="text-[11px] text-slate-400 mt-1">{summary?.active_clients || 0} currently active</p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">AI Queries Metered</span>
              <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
                <Activity size={16} />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2">{summary?.total_queries_metered || 0}</p>
            <p className="text-[11px] text-slate-400 mt-1">Tracked across all Odoo instances</p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">mAifelZ Cloud Gate</span>
              <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
                <ShieldCheck size={16} />
              </div>
            </div>
            <p className="text-sm font-bold text-slate-900 mt-2">100% Enforced</p>
            <p className="text-[11px] text-slate-400 mt-1">Zero client control · Kill-switch active</p>
          </div>
        </div>

        {/* ── Client List Table ── */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Shield size={18} className="text-[#5a165d]" />
                Client Accounts & License Keys
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Every customer requires an active license key to execute queries against their Odoo database
              </p>
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#5a165d] text-white text-xs font-bold hover:bg-[#48114a] transition-all shadow-xs"
            >
              <Plus size={15} /> Provision New Client
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-6">Company / Contact</th>
                  <th className="py-3.5 px-4">License Key</th>
                  <th className="py-3.5 px-4">Plan</th>
                  <th className="py-3.5 px-4">Connected Odoo DB</th>
                  <th className="py-3.5 px-4">Logins / Seats ($25/seat)</th>
                  <th className="py-3.5 px-6">Monthly AI Usage</th>
                  <th className="py-3.5 px-4">Status (Kill Switch)</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summary?.tenants.map(t => {
                  const pct = Math.min(100, Math.round((t.queries_used / t.monthly_limit) * 100));
                  const isSuspended = t.status === 'suspended';
                  const seatsCount = t.seats_count || t.user_logins?.length || 1;

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Company Name */}
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-900 text-sm">{t.company_name}</div>
                        <div className="text-slate-400 text-[11px]">{t.contact_email}</div>
                        {t.notes && <div className="text-[10px] text-slate-400 italic mt-0.5">{t.notes}</div>}
                      </td>

                      {/* License Key with Copy Button */}
                      <td className="py-4 px-4">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 font-mono text-[11px] text-slate-800">
                          <span>{t.license_key}</span>
                          <button
                            onClick={() => handleCopy(t.license_key)}
                            className="p-1 hover:text-[#5a165d] transition-colors"
                            title="Copy License Key"
                          >
                            {copiedKey === t.license_key ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                          </button>
                        </div>
                      </td>

                      {/* Plan */}
                      <td className="py-4 px-4">
                        <span className={cn(
                          'px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider',
                          t.plan === 'enterprise' ? 'bg-purple-100 text-purple-700' :
                          t.plan === 'professional' ? 'bg-[#5a165d]/10 text-[#5a165d]' :
                          'bg-slate-100 text-slate-700'
                        )}>
                          {t.plan}
                        </span>
                      </td>

                      {/* Connected Odoo Database */}
                      <td className="py-4 px-4">
                        {t.connection_id ? (
                          (() => {
                            const linked = connections.find(c => c.id === t.connection_id);
                            return (
                              <div className="space-y-1">
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold max-w-[170px] truncate" title={linked ? `${linked.company_name || linked.label} (${linked.url})` : t.connection_id}>
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                  <Database size={12} className="text-emerald-600 shrink-0" />
                                  <span className="truncate">{linked ? (linked.company_name || linked.label) : 'Linked DB'}</span>
                                </div>
                                <div>
                                  <button
                                    onClick={() => handleOpenDbModal(t)}
                                    className="text-[10px] text-[#5a165d] hover:underline font-bold"
                                  >
                                    Change DB
                                  </button>
                                </div>
                              </div>
                            );
                          })()
                        ) : (
                          <div>
                            <button
                              onClick={() => handleOpenDbModal(t)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-[11px] font-bold transition-all shadow-2xs"
                              title="Assign or connect an Odoo database for this client"
                            >
                              <Database size={11} className="text-amber-600" />
                              <span>Assign DB</span>
                            </button>
                            <div className="text-[10px] text-slate-400 mt-0.5">Not linked</div>
                          </div>
                        )}
                      </td>

                      {/* Seats / User Logins */}
                      <td className="py-4 px-4">
                        <button
                          onClick={() => setSelectedTenantForSeats(t)}
                          className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#5a165d]/5 hover:bg-[#5a165d]/15 border border-[#5a165d]/20 text-[#5a165d] font-bold transition-all group"
                          title="Manage User Logins for this client"
                        >
                          <Users size={13} className="text-[#5a165d]" />
                          <span>{seatsCount} {seatsCount === 1 ? 'Seat' : 'Seats'}</span>
                          <span className="text-[10px] text-[#777f8b] font-medium">(${seatsCount * 25}/mo)</span>
                          <ChevronRight size={12} className="text-[#5a165d]/60 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      </td>

                      {/* Metered Query Usage Bar */}
                      <td className="py-4 px-6 min-w-[200px]">
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="font-semibold text-slate-800">
                            {t.queries_used.toLocaleString()} / {t.monthly_limit.toLocaleString()}
                          </span>
                          <span className={cn(
                            'font-bold',
                            pct > 90 ? 'text-rose-600' : pct > 75 ? 'text-amber-600' : 'text-slate-500'
                          )}>
                            {pct}%
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all duration-300',
                              pct > 90 ? 'bg-rose-500' : pct > 75 ? 'bg-amber-500' : 'bg-[#5a165d]'
                            )}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </td>

                      {/* Status / Kill Switch */}
                      <td className="py-4 px-4">
                        <span className={cn(
                          'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border',
                          t.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          t.status === 'suspended' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          'bg-amber-50 text-amber-700 border-amber-200'
                        )}>
                          <span className={cn(
                            'w-1.5 h-1.5 rounded-full',
                            t.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'
                          )} />
                          {t.status.toUpperCase()}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedTenantForTopup(t)}
                            className="px-2 py-1 rounded-lg border border-purple-200 bg-purple-50 text-[#5a165d] hover:bg-purple-100 text-[11px] font-bold transition-colors flex items-center gap-1"
                            title="Add extra AI query pack"
                          >
                            <Zap size={11} /> Top Up
                          </button>

                          <button
                            onClick={() => handleResetUsage(t)}
                            className="px-2 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 text-[11px] font-semibold transition-colors"
                            title="Reset query counter to 0"
                          >
                            Reset
                          </button>

                          <button
                            onClick={() => handleToggleStatus(t)}
                            className={cn(
                              'px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shadow-xs flex items-center gap-1',
                              isSuspended
                                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                : 'bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100'
                            )}
                          >
                            <Power size={11} />
                            {isSuspended ? 'Reactivate' : 'Kill Switch'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* ── Provision New Client Modal ── */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Provision New Client</h3>
                  <p className="text-xs text-slate-500">Generates unique license key & configures query limit</p>
                </div>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700">
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Company / Client Name</label>
                  <input
                    type="text"
                    value={form.company_name}
                    onChange={e => setForm({ ...form, company_name: e.target.value })}
                    placeholder="e.g. Apex Solar Pty Ltd"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#5a165d]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={form.contact_email}
                    onChange={e => setForm({ ...form, contact_email: e.target.value })}
                    placeholder="admin@apexsolar.com"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#5a165d]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Subscription Plan</label>
                  <select
                    value={form.plan}
                    onChange={e => {
                      const p = e.target.value;
                      const lim = p === 'starter' ? 500 : p === 'professional' ? 2500 : 10000;
                      setForm({ ...form, plan: p, custom_limit: lim });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#5a165d]"
                  >
                    <option value="starter">Starter Plan ($79/mo — 500 AI Queries)</option>
                    <option value="professional">Professional Plan ($199/mo — 2,500 AI Queries)</option>
                    <option value="enterprise">Enterprise Plan ($499/mo — 10,000 AI Queries)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Monthly AI Query Limit</label>
                  <input
                    type="number"
                    value={form.custom_limit}
                    onChange={e => setForm({ ...form, custom_limit: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#5a165d]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Assign Odoo Database (Optional)</label>
                  <select
                    value={form.connection_id}
                    onChange={e => setForm({ ...form, connection_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#5a165d]"
                  >
                    <option value="">None (Connect Later / via License Key)</option>
                    {connections.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.company_name || c.label} ({c.url || c.database})
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Client logins will automatically query this database upon authentication.
                  </p>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Internal Notes</label>
                  <input
                    type="text"
                    value={form.notes}
                    onChange={e => setForm({ ...form, notes: e.target.value })}
                    placeholder="e.g. Referred via WhatsApp campaign"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#5a165d]"
                  />
                </div>

                <button
                  onClick={handleCreateTenant}
                  disabled={creating}
                  className="w-full py-3 mt-3 rounded-xl bg-[#5a165d] text-white font-bold text-sm hover:bg-[#48114a] transition-all shadow-xs flex items-center justify-center gap-2"
                >
                  <Key size={14} /> Provision Client & Generate License
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Manage User Seats Modal ($25/seat) ── */}
      <AnimatePresence>
        {selectedTenantForSeats && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-xl bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 space-y-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">User Seats & Logins</h3>
                    <span className="px-2 py-0.5 rounded-full bg-[#5a165d]/10 text-[#5a165d] text-[11px] font-bold">
                      $25 / seat / month
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Client: <strong className="text-slate-800">{selectedTenantForSeats.company_name}</strong>
                  </p>
                </div>
                <button onClick={() => setSelectedTenantForSeats(null)} className="text-slate-400 hover:text-slate-700">
                  ✕
                </button>
              </div>

              {/* Active Seats Summary Banner */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-slate-500 font-semibold uppercase">Allocated Login Seats</div>
                  <div className="text-lg font-bold text-slate-900">
                    {selectedTenantForSeats.user_logins?.length || 1} Active Seats
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-slate-500 font-semibold uppercase">Seat Revenue / Mo</div>
                  <div className="text-lg font-bold text-[#5a165d]">
                    ${(selectedTenantForSeats.user_logins?.length || 1) * 25}.00 USD
                  </div>
                </div>
              </div>

              {/* Existing Users Table */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-700">Authorized Employee Logins</div>
                <div className="max-h-56 overflow-y-auto border border-slate-100 rounded-xl divide-y divide-slate-100">
                  {selectedTenantForSeats.user_logins && selectedTenantForSeats.user_logins.length > 0 ? (
                    selectedTenantForSeats.user_logins.map((user, idx) => (
                      <div key={idx} className="p-3 flex items-center justify-between hover:bg-slate-50 text-xs gap-2">
                        <div className="min-w-0">
                          <div className="font-bold text-slate-800 flex items-center gap-2">
                            <span>{user.name || 'User'}</span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 text-slate-600 font-semibold uppercase">
                              {user.role}
                            </span>
                          </div>
                          <div className="text-slate-500 text-[11px] truncate">{user.email}</div>
                          <div className="text-[11px] font-mono text-[#5a165d] mt-0.5">
                            Pass: <span className="bg-[#5a165d]/5 px-1 py-0.5 rounded font-semibold">{user.password || 'Solar2026!'}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleCopyCredentials(user)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-[#5a165d]/10 hover:text-[#5a165d] text-slate-600 font-semibold text-[11px] transition-colors flex items-center gap-1"
                            title="Copy Login Credentials to share with customer"
                          >
                            <Copy size={11} /> Copy Login
                          </button>
                          <button
                            onClick={() => handleRemoveSeat(user.email)}
                            disabled={seatActionLoading}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Revoke Seat Login"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-slate-400 text-xs">No individual seats assigned yet.</div>
                  )}
                </div>
              </div>

              {/* Add New User Seat Form */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <UserPlus size={14} className="text-[#5a165d]" /> Add New Login Seat (+$25/mo)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={newSeatName}
                    onChange={e => setNewSeatName(e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#5a165d]"
                  />
                  <input
                    type="email"
                    placeholder="Work Email"
                    value={newSeatEmail}
                    onChange={e => setNewSeatEmail(e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#5a165d]"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Password (leave empty to auto-generate)"
                    value={newSeatPassword}
                    onChange={e => setNewSeatPassword(e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#5a165d]"
                  />
                  <select
                    value={newSeatRole}
                    onChange={e => setNewSeatRole(e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#5a165d]"
                  >
                    <option value="manager">Role: Manager</option>
                    <option value="accountant">Role: Accountant</option>
                    <option value="sales">Role: Sales Executive</option>
                    <option value="director">Role: Director / CEO</option>
                    <option value="admin">Role: Administrator</option>
                  </select>
                </div>
                <button
                  onClick={handleAddSeat}
                  disabled={seatActionLoading}
                  className="w-full py-2.5 rounded-xl bg-[#5a165d] text-white font-bold text-xs hover:bg-[#48114a] transition-all flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Plus size={13} /> Add Authorized Seat (Bill +$25/mo)
                </button>
              </div>
            </motion.div>
          </div>

        )}
      </AnimatePresence>

      {/* ── Top Up AI Pack Modal ── */}
      <AnimatePresence>
        {selectedTenantForTopup && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Top-Up AI Queries</h3>
                  <p className="text-xs text-slate-500">
                    Add query credits to <strong>{selectedTenantForTopup.company_name}</strong>
                  </p>
                </div>
                <button onClick={() => setSelectedTenantForTopup(null)} className="text-slate-400 hover:text-slate-700">
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { amount: 500, price: '$49' },
                    { amount: 1000, price: '$89' },
                    { amount: 2500, price: '$149' },
                  ].map(pack => (
                    <button
                      key={pack.amount}
                      onClick={() => setTopupAmount(pack.amount)}
                      className={cn(
                        'p-3 rounded-2xl border text-center transition-all',
                        topupAmount === pack.amount
                          ? 'border-[#5a165d] bg-[#5a165d]/5 ring-2 ring-[#5a165d]/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      )}
                    >
                      <div className="font-bold text-slate-900 text-sm">+{pack.amount}</div>
                      <div className="text-[11px] text-[#5a165d] font-semibold">{pack.price}</div>
                    </button>
                  ))}
                </div>

                <div className="p-3 bg-slate-50 rounded-xl text-slate-600 text-xs">
                  Current Limit: <strong>{selectedTenantForTopup.monthly_limit.toLocaleString()}</strong>
                  <br />
                  New Limit will be: <strong className="text-[#5a165d]">{(selectedTenantForTopup.monthly_limit + topupAmount).toLocaleString()} queries</strong>
                </div>

                <button
                  onClick={handleTopup}
                  disabled={topupLoading}
                  className="w-full py-3 rounded-xl bg-[#5a165d] text-white font-bold text-xs hover:bg-[#48114a] transition-all flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Zap size={14} /> Add {topupAmount} Queries Now
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Assign / Connect Odoo Database Modal ── */}
      <AnimatePresence>
        {selectedTenantForDB && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-[#5a165d]/10 text-[#5a165d]">
                    <Database size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Odoo Database Connection
                    </h3>
                    <p className="text-xs text-slate-500">
                      Client: <strong>{selectedTenantForDB.company_name}</strong>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTenantForDB(null)}
                  className="text-slate-400 hover:text-slate-700 p-1"
                >
                  ✕
                </button>
              </div>

              {/* Status / Current link */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Current Status:</span>
                  {selectedTenantForDB.connection_id ? (
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                      <CheckCircle2 size={13} className="text-emerald-600" />
                      Linked to {connections.find(c => c.id === selectedTenantForDB.connection_id)?.company_name || 'Odoo Database'}
                    </span>
                  ) : (
                    <span className="font-semibold text-amber-700">No database linked</span>
                  )}
                </div>
              </div>

              {/* Tabs: Select Existing vs Connect New */}
              <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
                <button
                  onClick={() => setDbModalTab('select')}
                  className={cn(
                    'flex-1 py-1.5 rounded-lg transition-all',
                    dbModalTab === 'select' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-900'
                  )}
                >
                  Select Existing Database ({connections.length})
                </button>
                <button
                  onClick={() => setDbModalTab('new')}
                  className={cn(
                    'flex-1 py-1.5 rounded-lg transition-all',
                    dbModalTab === 'new' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-900'
                  )}
                >
                  Connect New Odoo
                </button>
              </div>

              {dbModalTab === 'select' ? (
                <div className="space-y-3 text-xs">
                  {connections.length > 0 ? (
                    <div className="space-y-2 max-h-56 overflow-y-auto">
                      {connections.map(conn => {
                        const isSelected = selectedConnId === conn.id;
                        const isCurrent = selectedTenantForDB.connection_id === conn.id;
                        return (
                          <div
                            key={conn.id}
                            onClick={() => setSelectedConnId(conn.id)}
                            className={cn(
                              'p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between',
                              isSelected
                                ? 'border-[#5a165d] bg-[#5a165d]/5 ring-1 ring-[#5a165d]'
                                : 'border-slate-200 hover:border-slate-300 bg-white'
                            )}
                          >
                            <div className="space-y-0.5">
                              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                <Database size={13} className="text-[#5a165d]" />
                                {conn.company_name || conn.label}
                                {isCurrent && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                                    Current
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500">{conn.url}</div>
                              <div className="text-[10px] text-slate-400 font-mono">DB: {conn.database} · User: {conn.username}</div>
                            </div>
                            <div className={cn(
                              'w-4 h-4 rounded-full border flex items-center justify-center shrink-0',
                              isSelected ? 'border-[#5a165d] bg-[#5a165d]' : 'border-slate-300'
                            )}>
                              {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-slate-400">
                      No saved Odoo connections found. Switch to "Connect New Odoo" tab to add one.
                    </div>
                  )}

                  <button
                    onClick={handleAssignExistingDb}
                    disabled={dbLoading || !selectedConnId}
                    className="w-full py-2.5 rounded-xl bg-[#5a165d] text-white font-bold text-xs hover:bg-[#48114a] transition-all flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
                  >
                    <Link2 size={14} /> Assign Selected Database to Client
                  </button>
                </div>
              ) : (
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Odoo Instance URL</label>
                    <input
                      type="text"
                      placeholder="https://mycompany.odoo.com"
                      value={newDbForm.url}
                      onChange={e => setNewDbForm({ ...newDbForm, url: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#5a165d]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Database Name</label>
                      <input
                        type="text"
                        placeholder="e.g. mycompany-production"
                        value={newDbForm.database}
                        onChange={e => setNewDbForm({ ...newDbForm, database: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#5a165d]"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Company / Label</label>
                      <input
                        type="text"
                        placeholder="e.g. Brothers Trading"
                        value={newDbForm.label}
                        onChange={e => setNewDbForm({ ...newDbForm, label: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#5a165d]"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Odoo Login / Email</label>
                      <input
                        type="text"
                        placeholder="admin@mycompany.com"
                        value={newDbForm.username}
                        onChange={e => setNewDbForm({ ...newDbForm, username: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#5a165d]"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Password / API Key</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={newDbForm.password}
                        onChange={e => setNewDbForm({ ...newDbForm, password: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#5a165d]"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleConnectNewDb}
                    disabled={dbLoading}
                    className="w-full py-2.5 mt-2 rounded-xl bg-[#5a165d] text-white font-bold text-xs hover:bg-[#48114a] transition-all flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
                  >
                    <Server size={14} /> Test & Connect Odoo Database
                  </button>
                </div>
              )}

              {/* Odoo Module & License Key info */}
              <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                <div className="font-semibold text-slate-700">Client Self-Connection via License Key:</div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-100 font-mono text-[11px] text-slate-800">
                  <span>{selectedTenantForDB.license_key}</span>
                  <button
                    onClick={() => handleCopy(selectedTenantForDB.license_key)}
                    className="p-1 hover:text-[#5a165d]"
                    title="Copy License Key"
                  >
                    <Copy size={12} />
                  </button>
                </div>
                <div className="text-[10px] text-slate-400">
                  Client can also install the mAifelZ Odoo Module in their instance and enter this key.
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

