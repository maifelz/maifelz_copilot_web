'use client';

import { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, FileSpreadsheet } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TableColumn } from '@/lib/api';

interface Props {
  title?: string;
  columns?: TableColumn[];
  records?: Record<string, any>[];
}

export default function ReportDataTable({ title = 'Detailed Records', columns = [], records = [] }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const filteredRecords = useMemo(() => {
    if (!searchTerm.trim()) return records;
    const q = searchTerm.toLowerCase();
    return records.filter(row =>
      Object.values(row).some(v => String(v).toLowerCase().includes(q))
    );
  }, [records, searchTerm]);

  const totalPages = Math.ceil(filteredRecords.length / pageSize) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  if (!columns.length || !records.length) return null;

  const renderBadge = (val: string) => {
    const v = String(val).toLowerCase();
    let color = 'bg-slate-100 text-slate-700 border-slate-200';
    if (v.includes('paid') && !v.includes('not')) {
      color = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    } else if (v.includes('not paid') || v.includes('unpaid') || v.includes('overdue')) {
      color = 'bg-amber-50 text-amber-700 border-amber-200';
    } else if (v.includes('won') || v.includes('sale') || v.includes('done') || v.includes('posted')) {
      color = 'bg-[#5a165d]/10 text-[#5a165d] border-[#5a165d]/20 font-semibold';
    } else if (v.includes('cancel') || v.includes('lost')) {
      color = 'bg-rose-50 text-rose-700 border-rose-200';
    } else if (v.includes('qualified')) {
      color = 'bg-blue-50 text-blue-700 border-blue-200';
    }

    return (
      <span className={cn('px-2.5 py-0.5 rounded-full text-[11px] font-medium border inline-block', color)}>
        {val}
      </span>
    );
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
      {/* Table Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet size={16} className="text-[#5a165d]" />
            {title}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Showing {filteredRecords.length} record{filteredRecords.length !== 1 ? 's' : ''} from Odoo ERP
          </p>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search records..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#5a165d] focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Table Scroll Area */}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {columns.map(col => (
                <th key={col.key} className="py-3 px-4 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedRecords.map((row, rowIdx) => (
              <tr key={rowIdx} className="hover:bg-slate-50/70 transition-colors">
                {columns.map(col => {
                  const val = row[col.key];
                  return (
                    <td key={col.key} className="py-3 px-4 text-slate-700 font-normal">
                      {col.type === 'currency' ? (
                        <span className="font-semibold text-slate-900">
                          ${Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      ) : col.type === 'badge' ? (
                        renderBadge(String(val ?? ''))
                      ) : (
                        <span className="text-slate-900">{String(val ?? '-')}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-slate-500">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed shadow-xs"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed shadow-xs"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
