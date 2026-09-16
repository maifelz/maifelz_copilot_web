'use client';
import Sidebar from '@/components/layout/Sidebar';
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900">
      <Sidebar />
      <main className="flex-1 overflow-y-auto scrollbar-thin bg-slate-50">{children}</main>
    </div>
  );
}
