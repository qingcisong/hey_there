import { checkAccess, json, text } from './_lib/access.js';

function concatBytes(parts) {
  const total = parts.reduce((n, p) => n + p.byteLength, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part instanceof Uint8Array ? part : new Uint8Array(part), offset);
    offset += part.byteLength;
  }
  return out;
}

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!checkAccess(request, env)) {
    return json({ error: 'invalid access code' }, 403);
  }
  if (!env.GROQ_API_KEY) {
    return text('missing GROQ_API_KEY', 500);
  }

  const audio = new Uint8Array(await request.arrayBuffer());
  const contentType = request.headers.get('content-type') || 'audio/webm';
  const filename =
    'clip.' +
    (contentType.includes('webm')
      ? 'webm'
      : contentType.includes('mp4')
        ? 'm4a'
        : contentType.includes('wav')
          ? 'wav'
          : 'webm');

  const whisperModel = env.WHISPER_MODEL || 'whisper-large-v3-turbo';
  const boundary = '----HeyThere' + Math.random().toString(36).slice(2);
  const enc = new TextEncoder();
  const body = concatBytes([
    enc.encode(
      `--${boundary}\r\nContent-Disposition: form-data; name="model"\r\n\r\n${whisperModel}\r\n`,
    ),
    enc.encode(
      `--${boundary}\r\nContent-Disposition: form-data; name="response_format"\r\n\r\nverbose_json\r\n`,
    ),
    enc.encode(
      `--${boundary}\r\nContent-Disposition: form-data; name="timestamp_granularities[]"\r\n\r\nword\r\n`,
    ),
    enc.encode(
      `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: ${contentType}\r\n\r\n`,
    ),
    audio,
    enc.encode(`\r\n--${boundary}--\r\n`),
  ]);

  const r = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.GROQ_API_KEY}`,
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
    },
    body,
  });

  return text(await r.text(), r.status, 'application/json');
}
