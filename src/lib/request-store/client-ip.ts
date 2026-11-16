// Vercel overwrites x-forwarded-for, so clients cannot spoof it there
export function readClientIp(requestHeaders: Headers): string {
  const forwardedIp = requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim();
  if (forwardedIp) {
    return forwardedIp;
  }
  const realIp = requestHeaders.get('x-real-ip')?.trim();
  if (realIp) {
    return realIp;
  }
  return 'unknown';
}
