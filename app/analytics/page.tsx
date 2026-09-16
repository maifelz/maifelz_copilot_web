'use client';
import Header from '@/components/layout/Header';
import { BarChart3 } from 'lucide-react';
export default function AnalyticsPage() {
  return (
    <div className="min-h-screen">
      <Header title="Analytics" subtitle="Advanced analytics module" />
      <div className="p-6 text-center py-24 border border-white/5 rounded-2xl m-6">
        <BarChart3 size={40} className="text-white/20 mx-auto mb-4" />
        <p className="text-white/40 font-medium">Advanced Analytics — Coming in v1.1</p>
        <p className="text-white/20 text-sm mt-1">Scheduled reports, trend forecasting, and multi-DB comparisons</p>
      </div>
    </div>
  );
}
