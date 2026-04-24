'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ClienteHomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/cliente/dashboard');
  }, [router]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">
      Redirigiendo al hub…
    </div>
  );
}
