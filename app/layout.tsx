import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'mAifelZ AI Odoo Copilot — Executive ERP Intelligence',
  description: 'AI-powered Copilot for Odoo ERP by mAifelZ Technologies. Natural language reporting, predictive insights, and automated analysis.',
  icons: {
    icon: '/maifelz_logo.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="light">
      <body className="bg-slate-50 text-slate-900 antialiased min-h-screen">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#ffffff',
              color: '#0f172a',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              fontSize: '13px',
              boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
            },
            success: { iconTheme: { primary: '#5a165d', secondary: '#ffffff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#ffffff' } },
          }}
        />
      </body>
    </html>
  );
}
