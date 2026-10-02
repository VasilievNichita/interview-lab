const encoder = new TextEncoder();
export function randomToken(bytes = 32) {
  return [...crypto.getRandomValues(new Uint8Array(bytes))]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
export async function digest(value: string) {
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value)))]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
// Workers Web Crypto currently caps PBKDF2 at 100,000 iterations.
// Versioned parameters allow migration when runtime support changes.
export async function passwordHash(password: string, salt: string) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, [
    'deriveBits',
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: encoder.encode(salt), iterations: 100000 },
    key,
    256,
  );
  return (
    'pbkdf2-sha256:100000:' +
    [...new Uint8Array(bits)].map((b) => b.toString(16).padStart(2, '0')).join('')
  );
}
export function equal(a: string, b: string) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}
export function validEmail(value: unknown): value is string {
  return (
    typeof value === 'string' && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  );
}
export function validPassword(value: unknown): value is string {
  return typeof value === 'string' && value.length >= 12 && value.length <= 128;
}
export function cookie(token: string, request: Request, clear = false) {
  return `il_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${clear ? 0 : 60 * 60 * 24 * 30}${new URL(request.url).protocol === 'https:' ? '; Secure' : ''}`;
}
