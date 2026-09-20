export function accessCode(env) {
  return env.HEYTHERE_ACCESS_CODE || '';
}

export function checkAccess(request, env) {
  const expected = accessCode(env);
  if (!expected) return true;
  const provided = request.headers.get('x-access-code');
  return typeof provided === 'string' && provided.length > 0 && provided === expected;
}

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function text(body, status = 200, contentType = 'text/plain') {
  return new Response(body, {
    status,
    headers: { 'Content-Type': contentType },
  });
}
