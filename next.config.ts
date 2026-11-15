import path from 'node:path';
import type { NextConfig } from 'next';

// No script-src: it needs nonces, which disable static prerendering
const contentSecurityPolicy = [
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ');

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  sassOptions: {
    quietDeps: true,
    silenceDeprecations: ['import'],
    // Turbopack misses Bootstrap's internal relative imports on Windows
    loadPaths: [path.join(import.meta.dirname, 'node_modules', 'bootstrap', 'scss')],
  },
  headers() {
    return Promise.resolve([{ source: '/:path*', headers: securityHeaders }]);
  },
};

export default nextConfig;
