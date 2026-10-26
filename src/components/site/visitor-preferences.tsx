import { useEffect, useState } from 'react';
import { Bell, Cookie } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export function VisitorPreferences(){
 const [show,setShow]=useState(false);const [permission,setPermission]=useState<string>('default');
 useEffect(()=>{setShow(!localStorage.getItem('jm-cookie-choice'));setPermission('Notification' in window?Notification.permission:'unsupported');},[]);
 function choose(value:string){localStorage.setItem('jm-cookie-choice',value);setShow(false);}
 async function notify(){if(!('Notification' in window)){toast.info('This browser does not support notifications.');return;}try{const result=await Notification.requestPermission();setPermission(result);toast.info(result==='granted'?'Notifications allowed on this device.':'Notifications are not enabled.');}catch{toast.error('Please change notification permissions in your browser.');}}
 return <><div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-5 py-4 sm:px-8"><Button variant="ghost" size="sm" onClick={()=>setShow(true)}><Cookie className="size-4"/>Cookie preferences</Button><Button variant="ghost" size="sm" onClick={()=>void notify()} disabled={permission==='granted'||permission==='unsupported'}><Bell className="size-4"/>{permission==='granted'?'Notifications allowed':'Allow notifications'}</Button></div>{show&&<div role="dialog" aria-label="Cookie choices" className="fixed inset-x-4 bottom-4 z-[60] mx-auto max-w-xl rounded-lg border border-border bg-background p-5 shadow-xl"><div className="flex gap-3"><Cookie className="mt-1 size-5 shrink-0 text-primary"/><div><h2 className="font-semibold">Your privacy matters</h2><p className="mt-2 text-xs leading-relaxed text-muted-foreground">Essential storage keeps this website working. Optional cookies remain off unless you accept them.</p></div></div><div className="mt-4 flex flex-wrap gap-3"><Button onClick={()=>choose('accepted')}>Accept optional cookies</Button><Button variant="outline" onClick={()=>choose('essential')}>Essential only</Button></div></div>}</>;
}