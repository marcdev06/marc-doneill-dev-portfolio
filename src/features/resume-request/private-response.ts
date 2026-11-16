export const privateResponseHeaders = {
  'Cache-Control': 'no-store',
  'X-Robots-Tag': 'noindex',
} as const;

export function createPrivateJsonResponse(body: object, status = 200): Response {
  return Response.json(body, { status, headers: privateResponseHeaders });
}
