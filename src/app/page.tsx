import { AppHeader } from "@/components/app-header";
import { ProjectOverviewContent } from "@/components/project-overview-content";

/**
 * Project overview page — Server Component shell.
 *
 * @remarks
 * Renders AppHeader (async Server Component) + ProjectOverviewContent
 * (Client Component). This separation is required because AppHeader
 * uses next/headers via the Supabase server client.
 *
 * Route is protected by middleware (see src/middleware.ts).
 * Implements SPEC-PROJECT-LIST v1.0.0.
 */
export default function ProjectOverviewPage() {
  return (
    <>
      <AppHeader />
      <ProjectOverviewContent />
    </>
  );
}
