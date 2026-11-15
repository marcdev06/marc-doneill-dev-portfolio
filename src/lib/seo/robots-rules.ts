export interface RobotsRules {
  rules: { userAgent: string; allow?: string; disallow?: string };
  sitemap?: string;
}

export function isVercelNonProductionDeployment(vercelEnvironment: string | undefined): boolean {
  return Boolean(vercelEnvironment) && vercelEnvironment !== 'production';
}

export function buildRobotsRules(siteUrl: URL, vercelEnvironment: string | undefined): RobotsRules {
  if (isVercelNonProductionDeployment(vercelEnvironment)) {
    return { rules: { userAgent: '*', disallow: '/' } };
  }
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: new URL('/sitemap.xml', siteUrl).href,
  };
}
