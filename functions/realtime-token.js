import { checkAccess, json, text } from './_lib/access.js';
import { INSTRUCTIONS } from './_lib/instructions.js';
import { FEELING_TOOL, END_CALL_TOOL } from './_lib/tools.js';

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!checkAccess(request, env)) {
    return json({ error: 'invalid access code' }, 403);
  }
  if (!env.OPENAI_API_KEY) {
    return text('missing OPENAI_API_KEY', 500);
  }

  const model = env.REALTIME_MODEL || 'gpt-realtime';
  const r = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      session: {
        type: 'realtime',
        model,
        instructions: INSTRUCTIONS,
        tools: [FEELING_TOOL, END_CALL_TOOL],
        tool_choice: 'auto',
        audio: {
          input: { turn_detection: { type: 'semantic_vad', eagerness: 'low' } },
          output: { voice: 'marin' },
        },
      },
    }),
  });

  const body = await r.text();
  return text(body, r.status, 'application/json');
}
