'use client';
import Sidebar from '@/components/layout/Sidebar';
export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0a14]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto scrollbar-thin bg-[#0a0a14]">{children}</main>
    </div>
  );
}
