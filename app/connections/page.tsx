'use client';

import { useState, useEffect } from 'react';
import { Plus, Database, Trash2, CheckCircle, XCircle, Loader2, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store';
import { getConnections, deleteConnection, testConnection } from '@/lib/api';
import Header from '@/components/layout/Header';
import ConnectOdooModal from '@/components/modals/ConnectOdooModal';
import toast from 'react-hot-toast';

export default function ConnectionsPage() {
  const { connections, setConnections, removeConnection, activeConnectionId, setActiveConnection } = useAppStore();
  const [showModal, setShowModal] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});

  useEffect(() => {
    getConnections().then(setConnections).catch(() => {});
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this connection?')) return;
    try {
      await deleteConnection(id);
      removeConnection(id);
      toast.success('Connection removed');
    } catch {
      toast.error('Failed to remove connection');
    }
  };

  const handleTest = async (id: string) => {
    setTesting(id);
    try {
      const res = await testConnection(id);
      setTestResults(prev => ({ ...prev, [id]: res.is_active }));
      toast.success(res.is_active ? 'Connection is active ✓' : 'Connection is inactive');
    } catch {
      setTestResults(prev => ({ ...prev, [id]: false }));
      toast.error('Connection test failed');
    } finally {
      setTesting(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header title="Odoo Connections" subtitle="Manage your connected Odoo ERP instances" />
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">Configured Databases</h2>
            <p className="text-xs text-slate-500 mt-0.5">{connections.length} Odoo instance{connections.length !== 1 ? 's' : ''} connected</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#5a165d] text-white font-semibold text-xs hover:bg-[#48114a] transition-all shadow-xs"
          >
            <Plus size={15} /> Add Odoo Connection
          </button>
        </div>

        {connections.length === 0 ? (
          <div className="text-center py-20 bg-white border border-slate-200 rounded-2xl shadow-xs">
            <Database size={40} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-700 font-semibold text-sm">No Odoo databases connected yet</p>
            <p className="text-slate-400 text-xs mt-1 mb-5">Connect your Odoo ERP to start asking AI questions</p>
            <button onClick={() => setShowModal(true)} className="text-[#5a165d] text-xs font-semibold hover:underline">
              Connect your first database →
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {connections.map((conn, i) => (
              <motion.div
                key={conn.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={cn(
                  'p-5 rounded-2xl border transition-all bg-white shadow-xs',
                  activeConnectionId === conn.id
                    ? 'border-[#5a165d]/50 ring-2 ring-[#5a165d]/10'
                    : 'border-slate-200 hover:border-slate-300'
                )}
              >
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      'p-3 rounded-xl',
                      activeConnectionId === conn.id ? 'bg-[#5a165d]/10 text-[#5a165d]' : 'bg-slate-100 text-slate-500'
                    )}>
                      <Database size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-slate-900">{conn.company_name || conn.label}</span>
                        {activeConnectionId === conn.id && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                            Active
                          </span>
                        )}
                        {testResults[conn.id] !== undefined && (
                          testResults[conn.id]
                            ? <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold"><CheckCircle size={11} /> Online</span>
                            : <span className="flex items-center gap-1 text-[11px] text-rose-600 font-semibold"><XCircle size={11} /> Offline</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">{conn.url} · {conn.database}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">Odoo v{conn.odoo_version} · UID: {conn.uid} · User: {conn.username}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTest(conn.id)}
                      disabled={testing === conn.id}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors flex items-center gap-1.5"
                    >
                      {testing === conn.id ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
                      Test
                    </button>

                    {activeConnectionId !== conn.id && (
                      <button
                        onClick={() => setActiveConnection(conn.id)}
                        className="px-3 py-1.5 rounded-lg bg-[#5a165d]/10 border border-[#5a165d]/20 text-xs font-bold text-[#5a165d] hover:bg-[#5a165d]/20 transition-colors"
                      >
                        Set Active
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(conn.id)}
                      className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <ConnectOdooModal
          onClose={() => setShowModal(false)}
          onSuccess={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
