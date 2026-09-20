import { accessCode, json } from './_lib/access.js';

export async function onRequestPost(context) {
  const expected = accessCode(context.env);
  let code = '';
  try {
    const body = await context.request.json();
    code = body.code || '';
  } catch {
    /* ignore */
  }
  const ok = !!expected && code === expected;
  return json({ ok, gated: !!expected }, ok ? 200 : 403);
}
