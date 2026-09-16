'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Lock, Mail, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { loginUser, setStoredAuth } from '@/lib/api';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error('Please enter your email and password');
      return;
    }

    setLoading(true);
    try {
      const res = await loginUser(email.trim(), password.trim());
      if (res.success) {
        setStoredAuth({ user: res.user, tenant: res.tenant });
        toast.success(`Welcome back, ${res.user.name}!`);
        if (res.user.role === 'master_admin') {
          router.push('/admin');
        } else {
          router.push('/dashboard');
        }
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Invalid email or password';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail('nithin@billanongsolar.com.au');
    setPassword('Solar2026!');
  };

  const handleFillAdmin = () => {
    setEmail('admin@maifelz.com');
    setPassword('MaifelzAdmin2026!');
  };


  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-white rounded-2xl shadow-xs border border-slate-200/80 mb-4">
            <Image
              src="/maifelz_logo.png"
              alt="mAifelZ Technologies"
              width={160}
              height={44}
              className="h-10 w-auto object-contain"
              priority
            />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">AI Copilot for Odoo</h1>
          <p className="text-xs text-[#777f8b] mt-1 font-medium">
            Sign in to access your conversational business intelligence &amp; financial analytics
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/50 p-7 sm:p-8 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Corporate Work Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#5a165d] focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#5a165d] focus:bg-white transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 mt-2 rounded-xl bg-[#5a165d] hover:bg-[#48114a] text-white font-bold text-sm transition-all shadow-md shadow-[#5a165d]/20 flex items-center justify-center gap-2 group disabled:opacity-70"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to AI Copilot'}</span>
              <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </form>

          {/* Quick Access Buttons */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={handleFillDemo}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hover:text-[#5a165d] hover:border-[#5a165d]/30 text-[11px] font-semibold transition-all"
            >
              <Sparkles size={13} className="text-[#5a165d]" />
              <span>Billabong Solar Seat</span>
            </button>
            <button
              type="button"
              onClick={handleFillAdmin}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#5a165d]/5 border border-[#5a165d]/25 text-[#5a165d] hover:bg-[#5a165d]/10 text-[11px] font-bold transition-all"
            >
              <ShieldCheck size={13} className="text-[#5a165d]" />
              <span>mAifelZ Master Admin</span>
            </button>
          </div>


          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 text-center">
            <ShieldCheck size={13} className="text-emerald-600" />
            <span>Secured &amp; Metered by mAifelZ Technologies Cloud</span>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center mt-6 text-xs text-slate-500">
          Need login seats for your team?{' '}
          <a href="mailto:sales@maifelz.com" className="text-[#5a165d] font-bold hover:underline">
            Contact mAifelZ Support
          </a>
        </div>
      </motion.div>
    </div>
  );
}
