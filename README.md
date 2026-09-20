# Hey There

A voice-first check-in for the days that are a little off but not off enough
to say out loud. Congressional App Challenge FL-25 entry by Suri, junior at
American Heritage Schools.

See [`docs/HANDOFF.md`](docs/HANDOFF.md) for the full product design,
[`docs/SCRIPT.md`](docs/SCRIPT.md) for the video script.

## Quick start

```sh
cp env.template .env        # then fill in the three required keys
npm start                    # http://localhost:3000
```

You'll be asked for the access code you set in `.env` (once per browser),
then the mic and location permissions.

## Environment variables

Copy `env.template` → `.env` and fill in:

| Key | What it's for |
|-----|----------------|
| `OPENAI_API_KEY` | Realtime API — the voice call itself |
| `GROQ_API_KEY` | whisper-large-v3-turbo for word timestamps; gpt-oss-20b for valence |
| `HEYTHERE_ACCESS_CODE` | Any string — the gate that stops random visitors from burning your tokens. Rotate to invalidate everyone's session. |

Optional overrides: `PORT`, `REALTIME_MODEL`, `WHISPER_MODEL`, `VALENCE_MODEL`.

## Structure

```
hey-there/
├── server.js              Node http server: token mint, transcribe, valence,
│                          verify-code, /log persistence, static serve
├── package.json
├── env.template           .env template — copy to .env and fill in
├── prompts/
│   └── sop.md             The system prompt (loaded by server.js AND test-sop.js)
├── public/                Everything the browser loads
│   ├── call.html          The app itself
│   ├── recordings.html    Recording review + baseline browser (/recordings)
│   └── lib/
│       ├── yin.js         In-browser YIN pitch detector
│       └── store.js       IndexedDB + feature math + z-scores + mismatch
├── docs/                  Design + reference (not served)
│   ├── HANDOFF.md         The full design brief
│   ├── SCRIPT.md          The video script
│   ├── hey-there-deck.html  16-slide pitch deck
│   └── cloud-motion.html    Cloud avatar motion study
├── scripts/
│   └── test-sop.js        SOP prompt harness — see below
└── logs/                  Per-call event logs (gitignored, only when running the Node server)
```

## Iterating the SOP prompt

The system prompt lives in **`prompts/sop.md`** as plain markdown. It is loaded
at startup by both `server.js` (for the Realtime session) and
`scripts/test-sop.js` (for text-only iteration). To change the AI's behaviour,
edit `prompts/sop.md` and restart the server — no code change, no rebuild.

Iterating live requires speaking into a mic each time, which is slow. Instead:

```sh
npm run test:sop                                        # all scenarios
node --env-file=.env scripts/test-sop.js happy          # one scenario
node --env-file=.env scripts/test-sop.js sad_open rainy_evening  # scenario + weather ctx
```

The harness runs the prompt through the Chat Completions API against
scripted scenarios (`happy`, `fake_fine`, `silent`, `sad_open`, `angry`,
`safety`) with mock context fixtures (`sunny_afternoon`, `rainy_evening`,
`night`). When the SOP behaves right in text, the same `prompts/sop.md` file
gets used by the Realtime server — no copy-paste needed.

## Deployment

This app **cannot run on GitHub Pages alone** — it needs a server to hold the
API keys (otherwise anyone can view-source and take them).

### Cloudflare Pages (recommended)

The repo is already wired for Cloudflare Pages:

- Static UI from `public/`
- API routes as Pages Functions in `functions/` (`/verify-code`, `/realtime-token`, `/transcribe`, `/valence`, `/log`)

**One-time setup in the Cloudflare dashboard:**

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Select the `qingcisong/hey_there` GitHub repo.
3. Build settings:
   - **Framework preset:** None
   - **Build command:** *(leave empty)*
   - **Build output directory:** `public`
4. Click **Save and Deploy**.
5. After the first deploy: **Settings** → **Variables and Secrets** → add these for **Production** (and Preview if you want):

   | Name | Type | Value |
   |------|------|--------|
   | `OPENAI_API_KEY` | Secret | your OpenAI key |
   | `GROQ_API_KEY` | Secret | your Groq key |
   | `HEYTHERE_ACCESS_CODE` | Secret | your access code |

6. **Redeploy** once after adding secrets (Deployments → … → Retry deployment), otherwise Functions still run without keys.
7. Open `https://<project>.pages.dev`, enter the access code, and try a call.

**Custom domain (optional):** Pages → your project → **Custom domains** → add `heythere.qingcisong.com`. Cloudflare will tell you the DNS records to set (usually a CNAME to your `*.pages.dev` host). Point DNS there instead of GitHub Pages if you want this to be the live site.

**Local Cloudflare preview:**

```sh
npx wrangler pages dev public --compatibility-date=2025-09-01
# secrets: create .dev.vars (gitignored) with the same three keys as .env
```

### Other options

- **Vercel** — same idea with serverless functions.
- **Local Node:** `npm start` with a `.env` (uses `server.js`).

## What's built

1. Home + Call flow with the cloud avatar (12 faces, 3 body rhythms,
   blink-through transitions, 1500ms min face hold)
2. WebRTC voice conversation via OpenAI Realtime (`gpt-realtime`)
3. AI-initiated opener; the cloud starts talking
4. `express_feeling` tool → cloud face; `end_call` tool → auto-hangup
5. 8s silence watchdog with 3-strike auto-hangup
6. Live status strip above "End call": emoji from AI's user_feeling +
   pace/pause/pitch/valence with z-scores vs. the user's last 12 turns +
   mismatch callout
7. Real location + Open-Meteo weather + local time injected into the AI's
   context on every call
8. Full call recording + per-turn analysis via Groq whisper + valence via
   Groq llama, persisted to IndexedDB
9. `/debug` — recording review, playback, re-analyze against current thresholds
10. Access-code gate on all four API endpoints

Not yet built: Analyze/Read/Suggest screens (design in HANDOFF.md Part 2),
988 crisis flow is currently spoken by the AI but the client doesn't show
the number visually.

## Files that aren't sensitive but you might want to keep private

`docs/` includes the actual pitch deck. If you fork this repo publicly and
don't want the deck out there, `.gitignore` `docs/hey-there-deck.html`
before pushing.
