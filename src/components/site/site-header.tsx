import { Link } from "@tanstack/react-router";
import { ChevronDown, LockKeyhole } from "lucide-react";
import { useState } from "react";

import brandLogo from "@/assets/justmainlandng-logo.jpg";
import { Button } from "@/components/ui/button";

const ABOUT_LINKS = [
  { to: "/about", label: "About Us" },
  { to: "/values", label: "Mission, vision & values" },
  { to: "/partners", label: "Partners & affiliates" },
  { to: "/team", label: "Team & agents" },
] as const;
const INSIGHTS_LINKS = [
  { to: "/insights", label: "News & insights" },
  { to: "/faq", label: "FAQs" },
  { to: "/testimonials", label: "Client reviews" },
] as const;

const NAV = [
  { to: "/", label: "Home" },
  { to: "/properties", label: "Properties" },
  { to: "/services", label: "Services" },
  { to: "/about", label: "About", children: ABOUT_LINKS },
  { to: "/insights", label: "Insights", children: INSIGHTS_LINKS },
  { to: "/contact", label: "Contact" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [dropdown, setDropdown] = useState<string | null>(null);
  const [mobileGroup, setMobileGroup] = useState<string | null>(null);
  function closeMenu() { setOpen(false); setDropdown(null); setMobileGroup(null); }

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/90 shadow-sm backdrop-blur-xl">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-6 px-5 py-4 sm:px-8">
        <Link to="/" className="group flex shrink-0 items-center" onClick={closeMenu} aria-label="JustMainlandNG home">
          <img
            src={brandLogo}
            alt="JustMainlandNG Real Estate"
            width={358}
            height={247}
            className="h-14 w-auto max-w-32 rounded-md object-contain"
          />
        </Link>

        <nav aria-label="Main navigation" className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => "children" in item ? (
            <div key={item.to} className="relative" onMouseEnter={() => setDropdown(item.to)} onMouseLeave={() => setDropdown(null)} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setDropdown(null); }} onKeyDown={(event) => { if (event.key === "Escape") { setDropdown(null); event.currentTarget.querySelector('button')?.focus(); } }}>
              <Button variant="ghost" aria-expanded={dropdown === item.to} aria-controls={`nav-${item.label}`} onClick={() => setDropdown(dropdown === item.to ? null : item.to)} className="rounded-full px-4 text-muted-foreground hover:bg-secondary hover:text-primary">
                {item.label}<ChevronDown className={`transition-transform duration-300 motion-reduce:transition-none motion-reduce:transition-none ${dropdown === item.to ? 'rotate-180' : ''}`} />
              </Button>
              <div id={`nav-${item.label}`} inert={dropdown !== item.to} className={`absolute left-0 top-full w-64 pt-3 transition-[opacity,transform,visibility] duration-200 motion-reduce:transition-none ${dropdown === item.to ? 'visible translate-y-0 opacity-100' : 'invisible translate-y-2 opacity-0'}`}>
                <div className="rounded-lg border border-border bg-popover p-2 shadow-lg">
                  {item.children.map(child => <Link key={child.to} to={child.to} onClick={closeMenu} activeOptions={{ exact: true }} activeProps={{ className: "bg-secondary text-primary" }} className="block rounded-md px-4 py-3 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{child.label}</Link>)}
                </div>
              </div>
            </div>
          ) : (
            <Link key={item.to} to={item.to} activeOptions={{ exact: item.to === "/" }} activeProps={{ className: "text-primary bg-secondary" }} className="rounded-full px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground">{item.label}</Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
            <Link to="/auth" aria-label="Staff sign in" title="Staff sign in"><LockKeyhole className="size-4" /></Link>
          </Button>
          <Button asChild size="sm" className="rounded-full px-5">
            <Link to="/contact">Book a viewing</Link>
          </Button>
        </div>

        <Button
          variant="outline"
          size="icon"
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-navigation"
          onClick={() => { setOpen(v => !v); setMobileGroup(null); }}
          className="grid size-10 place-items-center rounded-lg border border-border text-foreground transition-[background-color,transform] duration-300 motion-reduce:transition-none lg:hidden"
        >
          <span className="relative block h-5 w-5" aria-hidden="true"><span className={`absolute left-0 top-1 h-0.5 w-5 bg-foreground transition-transform duration-300 motion-reduce:transition-none ${open ? 'translate-y-1.5 rotate-45' : ''}`} /><span className={`absolute left-0 top-2.5 h-0.5 w-4 bg-primary transition-all duration-300 motion-reduce:transition-none ${open ? 'opacity-0 -translate-x-2' : ''}`} /><span className={`absolute left-0 top-4 h-0.5 w-5 bg-foreground transition-transform duration-300 motion-reduce:transition-none ${open ? '-translate-y-1.5 -rotate-45' : ''}`} /></span>
        </Button>
      </div>

      <div id="mobile-navigation" inert={!open} className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none lg:hidden ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden"><div className={`max-h-[calc(100dvh-88px)] overflow-y-auto border-t border-border/70 bg-background px-5 pb-6 pt-3 shadow-lg transition-transform duration-300 motion-reduce:transition-none ${open ? 'translate-y-0' : '-translate-y-4'}`}>
          <nav aria-label="Mobile navigation" className="flex flex-col">
            {NAV.map(item => "children" in item ? (
              <div key={item.to} className="border-b border-border/60">
                <Button variant="ghost" aria-expanded={mobileGroup === item.to} aria-controls={`mobile-${item.label}`} onClick={() => setMobileGroup(mobileGroup === item.to ? null : item.to)} className="h-12 w-full justify-between px-0 text-muted-foreground hover:bg-transparent hover:text-primary">{item.label}<ChevronDown className={`transition-transform duration-300 motion-reduce:transition-none ${mobileGroup === item.to ? 'rotate-180' : ''}`} /></Button>
                <div id={`mobile-${item.label}`} inert={mobileGroup !== item.to} className={`grid transition-[grid-template-rows,opacity] duration-300 motion-reduce:transition-none ${mobileGroup === item.to ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                  <div className="overflow-hidden"><div className="mb-3 border-l-2 border-primary/30 pl-4">{item.children.map(child => <Link key={child.to} to={child.to} onClick={closeMenu} activeProps={{ className: "text-primary" }} className="block py-3 text-sm text-muted-foreground hover:text-primary">{child.label}</Link>)}</div></div>
                </div>
              </div>
            ) : <Link key={item.to} to={item.to} onClick={closeMenu} activeOptions={{ exact: item.to === "/" }} activeProps={{ className: "text-primary" }} className="border-b border-border/60 py-3 text-sm text-muted-foreground">{item.label}</Link>)}
          </nav>
          <div className="mt-5 flex gap-3">
            <Button asChild variant="outline" className="flex-1">
              <Link to="/auth" aria-label="Staff sign in" title="Staff sign in" onClick={closeMenu}>
                <LockKeyhole className="size-5" />
              </Link>
            </Button>
            <Button asChild className="flex-1">
              <Link to="/contact" onClick={closeMenu}>
                Book a viewing
              </Link>
            </Button>
          </div>
        </div></div>
      </div>
    </header>
  );
}
