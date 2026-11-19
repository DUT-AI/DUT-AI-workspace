import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DUT-AI Unified Portal',
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
      <body className="h-full bg-slate-900 text-slate-100 antialiased overflow-hidden select-none">
        {children}
      </body>
    </html>
  );
}
