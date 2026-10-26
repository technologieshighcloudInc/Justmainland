import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { bookInspection } from "@/lib/public.functions";
import { BotCaptcha } from './bot-captcha';
import { lagosDate } from '@/lib/visitor-rules';

const TIME_SLOTS = [
  "9:00 AM",
  "11:00 AM",
  "1:00 PM",
  "3:00 PM",
  "5:00 PM",
];

function nextDates(count: number) {
  const today = new Date(`${lagosDate()}T12:00:00`);
  const days: { value: string; weekday: string; day: string; month: string }[] = [];
  for (let i = 0; i < count; i += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
      date.getDate(),
    ).padStart(2, "0")}`;
    days.push({
      value,
      weekday: i === 0 ? "Today" : date.toLocaleDateString("en-NG", { weekday: "short" }),
      day: String(date.getDate()),
      month: date.toLocaleDateString("en-NG", { month: "short" }),
    });
  }
  return days;
}

export function InspectionForm({
  propertyId = null,
  propertyTitle = "",
}: {
  propertyId?: string | null;
  propertyTitle?: string;
}) {
  const [dates, setDates] = useState<ReturnType<typeof nextDates>>([]);
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState(TIME_SLOTS[0] ?? '9:00 AM');
  const [attempt, setAttempt] = useState(0);
  useEffect(()=>{const next=nextDates(10);setDates(next);setDate(next[0]?.value ?? '');},[]);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);
  const fdRef = useRef<FormData | null>(null);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    formRef.current = event.currentTarget;
    fdRef.current = new FormData(event.currentTarget);
    setConfirmOpen(true);
  }

  async function confirmSubmit() {
    const form = formRef.current;
    const fd = fdRef.current;
    if (!form || !fd) return;
    setConfirmOpen(false);
    setPending(true);
    try {
      const result = await bookInspection({
        data: {
          name: String(fd.get("name") ?? ""),
          email: String(fd.get("email") ?? ""),
          phone: String(fd.get("phone") ?? ""),
          notes: String(fd.get("notes") ?? ""),
          preferredDate: date,
          preferredTime: slot,
          propertyId,
          captchaId: String(fd.get('captchaId') ?? ''),
          captchaAnswer: String(fd.get('captchaAnswer') ?? ''),
        },
      });
      if (result.ok) {
        form.reset();
        setDone(true);
        toast.success("Inspection requested — we'll confirm your slot shortly.");
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Please check your details and try again.");
    } finally {
      setPending(false);
      setAttempt(a=>a+1);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl glass-panel p-7 text-center">
        <h3 className="font-display text-lg font-semibold">Inspection requested</h3>
        <p className="mt-3 text-sm text-muted-foreground">
          Our advisory desk will confirm your viewing slot by phone or email.
        </p>
        <Button variant="outline" className="mt-6" onClick={() => setDone(false)}>
          Book another
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="min-w-0 rounded-2xl glass-panel p-4 sm:p-6">
      <h3 className="font-display text-lg font-semibold">Book an inspection</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        {propertyTitle ? `Pick a day to view ${propertyTitle}.` : "Pick a day that works for you."}
      </p>

      <div className="mt-5 min-w-0">
        <Label htmlFor="inspection-date">Inspection date · Lagos time</Label>
        <Input id="inspection-date" type="date" required value={date} min={dates[0]?.value} onChange={e=>setDate(e.target.value)} className="mt-2" />
        <Label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Choose a date
        </Label>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {dates.map((item) => {
            const active = item.value === date;
            return (
              <Button variant="outline"
                key={item.value}
                type="button"
                onClick={() => setDate(item.value)}
                aria-pressed={active}
                className={`shrink-0 rounded-xl border px-3 py-2 text-center transition-colors ${
                  active
                    ? "border-accent/60 bg-accent/15 text-foreground"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="block text-[0.62rem] uppercase tracking-[0.14em]">
                  {item.weekday}
                </span>
                <span className="block font-display text-base font-semibold">{item.day}</span>
                <span className="block text-[0.62rem] text-muted-foreground">{item.month}</span>
              </Button>
            );
          })}
        </div>
      </div>

      <div className="mt-5 min-w-0">
        <Label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Time slot
        </Label>
        <div className="mt-3 flex flex-wrap gap-2">
          {TIME_SLOTS.map((item) => {
            const active = item === slot;
            return (
              <Button variant="outline"
                key={item}
                type="button"
                onClick={() => setSlot(item)}
                aria-pressed={active}
                className={`rounded-full border px-4 py-1.5 text-xs transition-colors ${
                  active
                    ? "border-accent/60 bg-accent/15 text-foreground"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {item}
              </Button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="min-w-0 space-y-2">
          <Label htmlFor="insp-name">Full name</Label>
          <Input id="insp-name" name="name" required minLength={2} maxLength={100} />
        </div>
        <div className="min-w-0 space-y-2">
          <Label htmlFor="insp-email">Email</Label>
          <Input id="insp-email" name="email" type="email" required maxLength={255} />
        </div>
      </div>
      <div className="mt-4 min-w-0 space-y-2">
        <Label htmlFor="insp-phone">Phone</Label>
        <Input id="insp-phone" name="phone" maxLength={40} placeholder="+234 800 000 0000" />
      </div>
      <div className="mt-4 min-w-0 space-y-2">
        <Label htmlFor="insp-notes">Notes (optional)</Label>
        <Textarea id="insp-notes" name="notes" rows={3} maxLength={800} />
      </div>

      <BotCaptcha key={attempt}/>
      <p className="mt-6 rounded-xl border border-accent/40 bg-accent/10 px-4 py-3 text-xs leading-relaxed text-foreground">
        Heads up: inspections attract a service fee. You'll continue with an advisor who schedules
        the visit and confirms the fee before any payment.
      </p>
      <Button type="submit" disabled={pending || !date} className="mt-4 w-full rounded-full">
        {pending ? (
          <>
            <Spinner className="mr-2 size-4" /> Requesting…
          </>
        ) : (
          "Request inspection"
        )}
      </Button>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Inspections come with a fee</AlertDialogTitle>
            <AlertDialogDescription>
              Inspection bookings attract a service fee. When you continue, our advisory desk will
              contact you to schedule the viewing and confirm the fee before any payment is made.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Go back</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirmSubmit()}>
              Continue & request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
}
