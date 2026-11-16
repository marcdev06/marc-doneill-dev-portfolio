import { describe, expect, it } from 'vitest';
import { defaultContactFromAddress, readContactDeliveryConfig } from './contact-delivery-config';

const resendEnvironment = {
  RESEND_API_KEY: 're_test_placeholder',
  CONTACT_TO_EMAIL: 'inbox@example.com',
};

describe('readContactDeliveryConfig', () => {
  it('uses log delivery when CONTACT_DELIVERY is log, without needing keys', () => {
    expect(readContactDeliveryConfig({ CONTACT_DELIVERY: ' log ' })).toEqual({ mode: 'log' });
  });

  it('also appends logged emails to CONTACT_LOG_FILE, but never on Vercel', () => {
    const logEnvironment = { CONTACT_DELIVERY: 'log', CONTACT_LOG_FILE: '/tmp/emails.log' };

    expect(readContactDeliveryConfig(logEnvironment)).toEqual({
      mode: 'log',
      logFilePath: '/tmp/emails.log',
    });
    expect(readContactDeliveryConfig({ ...logEnvironment, VERCEL: '1' })).toEqual({ mode: 'log' });
  });

  it('defaults to Resend with the onboarding sender', () => {
    expect(readContactDeliveryConfig(resendEnvironment)).toEqual({
      mode: 'resend',
      apiKey: 're_test_placeholder',
      toAddress: 'inbox@example.com',
      fromAddress: defaultContactFromAddress,
    });
    expect(defaultContactFromAddress).toBe('Portfolio contact <onboarding@resend.dev>');
  });

  it('uses CONTACT_FROM_EMAIL when it is set', () => {
    expect(
      readContactDeliveryConfig({
        ...resendEnvironment,
        CONTACT_DELIVERY: 'resend',
        CONTACT_FROM_EMAIL: 'Marc <hello@example.com>',
      }),
    ).toMatchObject({ mode: 'resend', fromAddress: 'Marc <hello@example.com>' });
  });

  it('names every missing variable, treating blank values as missing', () => {
    expect(readContactDeliveryConfig({ CONTACT_FROM_EMAIL: '' })).toEqual({
      mode: 'unconfigured',
      problem: 'Set RESEND_API_KEY and CONTACT_TO_EMAIL, or CONTACT_DELIVERY=log for local runs.',
    });
    expect(readContactDeliveryConfig({ ...resendEnvironment, RESEND_API_KEY: '  ' })).toEqual({
      mode: 'unconfigured',
      problem: 'Set RESEND_API_KEY, or CONTACT_DELIVERY=log for local runs.',
    });
    expect(readContactDeliveryConfig({ RESEND_API_KEY: 're_test_placeholder' })).toEqual({
      mode: 'unconfigured',
      problem: 'Set CONTACT_TO_EMAIL, or CONTACT_DELIVERY=log for local runs.',
    });
  });

  it('rejects an unknown delivery mode', () => {
    expect(readContactDeliveryConfig({ ...resendEnvironment, CONTACT_DELIVERY: 'smtp' })).toEqual({
      mode: 'unconfigured',
      problem: 'CONTACT_DELIVERY must be "resend" or "log", not "smtp".',
    });
  });
});
