import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/auth/AuthProvider';

export const metadata: Metadata = {
  title: 'DUT-AI Workspace & Admin Portal',
  description: 'Cổng thông tin & quản trị tích hợp các ứng dụng DUT-AI',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="h-full">
      <body className="h-full bg-slate-950 text-slate-100 antialiased font-sans">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
