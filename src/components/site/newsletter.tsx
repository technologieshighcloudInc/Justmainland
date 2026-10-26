import { useState } from 'react';
import { Mail, ArrowRight, LoaderCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BotCaptcha } from './bot-captcha';
import { subscribeNewsletter } from '@/lib/visitor.functions';

export function Newsletter(){
 const [pending,setPending]=useState(false); const [done,setDone]=useState(false); const [attempt,setAttempt]=useState(0);
 async function submit(e:React.FormEvent<HTMLFormElement>){ e.preventDefault(); const fd=new FormData(e.currentTarget);setPending(true);try{await subscribeNewsletter({data:{email:String(fd.get('email')??''),consent:true,captchaId:String(fd.get('captchaId')??''),captchaAnswer:String(fd.get('captchaAnswer')??'')}});setDone(true);}catch(err){toast.error(err instanceof Error?err.message:'Please try again.');setAttempt(a=>a+1);}finally{setPending(false);} }
 return <section className="border-y border-border bg-secondary/40"><div className="mx-auto grid max-w-7xl gap-8 px-5 py-14 sm:px-8 md:grid-cols-2"><div><Mail className="size-7 text-primary"/><h2 className="mt-4 font-display text-3xl font-semibold">Stay close to the Mainland.</h2><p className="mt-4 text-muted-foreground">Property news, fresh listings and insights from JustMainlandNG.</p></div>{done?<p role="status" className="self-center font-semibold text-primary">You’re subscribed. Thank you.</p>:<form onSubmit={submit}><label htmlFor="newsletter-email" className="text-sm font-medium">Email address</label><Input id="newsletter-email" type="email" name="email" required maxLength={255} placeholder="you@example.com" className="mt-2"/><label className="mt-3 flex items-start gap-2 text-xs text-muted-foreground"><input type="checkbox" required className="mt-0.5"/>I agree to receive property news by email. I can unsubscribe at any time.</label><BotCaptcha key={attempt}/><Button className="mt-4" disabled={pending} type="submit">{pending?<LoaderCircle className="size-4 animate-spin"/>:<ArrowRight className="size-4"/>}Subscribe</Button></form>}</div></section>;
}