import { checkAccess, json } from './_lib/access.js';

// Cloudflare Pages has no durable local disk like Node's logs/.
// Accept the payload so the client teardown stays happy.
export async function onRequestPost(context) {
  const { request, env } = context;
  if (!checkAccess(request, env)) {
    return json({ error: 'invalid access code' }, 403);
  }
  try {
    await request.json();
  } catch {
    return json({ error: 'bad json' }, 400);
  }
  return json({ ok: true, file: null });
}
