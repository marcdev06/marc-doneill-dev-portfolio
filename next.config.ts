import path from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  poweredByHeader: false,
  sassOptions: {
    quietDeps: true,
    silenceDeprecations: ['import'],
    // Turbopack misses Bootstrap's internal relative imports on Windows
    loadPaths: [path.join(import.meta.dirname, 'node_modules', 'bootstrap', 'scss')],
  },
};

export default nextConfig;
