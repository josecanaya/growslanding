import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";

const supabaseStatus = {
  urlSet: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL),
  anonKeySet: Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY
  )
};

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-16">
      <div className="flex max-w-2xl flex-col items-center gap-6 text-center">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Bienvenido a grows
          </h1>
          <p className="text-base text-muted-foreground sm:text-lg">
            Next.js 15 + pnpm + Turborepo + Tailwind CSS + shadcn/ui + Supabase.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button size="lg">Acción principal</Button>
          <Button variant="outline" size="lg">
            Variante secundaria
          </Button>
        </div>
        <Card className="w-full max-w-md text-left">
          <CardHeader>
            <CardTitle>Estado de Supabase</CardTitle>
            <CardDescription>
              Lee las variables de entorno disponibles para la app.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              URL configurada: {supabaseStatus.urlSet ? "sí" : "no"}
            </p>
            <p className="text-sm text-muted-foreground">
              Clave anónima configurada: {supabaseStatus.anonKeySet ? "sí" : "no"}
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
