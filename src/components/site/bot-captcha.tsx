import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createCaptcha } from '@/lib/visitor.functions';

export function BotCaptcha() {
 const [challenge,setChallenge]=useState<{id:string;svg:string}|null>(null);
 const [error,setError]=useState('');
 async function refresh(){ setChallenge(null); setError(''); try{setChallenge(await createCaptcha());}catch{setError('Security check unavailable. Please retry.');} }
 useEffect(()=>{void refresh();},[]);
 return <fieldset className="mt-5 min-w-0 space-y-2"><legend className="text-sm font-medium">Security check</legend><div className="flex min-w-0 flex-wrap items-center gap-3">{challenge ? <img src={challenge.svg} alt="Security code to enter below" width={200} height={52} className="h-auto max-w-full"/> : <span className="text-xs text-muted-foreground">{error || 'Loading security code…'}</span>}<Button type="button" variant="outline" size="icon" aria-label="Refresh security code" onClick={()=>void refresh()}><RefreshCw className="size-4"/></Button></div><input type="hidden" name="captchaId" value={challenge?.id ?? ''}/><Input key={challenge?.id} name="captchaAnswer" aria-label="Enter security code" placeholder="Enter the six characters" required minLength={6} maxLength={6} autoComplete="off" disabled={!challenge}/></fieldset>;
}