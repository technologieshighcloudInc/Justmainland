const encoder = new TextEncoder();

function captchaSecret(): string {
  const secret = process.env['CAPTCHA_SECRET'] || process.env['SUPABASE_SERVICE_ROLE_KEY'];
  if (secret) return secret;
  if (process.env['NODE_ENV'] === 'production') {
    throw new Error('CAPTCHA_SECRET must be configured in production.');
  }
  return 'justmainlandng-local-captcha-secret';
}

async function signCaptcha(answer: string, expiry: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(captchaSecret()), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(`${answer}:${expiry}`)));
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function createCaptchaToken(answer: string, expiry: number): Promise<string> {
  const expiryText = String(expiry);
  const signature = toHex(await signCaptcha(answer, expiryText));
  return btoa(`${answer}.${expiryText}.${signature}`);
}

export async function verifyCaptcha(id: string, answer: string): Promise<void> {
  try {
    const [expectedAnswer, expiryText, signature, ...extra] = atob(id).split('.');
    const expiry = Number(expiryText);
    if (!expectedAnswer || !expiryText || !signature || extra.length || !Number.isFinite(expiry) || expiry <= Date.now()) {
      throw new Error('Invalid token');
    }
    const valid = toHex(await signCaptcha(expectedAnswer, expiryText));
    if (valid !== signature || expectedAnswer.toUpperCase() !== answer.trim().toUpperCase()) {
      throw new Error('Invalid token');
    }
  } catch {
    throw new Error('Please refresh the security code and try again.');
  }
}