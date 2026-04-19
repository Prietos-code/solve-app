import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { BottomTabs } from "@/components/BottomTabs";
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
    <div className="min-h-screen bg-background pb-24">
      <div className="mx-auto max-w-xl">
        <Outlet />
      </div>
      <BottomTabs />
    </div>
  );
}
