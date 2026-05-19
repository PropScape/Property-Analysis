import { Building2 } from "lucide-react";

/**
 * Landing page placeholder. Will be replaced by the project overview
 * (analysis list) once SPEC-PROJECT-LIST is implemented.
 */
export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-navy-600 text-white shadow-glow">
        <Building2 className="h-8 w-8" />
      </div>
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Immoverse
        </h1>
        <p className="mt-2 text-muted-foreground">
          Professionelle Immobilien-Investmentanalyse
        </p>
      </div>
    </main>
  );
}
