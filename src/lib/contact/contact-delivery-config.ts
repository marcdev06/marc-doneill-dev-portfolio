export const defaultContactFromAddress = 'Portfolio contact <onboarding@resend.dev>';

export type ContactDeliveryConfig =
  | { mode: 'log'; logFilePath?: string }
  | { mode: 'resend'; apiKey: string; toAddress: string; fromAddress: string }
  | { mode: 'unconfigured'; problem: string };

type EnvironmentVariables = Record<string, string | undefined>;

function readSetting(environment: EnvironmentVariables, variableName: string) {
  const settingValue = environment[variableName]?.trim();
  return settingValue === '' ? undefined : settingValue;
}

export function readContactDeliveryConfig(
  environment: EnvironmentVariables,
): ContactDeliveryConfig {
  const deliveryMode = readSetting(environment, 'CONTACT_DELIVERY') ?? 'resend';
  if (deliveryMode === 'log') {
    // E2e reads review links from this file; never on Vercel
    const logFilePath =
      environment.VERCEL === '1' ? undefined : readSetting(environment, 'CONTACT_LOG_FILE');
    return logFilePath === undefined ? { mode: 'log' } : { mode: 'log', logFilePath };
  }
  if (deliveryMode !== 'resend') {
    return {
      mode: 'unconfigured',
      problem: `CONTACT_DELIVERY must be "resend" or "log", not "${deliveryMode}".`,
    };
  }

  const apiKey = readSetting(environment, 'RESEND_API_KEY');
  const toAddress = readSetting(environment, 'CONTACT_TO_EMAIL');
  if (apiKey === undefined || toAddress === undefined) {
    const missingVariables = [
      apiKey === undefined && 'RESEND_API_KEY',
      toAddress === undefined && 'CONTACT_TO_EMAIL',
    ].filter(Boolean);
    return {
      mode: 'unconfigured',
      problem: `Set ${missingVariables.join(' and ')}, or CONTACT_DELIVERY=log for local runs.`,
    };
  }

  return {
    mode: 'resend',
    apiKey,
    toAddress,
    fromAddress: readSetting(environment, 'CONTACT_FROM_EMAIL') ?? defaultContactFromAddress,
  };
}
