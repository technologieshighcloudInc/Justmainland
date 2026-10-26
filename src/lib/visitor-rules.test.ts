import { describe, expect, it } from 'vitest';
import { visibleResults, lagosDate, validCaptchaAnswer } from './visitor-rules';
describe('visitor rules', () => {
  it('shows three results first', () => expect(visibleResults([1,2,3,4,5])).toEqual([1,2,3]));
  it('loads three more', () => expect(visibleResults([1,2,3,4,5,6,7],6)).toEqual([1,2,3,4,5,6]));
  it('uses the current Lagos date across UTC midnight', () => expect(lagosDate(new Date('2026-10-18T23:30:00Z'))).toBe('2026-10-19'));
  it('rejects malformed captcha answers', () => { expect(validCaptchaAnswer('ABC234')).toBe(true); expect(validCaptchaAnswer('<script>')).toBe(false); });
});