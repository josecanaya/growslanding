import { redirect } from 'next/navigation';

/** Entrada canónica del área socio: el panel (home redirigido). */
export default function SocioRootPage() {
  redirect('/socio/panel');
}
