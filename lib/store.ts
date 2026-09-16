import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { OdooConnection, AIReport } from './api';

interface AppState {
  connections: OdooConnection[];
  activeConnectionId: string | null;
  reports: AIReport[];
  isGenerating: boolean;
  currentReport: AIReport | null;
  sidebarOpen: boolean;

  setConnections: (connections: OdooConnection[]) => void;
  addConnection: (connection: OdooConnection) => void;
  removeConnection: (id: string) => void;
  setActiveConnection: (id: string | null) => void;
  setGenerating: (v: boolean) => void;
  setCurrentReport: (report: AIReport | null) => void;
  addReport: (report: AIReport) => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      connections: [],
      activeConnectionId: null,
      reports: [],
      isGenerating: false,
      currentReport: null,
      sidebarOpen: true,

      setConnections: (connections) => set({ connections }),
      addConnection: (connection) =>
        set((state) => ({ connections: [...state.connections, connection] })),
      removeConnection: (id) =>
        set((state) => ({
          connections: state.connections.filter((c) => c.id !== id),
          activeConnectionId: state.activeConnectionId === id ? null : state.activeConnectionId,
        })),
      setActiveConnection: (id) => set({ activeConnectionId: id }),
      setGenerating: (v) => set({ isGenerating: v }),
      setCurrentReport: (report) => set({ currentReport: report }),
      addReport: (report) =>
        set((state) => ({ reports: [report, ...state.reports.slice(0, 19)] })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
    }),
    {
      name: 'maifelz-store',
      partialize: (state) => ({
        activeConnectionId: state.activeConnectionId,
      }),
    }
  )
);
