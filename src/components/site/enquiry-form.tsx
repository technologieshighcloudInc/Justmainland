import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitEnquiry } from "@/lib/public.functions";
import { BotCaptcha } from './bot-captcha';
import { Spinner } from '@/components/ui/spinner';

export function EnquiryForm({
  propertyId = null,
  defaultSubject = "General enquiry",
}: {
  propertyId?: string | null;
  defaultSubject?: string;
}) {
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [attempt, setAttempt] = useState(0);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fd = new FormData(form);
    setPending(true);
    try {
      const result = await submitEnquiry({
        data: {
          name: String(fd.get("name") ?? ""),
          email: String(fd.get("email") ?? ""),
          phone: String(fd.get("phone") ?? ""),
          subject: String(fd.get("subject") ?? defaultSubject),
          message: String(fd.get("message") ?? ""),
          propertyId,
          captchaId: String(fd.get('captchaId') ?? ''),
          captchaAnswer: String(fd.get('captchaAnswer') ?? ''),
        },
      });
      if (result.ok) {
        form.reset();
        setDone(true);
        toast.success("Enquiry sent — we'll be in touch shortly.");
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Please check your details and try again.");
    } finally {
      setPending(false);
      setAttempt(a => a + 1);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl glass-panel p-8 text-center">
        <h3 className="font-display text-xl font-semibold">Thank you.</h3>
        <p className="mt-3 text-sm text-muted-foreground">
          Your enquiry is with our advisory desk. Expect a response within one business day.
        </p>
        <Button variant="outline" className="mt-6" onClick={() => setDone(false)}>
          Send another
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="min-w-0 rounded-2xl glass-panel p-4 sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="min-w-0 space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" name="name" required minLength={2} maxLength={100} placeholder="Adaeze Okafor" />
        </div>
        <div className="min-w-0 space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required maxLength={255} placeholder="you@company.com" />
        </div>
        <div className="min-w-0 space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" maxLength={40} placeholder="+234 800 000 0000" />
        </div>
        <div className="min-w-0 space-y-2">
          <Label htmlFor="subject">Subject</Label>
          <Input id="subject" name="subject" maxLength={160} defaultValue={defaultSubject} />
        </div>
      </div>
      <div className="mt-5 min-w-0 space-y-2">
        <Label htmlFor="message">How can we help?</Label>
        <Textarea
          id="message"
          name="message"
          required
          minLength={10}
          maxLength={1500}
          rows={5}
          placeholder="Tell us about the property, budget and timeline you have in mind."
        />
      </div>
      <BotCaptcha key={attempt}/>
      <Button type="submit" disabled={pending} className="mt-6 w-full rounded-full sm:w-auto sm:px-8">
        {pending && <Spinner/>}{pending ? "Sending…" : "Send enquiry"}
      </Button>
    </form>
  );
}
