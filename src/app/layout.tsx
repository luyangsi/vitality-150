import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';

export const metadata: Metadata = {
  title: 'Vitality 150 — Train for a 150-Year Life',
  description: 'Science-backed exercise planning and longevity tracking.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 min-h-screen">
        <Sidebar />
        <div className="ml-64 min-h-screen flex flex-col">
          <TopBar />
          <main className="flex-1 p-6 animate-fade-in">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
