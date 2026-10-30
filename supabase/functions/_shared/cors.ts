// Browser origins allowed to call Sienvi edge functions. Requests from other
// origins get the production origin back, so the browser blocks the response.
export const ALLOWED_ORIGINS = [
  "https://sienvi.com",
  "https://www.sienvi.com",
  "https://sienvi-agency--sienvi-agency.us-east4.hosted.app",
  "http://localhost:8080",
  "http://localhost:5173",
];

const DEFAULT_ORIGIN = "https://sienvi.com";

/**
 * Wraps a serve() handler and replaces its Access-Control-Allow-Origin header
 * with the request's origin when allowed, so existing handlers that build
 * their own CORS headers don't need to change.
 */
export function withAllowedOrigin(
  handler: (req: Request) => Response | Promise<Response>,
): (req: Request) => Promise<Response> {
  return async (req: Request) => {
    const res = await handler(req);
    const origin = req.headers.get("origin") || "";
    const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : DEFAULT_ORIGIN;
    const out = new Response(res.body, res);
    out.headers.set("Access-Control-Allow-Origin", allowed);
    out.headers.append("Vary", "Origin");
    return out;
  };
}
