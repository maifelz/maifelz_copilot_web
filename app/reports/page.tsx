'use client';

import { useAppStore } from '@/lib/store';
import { FileText, Sparkles, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import Header from '@/components/layout/Header';
import KPICard from '@/components/dashboard/KPICard';
import ReportChart from '@/components/charts/ReportChart';

export default function ReportsPage() {
  const { reports } = useAppStore();

  return (
    <div className="min-h-screen">
      <Header title="Report History" subtitle={`${reports.length} AI-generated report${reports.length !== 1 ? 's' : ''}`} />
      <div className="p-6 max-w-6xl mx-auto">
        {reports.length === 0 ? (
          <div className="text-center py-24 border border-white/5 rounded-2xl">
            <FileText size={40} className="text-white/20 mx-auto mb-4" />
            <p className="text-white/40 font-medium">No reports generated yet</p>
            <p className="text-white/20 text-sm mt-1">Go to Dashboard and ask a question about your Odoo data</p>
          </div>
        ) : (
          <div className="space-y-8">
            {reports.map((report, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="p-6 rounded-2xl border border-white/8 bg-white/[0.02] space-y-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles size={14} className="text-violet-400" />
                      <span className="text-xs text-violet-400 font-medium">AI Report #{reports.length - i}</span>
                    </div>
                    <h3 className="text-lg font-bold text-white">{report.report_title}</h3>
                    <p className="text-xs text-white/40 mt-1 max-w-2xl leading-relaxed">
                      {report.executive_summary?.slice(0, 150)}{report.executive_summary?.length > 150 ? '...' : ''}
                    </p>
                  </div>
                </div>

                {report.kpi_cards.length > 0 && (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {report.kpi_cards.slice(0, 4).map((kpi, ki) => (
                      <KPICard key={ki} kpi={kpi} index={ki} />
                    ))}
                  </div>
                )}

                {report.sections?.[0]?.data?.length > 0 && (
                  <div className="pt-2">
                    <ReportChart section={report.sections[0]} height={280} />
                  </div>
                )}

                {(report.insights.length > 0 || report.recommendations.length > 0) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                    {report.insights.length > 0 && (
                      <div className="p-4 rounded-xl border border-cyan-500/15 bg-cyan-500/[0.03]">
                        <h5 className="text-xs font-semibold text-cyan-400 mb-2 flex items-center gap-1">
                          <TrendingUp size={11} /> Insights
                        </h5>
                        <ul className="space-y-1">
                          {report.insights.slice(0, 3).map((ins, ii) => (
                            <li key={ii} className="text-[11px] text-white/40">{ins}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {report.recommendations.length > 0 && (
                      <div className="p-4 rounded-xl border border-violet-500/15 bg-violet-500/[0.03]">
                        <h5 className="text-xs font-semibold text-violet-400 mb-2">💡 Recommendations</h5>
                        <ul className="space-y-1">
                          {report.recommendations.slice(0, 3).map((rec, ri) => (
                            <li key={ri} className="text-[11px] text-white/40">{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
