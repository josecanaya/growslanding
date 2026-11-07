import { Suspense } from 'react';
import AccessClient from './access-client';

export default function AccessPage() {
  return <Suspense fallback={<p className="p-8">Cargando tu acceso…</p>}><AccessClient /></Suspense>;
}
