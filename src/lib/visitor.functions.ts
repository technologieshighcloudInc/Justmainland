import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

export const captchaFields = { captchaId: z.string().min(1).max(512), captchaAnswer: z.string().trim().min(6).max(6) };
export const createCaptcha = createServerFn({ method:'POST' }).handler(async () => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const random = crypto.getRandomValues(new Uint8Array(6));
  const answer = Array.from(random, b => alphabet[b % alphabet.length]).join('');
  const expiry = Date.now() + 300000;
  const { createCaptchaToken } = await import('./captcha.server');
  const id = await createCaptchaToken(answer, expiry);
  const letters = Array.from(answer, (c,i) => `<text x="${20+i*28}" y="35" transform="rotate(${(random[i] ?? 0)%24-12} ${20+i*28} 35)">${c}</text>`).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="52"><rect width="200" height="52" fill="#edf4f9"/><g fill="#214f75" font-family="monospace" font-size="28" font-weight="bold">${letters}</g><path d="M0 18L200 39M0 42L200 10" stroke="#6a95b4" fill="none"/></svg>`;
  return { id, svg: `data:image/svg+xml;base64,${btoa(svg)}` };
});
export const subscribeNewsletter = createServerFn({ method:'POST' })
 .inputValidator((input:unknown) => z.object({ email:z.string().trim().email().max(255), consent:z.literal(true), ...captchaFields }).parse(input))
 .handler(async ({data}) => {
  const { verifyCaptcha } = await import('./captcha.server'); await verifyCaptcha(data.captchaId,data.captchaAnswer);
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const {error} = await supabaseAdmin.from('newsletter_subscribers').upsert({email:data.email.toLowerCase()}, { onConflict:'email', ignoreDuplicates:true });
  if(error) throw new Error('Subscription could not be saved.');
  return {ok:true};
 });
export const staffLogin = createServerFn({method:'POST'})
 .inputValidator((input:unknown) => z.object({email:z.string().trim().email().max(255),password:z.string().min(8).max(256),mode:z.enum(['signin','signup']),...captchaFields}).parse(input))
 .handler(async ({data}) => {
  const {verifyCaptcha}=await import('./captcha.server'); await verifyCaptcha(data.captchaId,data.captchaAnswer);
  if (!process.env['SUPABASE_SERVICE_ROLE_KEY']) return { session: null, clientAuth: true };
  const { createPublicClient } = await import('./public-db.server');
  const client = createPublicClient();
  const result = data.mode === 'signin'
    ? await client.auth.signInWithPassword({ email: data.email, password: data.password })
    : await client.auth.signUp({ email: data.email, password: data.password });
  if(result.error) throw new Error(result.error.message);
  return {session:result.data.session};
 });