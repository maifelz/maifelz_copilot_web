'use client';

import { TrendingUp, TrendingDown, Minus, DollarSign, AlertCircle, Package, Users, Hash, BarChart2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import type { KPICard as KPICardType } from '@/lib/api';

const ICONS: Record<string, any> = {
  'dollar-sign': DollarSign,
  'alert-circle': AlertCircle,
  'trending-up': TrendingUp,
  'package': Package,
  'users': Users,
  'hash': Hash,
  'bar-chart-2': BarChart2,
};

interface Props {
  kpi: KPICardType;
  index?: number;
  delay?: number;
}

export default function KPICard({ kpi, index = 0, delay = 0 }: Props) {
  const Icon = ICONS[kpi.icon || 'bar-chart-2'] || BarChart2;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md hover:border-slate-300 transition-all cursor-default"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            {kpi.title}
          </p>
          <p className="text-2xl font-bold text-slate-900 tracking-tight">
            {kpi.value}
          </p>
          {kpi.description && (
            <p className="text-xs text-slate-400 mt-1 font-normal">
              {kpi.description}
            </p>
          )}
        </div>

        <div className="p-2.5 rounded-xl bg-[#5a165d]/5 border border-[#5a165d]/10 text-[#5a165d]">
          <Icon size={18} />
        </div>
      </div>

      {kpi.change && (
        <div className={cn(
          'flex items-center gap-1 mt-3 text-xs font-semibold',
          kpi.change_type === 'up' ? 'text-emerald-600' : kpi.change_type === 'down' ? 'text-rose-600' : 'text-slate-500'
        )}>
          {kpi.change_type === 'up' ? <TrendingUp size={12} /> : kpi.change_type === 'down' ? <TrendingDown size={12} /> : <Minus size={12} />}
          <span>{kpi.change}</span>
        </div>
      )}
    </motion.div>
  );
}
