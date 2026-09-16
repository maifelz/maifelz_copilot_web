'use client';

import { useState } from 'react';
import { X, Database, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { connectOdoo } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import toast from 'react-hot-toast';
import type { OdooConnection } from '@/lib/api';

interface Props {
  onClose: () => void;
  onSuccess?: (conn: OdooConnection) => void;
}

export default function ConnectOdooModal({ onClose, onSuccess }: Props) {
  const [form, setForm] = useState({
    url: '',
    database: '',
    username: '',
    password: '',
    label: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const { addConnection, setActiveConnection } = useAppStore();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setResult(null);
  };

  const handleConnect = async () => {
    if (!form.url || !form.database || !form.username || !form.password) {
      toast.error('Please fill in all required fields');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await connectOdoo({
        url: form.url.trim(),
        database: form.database.trim(),
        username: form.username.trim(),
        password: form.password.trim(),
        label: form.label.trim(),
      });
      if (res.success) {
        const conn: OdooConnection = {
          id: res.connection_id,
          label: res.label,
          url: form.url,
          database: form.database,
          username: form.username,
          odoo_version: res.odoo_version || 'Unknown',
          company_name: res.company_name || '',
          uid: res.uid,
          created_at: new Date().toISOString(),
          last_used: new Date().toISOString(),
        };
        addConnection(conn);
        setActiveConnection(conn.id);
        setResult({ success: true, message: `Connected to ${res.company_name} · Odoo ${res.odoo_version}` });
        toast.success('Odoo database connected successfully!');
        setTimeout(() => {
          onSuccess?.(conn);
          onClose();
        }, 1200);
      } else {
        setResult({ success: false, message: res.error || 'Connection failed' });
        toast.error(res.error || 'Connection failed');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err.message || 'Failed to connect';
      setResult({ success: false, message: msg });
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const FIELDS = [
    { name: 'url', label: 'Odoo Server URL', placeholder: 'https://erp.yourcompany.com or .dev.odoo.com', type: 'url' },
    { name: 'database', label: 'Database Name', placeholder: 'your_db_name', type: 'text' },
    { name: 'username', label: 'Login Email / Username', placeholder: 'admin@company.com', type: 'email' },
    { name: 'label', label: 'Connection Label (Optional)', placeholder: 'My Company ERP', type: 'text' },
  ] as const;

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
                  <Database size={20} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Connect Odoo Database</h2>
                  <p className="text-xs text-slate-500">Universal XML-RPC · Odoo v12 through v19+</p>
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700">
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Form */}
          <div className="p-6 space-y-3.5">
            {FIELDS.map(({ name, label, placeholder, type }) => (
              <div key={name}>
                <label className="text-xs font-semibold text-slate-700 block mb-1">{label}</label>
                <input
                  name={name}
                  type={type}
                  value={form[name]}
                  onChange={handleChange}
                  placeholder={placeholder}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#5a165d] focus:bg-white transition-all"
                />
              </div>
            ))}

            {/* Password */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Password / API Key</label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••••••"
                  className="w-full px-4 py-2.5 pr-11 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#5a165d] focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Result Feedback */}
            {result && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  'flex items-center gap-2 p-3 rounded-xl text-xs font-medium',
                  result.success
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                    : 'bg-rose-50 border border-rose-200 text-rose-700'
                )}
              >
                {result.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                {result.message}
              </motion.div>
            )}

            {/* Connect Button */}
            <button
              onClick={handleConnect}
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-sm transition-all duration-200 bg-[#5a165d] text-white hover:bg-[#48114a] shadow-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader2 size={16} className="animate-spin" /> Verifying Connection...</>
              ) : (
                <><Zap size={16} /> Connect Database</>
              )}
            </button>

            <p className="text-center text-[10px] text-slate-400">
              No Odoo module installation required. Credentials are saved locally on your server.
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
