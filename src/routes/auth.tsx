import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { SiteShell } from "@/components/site/site-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { siteSettingsQuery } from "@/lib/queries";
import { staffLogin } from '@/lib/visitor.functions';
import { BotCaptcha } from '@/components/site/bot-captcha';
import { Spinner } from '@/components/ui/spinner';

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Staff Sign In | JustMainlandNG" },
      {
        name: "description",
        content: "Private sign-in for JustMainlandNG staff to manage listings and enquiries.",
      },
      { property: "og:title", content: "Staff Sign In | JustMainlandNG" },
      { property: "og:description", content: "Admin access for the JustMainlandNG team." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(siteSettingsQuery),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [pending, setPending] = useState(false);
  const [attempt, setAttempt] = useState(0);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const email = String(fd.get("email") ?? "").trim();
    const password = String(fd.get("password") ?? "");
    setPending(true);
    try {
      const result = await staffLogin({ data: { email, password, mode, captchaId: String(fd.get('captchaId') ?? ''), captchaAnswer: String(fd.get('captchaAnswer') ?? '') } });
      if (result.clientAuth) {
        const authResult = mode === 'signin'
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signUp({ email, password });
        if (authResult.error) throw new Error(authResult.error.message);
      } else if(result.session) {
        await supabase.auth.setSession({access_token:result.session.access_token,refresh_token:result.session.refresh_token});
      }
      if (mode === "signin") {
        toast.success("Welcome back.");
        await navigate({ to: "/admin" });
      } else {
        toast.success(result.session ? 'Account created.' : 'Check your email to confirm your account.');
        setMode("signin");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sign in failed.");
    } finally {
      setPending(false);
      setAttempt(a=>a+1);
    }
  }

  return (
    <SiteShell>
      <section className="mx-auto flex max-w-md flex-col justify-center px-5 py-20 sm:px-8">
        <div className="rounded-2xl glass-panel p-7 sm:p-9">
          <p className="text-xs uppercase tracking-[0.26em] text-accent">Staff area</p>
          <h1 className="mt-3 font-display text-3xl font-semibold">
            {mode === "signin" ? "Sign in" : "Create staff account"}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Manage listings, enquiries and site content.
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required autoComplete="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
              />
            </div>
            <BotCaptcha key={attempt}/>
            <Button type="submit" disabled={pending} className="w-full rounded-full">
              {pending && <Spinner/>}
              {pending ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
            </Button>
          </form>

          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="mt-6 w-full text-center text-xs text-muted-foreground hover:text-foreground"
          >
            {mode === "signin"
              ? "First time here? Create a staff account"
              : "Already have an account? Sign in"}
          </button>
        </div>
      </section>
    </SiteShell>
  );
}
