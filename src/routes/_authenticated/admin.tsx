import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  Building2,
  CalendarCheck,
  Images,
  Inbox,
  LayoutDashboard,
  LogOut,
  MessageSquareQuote,
  Settings,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/ui/spinner";
import { supabase } from "@/integrations/supabase/client";
import { ensureAdminRole, getAdminStatus } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/listings", label: "Listings", icon: Building2, exact: false },
  { to: "/admin/enquiries", label: "Enquiries", icon: Inbox, exact: false },
  { to: "/admin/inspections", label: "Inspections", icon: CalendarCheck, exact: false },
  { to: "/admin/testimonials", label: "Testimonials", icon: MessageSquareQuote, exact: false },
  { to: "/admin/media", label: "Media", icon: Images, exact: false },
  { to: "/admin/settings", label: "Site content", icon: Settings, exact: false },
] as const;

function AdminLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const statusFn = useServerFn(getAdminStatus);
  const claimFn = useServerFn(ensureAdminRole);
  const [activating, setActivating] = useState(false);
  const attempted = useRef(false);

  const { data: status, isLoading } = useQuery({
    queryKey: ["admin-status"],
    queryFn: () => statusFn({}),
  });

  useEffect(() => {
    if (isLoading || !status || status.isAdmin || attempted.current) return;
    attempted.current = true;
    setActivating(true);
    claimFn({})
      .then(async (result) => {
        if (result.ok) {
          await queryClient.invalidateQueries({ queryKey: ["admin-status"] });
        }
      })
      .catch(() => undefined)
      .finally(() => setActivating(false));
  }, [isLoading, status, claimFn, queryClient]);

  async function signOut() {
    await supabase.auth.signOut();
    queryClient.clear();
    await navigate({ to: "/auth" });
  }

  async function claim() {
    setActivating(true);
    try {
      const result = await claimFn({});
      if (result.ok) {
        toast.success("Admin access activated.");
        await queryClient.invalidateQueries({ queryKey: ["admin-status"] });
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Could not grant admin access.");
    } finally {
      setActivating(false);
    }
  }

  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none fixed inset-0 -z-10 mesh-bg" />
      <header className="border-b border-border/70 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link to="/" className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl bg-primary/15 ring-1 ring-primary/40">
              <span className="font-display text-xs font-bold text-accent">EA</span>
            </span>
            <span className="font-display text-sm font-semibold">Admin console</span>
          </Link>
          <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground">
            <LogOut className="mr-2 size-4" /> Sign out
          </Button>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-8 sm:px-8 lg:flex-row">
        <nav className="flex gap-2 overflow-x-auto lg:w-56 lg:shrink-0 lg:flex-col lg:overflow-visible">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.exact }}
              activeProps={{ className: "bg-secondary text-primary" }}
              className="flex shrink-0 items-center gap-3 rounded-xl px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <main className="min-w-0 flex-1">
          {isLoading || activating ? (
            <PageLoader label="Checking your access…" />
          ) : status?.isAdmin ? (
            <Outlet />
          ) : (
            <div className="rounded-2xl glass-panel p-8">
              <h1 className="font-display text-2xl font-semibold">Admin access required</h1>
              <p className="mt-3 text-sm text-muted-foreground">
                This account is signed in but is not on the approved administrator list. Ask the
                super administrator to add your email, then try again.
              </p>
              <Button onClick={claim} className="mt-6 rounded-full px-6">
                Try again
              </Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
