import { MessageCircle, Send, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

const QUICK_REPLIES = [
  "I want to buy a property",
  "I want to rent or shortlet",
  "I want to book an inspection",
  "I want to sell or list my property",
  "Speak to a support agent",
];

export function WhatsAppWidget({
  number,
  supportEmail,
  brand = "JustMainlandNG",
}: {
  number: string;
  supportEmail?: string;
  brand?: string;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const digits = (number ?? "").replace(/[^0-9]/g, "");

  function send(message: string) {
    const body = message.trim();
    if (!digits || !body) return;
    const url = `https://wa.me/${digits}?text=${encodeURIComponent(
      `Hello ${brand}, ${body}`,
    )}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setOpen(false);
    setText("");
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3 print:hidden">
      {open ? (
        <div className="w-[19rem] overflow-hidden rounded-2xl glass-panel shadow-2xl">
          <div className="flex items-start justify-between gap-3 border-b border-border/70 px-4 py-3">
            <div>
              <p className="font-display text-sm font-semibold">Chat with us</p>
              <p className="text-xs text-muted-foreground">
                Typical reply time: a few minutes
              </p>
            </div>
            <button
              type="button"
              aria-label="Close chat"
              onClick={() => setOpen(false)}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="space-y-2 px-4 py-4">
            <p className="rounded-xl rounded-tl-sm bg-secondary px-3 py-2 text-xs leading-relaxed text-muted-foreground">
              Hi 👋 I'm the {brand} assistant. Pick what you need and I'll continue the
              conversation on WhatsApp.
            </p>
            {QUICK_REPLIES.map((reply) => (
              <button
                key={reply}
                type="button"
                onClick={() => send(reply)}
                className="w-full rounded-xl border border-border px-3 py-2 text-left text-xs text-foreground transition-colors hover:border-accent/50 hover:bg-secondary"
              >
                {reply}
              </button>
            ))}
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              send(text);
            }}
            className="flex items-center gap-2 border-t border-border/70 px-3 py-3"
          >
            <input
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Type your message…"
              maxLength={300}
              className="min-w-0 flex-1 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground"
            />
            <Button type="submit" size="icon" className="size-8 rounded-full" aria-label="Send on WhatsApp">
              <Send className="size-3.5" />
            </Button>
          </form>

          {supportEmail ? (
            <p className="border-t border-border/70 px-4 py-2.5 text-[0.68rem] text-muted-foreground">
              Prefer email?{" "}
              <a href={`mailto:${supportEmail}`} className="text-accent hover:underline">
                {supportEmail}
              </a>
            </p>
          ) : null}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Open WhatsApp chat"
        className="grid size-14 place-items-center rounded-full bg-[#25D366] text-[#04331a] shadow-[0_18px_45px_-15px_rgba(37,211,102,0.8)] transition-transform hover:scale-105"
      >
        <MessageCircle className="size-6" />
      </button>
    </div>
  );
}
