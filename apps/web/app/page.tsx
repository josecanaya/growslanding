import { redirect } from "next/navigation";

export default function HomePage() {
  // Redirigir directamente al panel de socio
  redirect("/socio/panel");
}
