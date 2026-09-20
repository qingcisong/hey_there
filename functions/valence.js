import { checkAccess, json, text } from './_lib/access.js';

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!checkAccess(request, env)) {
    return json({ error: 'invalid access code' }, 403);
  }
  if (!env.GROQ_API_KEY) {
    return text('missing GROQ_API_KEY', 500);
  }

  let transcript = '';
  try {
    const body = await request.json();
    transcript = body.transcript || '';
  } catch {
    /* ignore */
  }

  if (!transcript.trim()) {
    return json({ valence: 0, note: 'empty transcript' });
  }

  const model = env.VALENCE_MODEL || 'openai/gpt-oss-20b';
  const prompt = `Rate the emotional valence of this speech, judging content only. Ignore fluency, filler words, and how it was said.
Return strict JSON: {"valence": number in [-1,1], "note": "one short phrase"}. -1=very negative, 0=neutral, +1=very positive.

Transcript:
${transcript}`;

  const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.1,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'You output only JSON.' },
        { role: 'user', content: prompt },
      ],
    }),
  });

  const j = await r.json();
  let parsed = { valence: 0, note: '' };
  try {
    parsed = JSON.parse(j.choices[0].message.content);
  } catch {
    /* ignore */
  }
  if (typeof parsed.valence !== 'number') parsed.valence = 0;
  parsed.valence = Math.max(-1, Math.min(1, parsed.valence));
  return json(parsed);
}
