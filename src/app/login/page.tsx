import React, { Suspense } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background ambient decorative glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-72 h-72 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute top-10 right-10 w-72 h-72 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        <Suspense
          fallback={
            <div className="flex justify-center items-center p-12 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
