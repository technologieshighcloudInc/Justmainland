export const PAGE_SIZE = 3;
export function visibleResults<T>(rows: T[], count = PAGE_SIZE) { return rows.slice(0, count); }
export function lagosDate(now = new Date()) { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Lagos', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now); }
export function validCaptchaAnswer(value: string) { return /^[A-Z2-9]{6}$/.test(value.toUpperCase()); }