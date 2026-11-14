const localDevelopmentUrl = 'http://localhost:3000';

function readEnvironmentValue(name: string): string | undefined {
  const trimmedValue = process.env[name]?.trim();
  return trimmedValue === '' ? undefined : trimmedValue;
}

function removeTrailingSlashes(url: string): string {
  return url.replace(/\/+$/, '');
}

export function getSiteUrl(): URL {
  const configuredUrl = readEnvironmentValue('NEXT_PUBLIC_SITE_URL');
  if (configuredUrl) {
    return new URL(removeTrailingSlashes(configuredUrl));
  }

  const vercelProductionHost = readEnvironmentValue('VERCEL_PROJECT_PRODUCTION_URL');
  if (vercelProductionHost) {
    return new URL(`https://${removeTrailingSlashes(vercelProductionHost)}`);
  }

  return new URL(localDevelopmentUrl);
}
