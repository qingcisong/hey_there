import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { extname, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), 'public');
const PORT = process.env.PORT || 3000;
const REALTIME_MODEL = process.env.REALTIME_MODEL || 'gpt-realtime';
const WHISPER_MODEL  = process.env.WHISPER_MODEL  || 'whisper-large-v3-turbo';
const VALENCE_MODEL  = process.env.VALENCE_MODEL  || 'openai/gpt-oss-20b';
const OPENAI_KEY = process.env.OPENAI_API_KEY;
const GROQ_KEY   = process.env.GROQ_API_KEY;
const ACCESS_CODE = process.env.HEYTHERE_ACCESS_CODE || '';

if (!OPENAI_KEY) { console.error('Missing OPENAI_API_KEY'); process.exit(1); }
if (!GROQ_KEY)   { console.warn('Warning: GROQ_API_KEY missing — /transcribe and /valence will 500.'); }
if (!ACCESS_CODE) console.warn('Warning: HEYTHERE_ACCESS_CODE missing — endpoints are UNGATED. Set it in .env.');

// The system prompt lives in prompts/sop.md so it can be edited without touching
// code and without a rebuild. Loaded synchronously at startup.
const HERE = dirname(fileURLToPath(import.meta.url));
const INSTRUCTIONS = readFileSync(join(HERE, 'prompts', 'sop.md'), 'utf8').trim();

const FEELING_TOOL = {
  type: 'function',
  name: 'express_feeling',
  description: 'Call BEFORE speaking each response. Reports how you perceive the user and your own state.',
  parameters: {
    type: 'object',
    properties: {
      user_feeling: {
        type: 'string',
        enum: ['happy', 'concerned', 'sad', 'unsure', 'unknown'],
        description: 'happy=lifted; concerned=heavy; sad=low+confirmed; unsure=words say fine but voice does not match; unknown=user has not spoken yet, no read possible',
      },
      self_feeling: {
        type: 'string',
        enum: ['calm', 'attentive', 'thinking', 'delighted', 'wink', 'dying'],
        description: 'calm=default listening; attentive=perked up; thinking=composing; delighted=rare big joy; wink=handing over a suggestion; dying=comic tired, rare',
      },
      primary: {
        type: 'string',
        enum: ['user', 'self'],
        description: 'Which face to display now',
      },
    },
    required: ['user_feeling', 'self_feeling', 'primary'],
  },
};

const END_CALL_TOOL = {
  type: 'function',
  name: 'end_call',
  description: 'Call to end the check-in call. Client tears down the call after your farewell audio finishes.',
  parameters: {
    type: 'object',
    properties: {
      reason: {
        type: 'string',
        enum: ['complete', 'unresponsive', 'safety'],
        description: 'complete=natural end after one suggestion; unresponsive=3 silences; safety=after 988 handoff',
      },
    },
    required: ['reason'],
  },
};

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
};

async function readBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return Buffer.concat(chunks);
}

// Access-code gate. Returns true if the request is allowed to proceed.
// When ACCESS_CODE is unset (dev), everything passes but a warning was logged at boot.
function checkAccess(req, res) {
  if (!ACCESS_CODE) return true;
  const provided = req.headers['x-access-code'];
  if (typeof provided === 'string' && provided.length && provided === ACCESS_CODE) return true;
  res.writeHead(403, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'invalid access code' }));
  return false;
}

async function verifyCode(req, res) {
  const raw = await readBody(req);
  let code = ''; try { code = JSON.parse(raw.toString('utf8')).code || ''; } catch {}
  const ok = !!ACCESS_CODE && code === ACCESS_CODE;
  res.writeHead(ok ? 200 : 403, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ ok, gated: !!ACCESS_CODE }));
}

async function mintToken(res) {
  const r = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      session: {
        type: 'realtime',
        model: REALTIME_MODEL,
        instructions: INSTRUCTIONS,
        tools: [FEELING_TOOL, END_CALL_TOOL],
        tool_choice: 'auto',
        audio: {
          input:  { turn_detection: { type: 'semantic_vad', eagerness: 'low' } },
          output: { voice: 'marin' },
        },
      },
    }),
  });
  const body = await r.text();
  res.writeHead(r.status, { 'Content-Type': 'application/json' });
  res.end(body);
}

async function transcribe(req, res) {
  if (!GROQ_KEY) { res.writeHead(500); res.end('missing GROQ_API_KEY'); return; }
  const audio = await readBody(req);
  const contentType = req.headers['content-type'] || 'audio/webm';
  const filename = 'clip.' + (contentType.includes('webm') ? 'webm' :
                              contentType.includes('mp4')  ? 'm4a'  :
                              contentType.includes('wav')  ? 'wav'  : 'webm');

  const boundary = '----HeyThere' + Math.random().toString(36).slice(2);
  const enc = new TextEncoder();
  const parts = [
    enc.encode(`--${boundary}\r\nContent-Disposition: form-data; name="model"\r\n\r\n${WHISPER_MODEL}\r\n`),
    enc.encode(`--${boundary}\r\nContent-Disposition: form-data; name="response_format"\r\n\r\nverbose_json\r\n`),
    enc.encode(`--${boundary}\r\nContent-Disposition: form-data; name="timestamp_granularities[]"\r\n\r\nword\r\n`),
    enc.encode(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: ${contentType}\r\n\r\n`),
    audio,
    enc.encode(`\r\n--${boundary}--\r\n`),
  ];
  const body = Buffer.concat(parts.map(p => Buffer.from(p)));

  const r = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GROQ_KEY}`,
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
    },
    body,
  });
  const text = await r.text();
  res.writeHead(r.status, { 'Content-Type': 'application/json' });
  res.end(text);
}

async function valence(req, res) {
  if (!GROQ_KEY) { res.writeHead(500); res.end('missing GROQ_API_KEY'); return; }
  const raw = await readBody(req);
  let transcript = '';
  try { transcript = JSON.parse(raw.toString('utf8')).transcript || ''; } catch {}
  if (!transcript.trim()) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ valence: 0, note: 'empty transcript' }));
    return;
  }
  const prompt = `Rate the emotional valence of this speech, judging content only. Ignore fluency, filler words, and how it was said.
Return strict JSON: {"valence": number in [-1,1], "note": "one short phrase"}. -1=very negative, 0=neutral, +1=very positive.

Transcript:
${transcript}`;

  const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GROQ_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: VALENCE_MODEL,
      temperature: 0.1,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'You output only JSON.' },
        { role: 'user',   content: prompt },
      ],
    }),
  });
  const j = await r.json();
  let parsed = { valence: 0, note: '' };
  try { parsed = JSON.parse(j.choices[0].message.content); } catch {}
  if (typeof parsed.valence !== 'number') parsed.valence = 0;
  parsed.valence = Math.max(-1, Math.min(1, parsed.valence));
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(parsed));
}

// POST /log — persist a call's event log to disk under ../logs/<callId>.json.
// Client fires this from teardown; if the server isn't available (e.g. static
// hosting) it just 404s and the client moves on.
const LOGS_DIR = join(dirname(fileURLToPath(import.meta.url)), 'logs');
async function saveLog(req, res) {
  const raw = await readBody(req);
  let body; try { body = JSON.parse(raw.toString('utf8')); } catch {
    res.writeHead(400); res.end('bad json'); return;
  }
  const rawId = String(body.callId || 'unknown_' + Date.now());
  const safeId = rawId.replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 80);
  await mkdir(LOGS_DIR, { recursive: true }).catch(() => {});
  const file = join(LOGS_DIR, `${safeId}.json`);
  try {
    await writeFile(file, JSON.stringify(body, null, 2));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, file: `logs/${safeId}.json` }));
  } catch (e) {
    console.error('log write failed:', e);
    res.writeHead(500); res.end('write failed');
  }
}

async function serveStatic(url, res) {
  const path = url === '/' ? 'call.html' : url.replace(/^\/+/, '');
  if (path.includes('..')) { res.writeHead(400); res.end('bad path'); return; }
  try {
    const body = await readFile(join(ROOT, path));
    res.writeHead(200, { 'Content-Type': MIME[extname(path)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('not found');
  }
}

const server = createServer(async (req, res) => {
  try {
    if (req.method === 'POST' && req.url === '/verify-code')    return verifyCode(req, res);
    if (req.method === 'POST' && req.url === '/realtime-token') {
      if (!checkAccess(req, res)) return;
      return mintToken(res);
    }
    if (req.method === 'POST' && req.url === '/transcribe') {
      if (!checkAccess(req, res)) return;
      return transcribe(req, res);
    }
    if (req.method === 'POST' && req.url === '/valence') {
      if (!checkAccess(req, res)) return;
      return valence(req, res);
    }
    if (req.method === 'POST' && req.url === '/log') {
      if (!checkAccess(req, res)) return;
      return saveLog(req, res);
    }
    if (req.method === 'GET' && req.url.startsWith('/recordings')) return serveStatic('/recordings.html', res);
    if (req.method === 'GET' && req.url.startsWith('/debug'))       return serveStatic('/recordings.html', res);
    if (req.method === 'GET')                                        return serveStatic(req.url.split('?')[0], res);
    res.writeHead(405); res.end('method not allowed');
  } catch (e) {
    console.error(e);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: String(e) }));
  }
});

server.listen(PORT, () => console.log(`Hey There — http://localhost:${PORT}`));
