import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/supabase/AuthContext';
import { ClientLayout } from '@/components/layout/ClientLayout';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Vitality 150 — Train for a 150-Year Life',
  description: 'Science-backed exercise planning and longevity tracking.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 min-h-screen">
        <AuthProvider>
          <ClientLayout>
            {children}
          </ClientLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
