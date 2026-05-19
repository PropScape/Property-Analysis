import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { AppHeader } from "@/components/app-header";
import { cn } from "@/lib/utils";
import Link from "next/link";

/**
 * Placeholder page for creating a new analysis.
 *
 * @remarks
 * This will be replaced by the wizard start screen (Step 1)
 * once SPEC-WIZARD-START is implemented.
 */
export default function NewAnalysisPage() {
  return (
    <>
      <AppHeader />
      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 pt-24 pb-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Neue Analyse
          </h1>
          <p className="mt-2 text-muted-foreground">
            Der Wizard wird mit SPEC-WIZARD-START implementiert.
          </p>
        </div>
        <Link
          href="/"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück zur Übersicht
        </Link>
      </main>
    </>
  );
}
