import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { DesktopHeader } from "@/components/DesktopHeader";
import { PublishButton } from "@/components/PublishButton";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/login" });
  },
  component: AppLayout,
});

function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <DesktopHeader />
      <main className="mx-auto max-w-[1400px] px-8 py-6">
        <Outlet />
      </main>
      <PublishButton />
    </div>
  );
}