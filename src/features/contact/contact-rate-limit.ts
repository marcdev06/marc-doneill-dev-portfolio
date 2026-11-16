import { resolveRequestServices } from '@/features/request-store/request-services';

// The form keeps working when Redis is missing or down
export async function isContactMessageAllowed(clientIp: string): Promise<boolean> {
  try {
    const servicesResult = await resolveRequestServices();
    if (!servicesResult.isAvailable) {
      console.warn(`[contact] Rate limit skipped: ${servicesResult.problem}`);
      return true;
    }
    return await servicesResult.services.rateLimiter.isAllowed('contactMessagePerIp', clientIp);
  } catch (limitError) {
    console.error('[contact] Rate limit check failed; the message is allowed:', limitError);
    return true;
  }
}
