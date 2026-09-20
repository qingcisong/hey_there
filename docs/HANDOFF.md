# Hey There — design handout

Everything decided so far, in one place, so the build can start without
re-deciding any of it. Written to be dropped in the repo root and read by
Claude Code before it touches a file.

**Entry:** Congressional App Challenge, FL-25. Video must be 1–3 minutes.
**Built by:** Suri, junior, American Heritage Schools.

---

# Part 1 — What we're making

## The product in one sentence

A voice-first check-in for the days that are a little off, but not off enough
to say out loud.

## The problem it sits in

There's a gap before help starts. Not crisis, not nothing — the ordinary days
where something feels wrong and doesn't clear the bar for telling anyone.
Two findings anchor it:

- Across 3,248 students in six public schools, Asian American youth reported
  the highest level of personal mental health treatment stigma of any racial or
  ethnic group in the sample. (Costello et al., *Children and Youth Services
  Review*, 2026, doi:10.1016/j.childyouth.2026.108836)
- 52% of Florida high school girls reported feeling sad or hopeless for two
  weeks or more. (Youth Risk Behavior Survey, Florida, 2021)

## Who it's for

High schoolers who wouldn't call a hotline and wouldn't book a therapist, but
would talk to a friend if a friend happened to be around.

## What it does

You call it. You talk about your day. It listens to *how* you say it, not just
what you say. It tells you what it noticed, you confirm or correct it, and then
it offers one small thing that might help right now.

## What it explicitly is not

Not therapy. Not a diagnosis. Not a mood tracker with a 1-to-10 slider. Not a
crisis service — when something goes past an ordinary bad day it stops
suggesting and shows 988.

## The four product rules

These are decisions, not preferences. Anything that violates one is a bug.

1. **The user gets the final say.** The app never files a read the user didn't
   confirm. Every read ends in three options: agree, deny, or "there's more."
2. **One suggestion at a time, never a list.** When you're tired, a list of
   options is just one more thing to decide.
3. **It never claims a read it can't support.** Fewer than three prior calls,
   or an energy score under threshold, and it says nothing about how you
   sounded. Silence beats a fabricated observation.
4. **It compares you to you.** No population averages anywhere. A slow, flat
   voice means completely different things depending on whose voice it is.

---

# Part 2 — The flow

Six screens. Each one does one job.

```
  Resting          Attentive/Calm        Thinking          face varies
  ┌───────┐         ┌───────┐           ┌───────┐          ┌───────┐
  │ Home  │ ──tap──▶│ Call  │ ──end────▶│Analyze│ ────────▶│ Read  │
  └───────┘         └───────┘           └───────┘          └───────┘
      ▲                  ▲                                      │
      │                  └───────── "not really" / "more" ──────┤
      │                                                         │
      │                                          "yeah" ────────┤
      │              Wink                                       ▼
      │            ┌────────┐                              ┌────────┐
      └────────────│  Done  │◀─────────────────────────────│Suggest │
                   └────────┘                              └────────┘
```

**Home.** Cloud Resting. "Hey there." / "Tap when you want to talk." One
button. The Resting face matters: it gives the app a visible state where it
isn't listening.

**Call.** Cloud wakes to Attentive, settles to Calm. Timer, low contrast. The
cloud switches between listening and talking rhythms as turns change. One quiet
"End call" pill. No red hangup circle — see Part 4.

**Analyze.** Cloud Thinking, dots, 1.9s sway. This screen exists because the
read genuinely takes a few seconds, and a face is better than a spinner.

**Read.** Cloud wears the face the algorithm chose. One serif sentence saying
what it noticed, one smaller line giving the evidence in plain words ("you're
speaking slower than usual, and you stopped a lot"). Three options underneath.

**Confirm branch.** "Yeah, pretty much" → suggestion. "Not really" or "Kind of,
but there's more" → back to listening. Never push a suggestion at someone who
just said you were wrong.

**Suggest.** Cloud Wink. One action, one reason, one button, plus a quiet "not
today." Then home.

---

# Part 3 — The cloud

The cloud is the whole interface. Everything else is text and one button.

## Silhouette

One path, three plumps, no mouth ever. White fill, 2.6px ink outline.

```
path: M56 120h92a33 33 0 0 0 3-66 45 45 0 0 0-86-12 29 29 0 0 0-9 78z
viewBox: 26 14 168 126
ink: #22384B
```

Do not rebuild this from circles. An earlier version used four overlapping
shapes so each lobe could wobble independently; it read as fat and lost the
hand-drawn line. The single path is the design.

## Eye geometry

```
left eye center   x = 92
right eye center  x = 126
eye baseline      y = 80
stroke            5px, round cap, round join, #22384B
```

## The twelve expressions

Each is built from a text-emoji shape, drawn as SVG paths — **not typed as font
glyphs**. Same stroke weight as the outline, and the control points are numbers
that can be animated between. A font character can't be.

| Face | Built from | When it appears |
|---|---|---|
| Calm | `◡ ◡` | Default while listening. The one you see most. |
| Happy | `^ ^` | Read came back good, or something lifted. |
| Delighted | `> <` | Bigger than happy, squeezed shut. Use rarely. |
| Wink | `> -` | Handing over the suggestion. Keeps it from sounding like an instruction. |
| Attentive | `o o` | Perked up. Also the wake frame when a call connects. |
| Thinking | `· ·` + rising dots | Between the user stopping and the read appearing. |
| Unsure | `¬ ¬` | **The mismatch face.** Words say fine, voice doesn't. |
| Concerned | brows over `o o` | Worried brows over open eyes. The strongest low-read face. |
| Angry | `\ - - /` + sweat drop | Flustered rather than furious. For the user's side of a story. |
| Sad | `T T` | Low read, confirmed. Follows a confirmation, never precedes one. |
| Dying | `x x` | Comic, not clinical. "That week was a lot." Never a real low read. |
| Resting | `- -` + zzz | Idle on home, before a call. |

### Three rules the set follows

**Symmetry.** Nine of twelve are one shape mirrored. Only Delighted, Wink, and
the three with accessories break it. That's what makes them one character
instead of a sticker pack. Keep the rule if you add more.

**Concerned is the exception, on purpose.** It's the only face with brows *and*
eyes — two features where every other face has one. That's why it's the
strongest, and also why it looks slightly out of family. Both are true. Keep it.

**Four registers.** Calm, Attentive, Thinking, Unsure are what the *app is
doing*. Happy, Concerned, Sad are what it thinks *you feel*. Delighted, Wink,
Dying are *tone*. Resting is *off*. Mixing registers is where a character starts
to feel incoherent.

### One open decision

Dying is a joke face. If it ever fires on a genuine low read it will land
badly. Decide whether it's reachable from the voice model at all, or only from
something the user types.

## Body rhythm

No mouth means tempo carries most of the emotion. Three rhythms, and they are
different *kinds* of motion, not just different speeds.

```
calm   period 2.6s   inflate .055  squash .030  bob 3.4  hop 0   sway 0    sink 0   tilt 0
happy  period 1.05s  inflate .040  squash .075  bob 0    hop 12  sway 3.4  sink -3  tilt 0
low    period 3.8s   inflate .026  squash .018  bob 2.0  hop 0   sway 1.2  sink 7   tilt -2.4°
```

Transform pivot is `(100, 118)` — bottom-center of the cloud, so squash reads as
weight on the ground:

```
translate(100,118) translate(0,dy) rotate(rot) scale(sx,sy) translate(-100,-118)
```

**Calm** breathes. Inflates vertically with the horizontal lagging 0.35 radians
behind, so it reads as filling up rather than zooming.

**Happy** hops. It leaves the ground (`dy -= hop · |sin(ph)|^0.62`), squashes
wider on contact, stretches taller in the air, and tilts side to side on a
slower half-cycle. You would know it was happy with the eyes covered.

**Low** does almost nothing. Sits 7px lower, slightly flattened, tilted 2.4°
down. The stillness is the signal.

### Mode overlays, layered on whichever rhythm is running

**Talking** — an 8.4Hz nod built from two overlapping sine rates so it doesn't
tick like a metronome:
```
sp = sin(t·8.4)·0.62 + sin(t·5.1 + 1.1)·0.38
dy += sp·3.4    sy += sp·0.030    rot += sp·1.5
```

**Thinking** — 1.9s sway at ±5°, plus a 0.95s vertical of ±1.4px.

### Rhythm-to-face mapping

Happy / Delighted / Wink → happy. Concerned / Sad / Dying / Resting → low.
Everything else → calm.

**Open:** Angry currently uses calm because neither of the others fits — the
happy hop reads as bouncing with joy, the low sink reads as defeated. Angry
probably wants a fourth rhythm: tight, fast, almost no travel. Build it as a
fourth entry, not as an edit to the existing three.

## Expression transitions — blink through `- -`

Faces never morph shape-to-shape. Every change squashes the eyes flat around
their own centerline, holds there, then opens into the new shape. The squash
*is* the `- -`. This works for shapes with nothing geometrically in common —
circles, crosses, brows, the T's vertical stroke.

```
170ms  squash shut, lid 1 → 0.06, easeInCubic
       current eyes fade out over the last 30%, flat line fades in
       accessories fade out over the first 60%
180ms  held flat. swap the eye paths here, while nothing is visible.
240ms  open, lid 0.06 → 1, easeOutBack (overshoot ≈1.25)
       new eyes fade in over the first 25%
       accessories fade in from 35% onward
```

The **held beat is doing most of the work**. Without it the whole thing reads as
a glitch instead of a blink.

**Accessories never squash.** Sweat drop, thinking dots, and zzz fade
separately, 90ms behind the eyes. A sweat drop squashed flat looks like a bug.

**Idle blink.** The same squash fires on its own every 4–7 seconds without
changing expression. Without it the face freezes between states, and a frozen
face under a breathing body looks wrong.

**Motion intensity** is a single global multiplier on dy, the scale deltas, and
rotation. Tuned to 1.0. Ship it as a constant, keep it adjustable during build.

Respect `prefers-reduced-motion`: hold the face, stop the body.

---

# Part 4 — Visual design

## Palette

```
ink / outline / type   #22384B
warm accent            #DFA05A
calm screen            #E9EFF3 → #D8E3EA   (vertical gradient)
happy screen           #F5EEE2 → #E9DAC3
low screen             #DEE6EC → #C4D2DE
```

Screen tint follows the read. Transition 1200ms — slow enough not to be noticed
as a change of state.

**Open question worth settling:** should the screen tint cool down on a low read
*before* the user has confirmed it? A visibly sadder screen can feel like the
app has made a diagnosis. Given rule 1, the tint arguably should hold neutral
until the user agrees.

## Type

Two families, clearly distinct. A serif for the app's own voice — the one
sentence the cloud says. A sans for everything the interface says about itself:
timers, options, labels. Numbers in a readout are the only place monospace
belongs, and only because they're measurements.

The serif line is the only large type on any screen. Everything else is small
and quiet.

## The call screen, and what was deliberately rejected

Soft gradient, cloud centered with generous space, one serif line, one small
supporting line, one low-contrast "End call" pill.

**No red hangup circle.** It's a telephone cliché that makes the screen feel
like a tool. A quiet outlined pill instead.

**No waveform bars.** They're a recorder cliché, they invite the user to read
the bars as data, and the cloud's breath already responds to voice level. If
live voice reactivity is wanted, feed the level into *breath amplitude*, not
into a visualizer — closer to a person leaning in than to a music player.

**No mood slider, no 1-to-10, no emoji picker.** The premise is that you talk.

---

# Part 5 — Technology design

## Architecture

One deployable. No Python service, no GPU, no cold starts.

```
BROWSER                                          SERVER (3 routes)
mic ─┬─> RTCPeerConnection ──> OpenAI Realtime   /realtime-token
     ├─> MediaRecorder     ──> webm blob          /transcribe   (Groq)
     └─> AnalyserNode      ──> YIN pitch          /moderate     (OpenAI)
              (never leaves the device)
```

End of call, behind the Thinking face: blob → Groq for word timestamps →
moderation → valence → local feature math → read.

Open-Meteo is keyless and CORS-friendly, so the browser calls it directly.

## The stack, and why each piece

| Layer | Choice | Reason |
|---|---|---|
| UI | Preact + Vite + Tailwind | Preact replaces React, **not** the framework. Something still has to hold keys. |
| Conversation | OpenAI Realtime API, WebRTC | The "feels like a call" premise. Ephemeral client secret, never the real key in the browser. |
| Transcription | Groq `whisper-large-v3-turbo` | Word-level timestamps, OpenAI-compatible, ~216x realtime so it fits inside the Thinking face. |
| Pitch | YIN in the browser | On-device, free, no server. Also the privacy story. |
| Valence | Groq `llama-3.3-70b-versatile` | Cheap JSON call over the transcript. |
| Safety | OpenAI Moderation | Free. Non-negotiable. |
| Weather | Open-Meteo | Keyless, CORS-friendly, hourly forecast. |
| Baseline | localStorage for the prototype | No Firebase, no auth. Per-browser, resets on clear. |

## Realtime API — the three things that break first

1. **GA endpoints differ from the beta.** Mint at
   `POST /v1/realtime/client_secrets`. Drop the `OpenAI-Beta: realtime=v1`
   header. Post the raw SDP offer to `POST /v1/realtime/calls` with
   `Content-Type: application/sdp`. Data channel must be named exactly
   `oai-events`.
2. **Mint the secret immediately before connecting.** Short-lived by design.
   Caching one is the usual cause of intermittent 401s.
3. **Use `semantic_vad`, not `server_vad`.** Server VAD ends a turn on silence,
   which means it interrupts people for pausing — and pausing is the signal
   being measured. Set `eagerness: 'low'`.

## The audio tee

One `getUserMedia` stream fans out three ways. The analyser is deliberately
**not** connected to `ctx.destination` — connecting it feeds the mic back
through the speakers. This is the step people forget, and the symptom is
"the Realtime API owns my mic and I have nothing to analyze."

## What was considered and cut

**SenseVoice / FunASR.** The original plan. Cut because it outputs a
*categorical* emotion label — happy, sad, angry, neutral, fearful, disgusted,
surprised — and not speaking rate, pitch movement, or pause length. A
categorical label is exactly the one-size-fits-all standard this app exists to
avoid: the model has no idea what *your* neutral sounds like. It's also PyTorch,
which forces a second Python deployable. Optionally revisit as a cheap second
opinion, never as the differentiator.

**Google Calendar.** OAuth verification for a sensitive scope is a week that
isn't available. "What your week has looked like" comes from local call history
instead.

**shadcn/ui.** Radix is React-only, and the UI is custom anyway.

**Firebase + auth.** Not needed for a prototype. If it comes back, use anonymous
auth — no teen email addresses.

---

# Part 6 — The algorithm

This is the part that is Suri's own work, and the part the video is about.

## Stage 1 — raw measures

From Groq word timestamps:

```
voicedSec  = Σ(word.end − word.start)
rate       = wordCount / voicedSec
gaps       = word[i].start − word[i−1].end,  kept if > 0.30s
pauseRatio = Σgaps / span
longPauses = count(gap > 1.0s) per minute
```

**Rate divides by voiced seconds, not wall-clock.** Wall-clock folds pausing
into rate, and pausing is already its own feature — so wall-clock counts the
same behavior twice and makes the two features artificially correlated.

From the on-device pitch tracker: F0 converted to semitones relative to the
call's own median, then **P90 − P10**, not standard deviation. One surviving
octave error moves an SD a lot and a percentile spread almost not at all.

Pitch tracking details: YIN, search clamped to 70–320 Hz (kills most octave
errors before they happen), probability threshold to reject unvoiced frames,
40ms sampling, median filter of width 5.

**Filled pauses (`um`, `uh`) are measured and reported but excluded from the
score.** Whisper deletes disfluencies inconsistently even with a verbatim
prompt, so a high number is real evidence and a low number is no evidence at
all. Asymmetric evidence shouldn't feed a symmetric z-score.

## Stage 2 — normalize against the person

Each feature becomes a z-score against that user's own last 12 calls. Winsorize
to ±3 so one weird call shifts the read rather than defining it.

**Floor the spread before dividing by it:**

```
FLOOR = { rate: 0.25, pauseRatio: 0.04, pitchSpread: 0.5 }
spread = max(sd, FLOOR[key])
```

This was a real bug found in testing. A feature that barely varied across recent
calls breaks a raw z-score in both directions: at sd≈0 it divides by nothing and
explodes, and guarding that with `return 0` makes the feature silently stop
counting *at exactly the moment it changes most*. Someone who never paused all
week and then pauses constantly today is the most informative case there is, and
the naive version scores it zero.

## Stage 3 — collapse to energy

```
timing = mean(zRate, −zPause)
energy = 0.6 · timing + 0.4 · zPitch
```

Rate and pause both come from the same timestamps and move together. Averaging
all three z-scores equally would weight timing twice and intonation once, by
accident rather than by decision.

## Stage 4 — valence, from the words

Timing gives you *energy*, never *direction*. Slow with long pauses is tired,
sad, calm, or thinking carefully, and no signal processing separates those four.
A cheap LLM pass over the transcript returns valence in [−1, 1], judging content
only and explicitly ignoring fluency.

## Stage 5 — the mismatch detector

**This is the core of the app.**

```
if energy < −1.2 and valence ≥ −0.15  →  Unsure
   "You talked about your day like it was fine."
   "But you're speaking slower than usual, and you stopped a lot."
```

The words are fine. The voice is not. Note that it *asks* rather than concludes
— everything downstream waits on the user's answer.

## Stage 6 — thresholds, quadrants, safety

```
MIN_HISTORY  3      fewer, and it says nothing about how you sounded
ASSERT       1.0    |energy| below this is not a read
MISMATCH     1.2
```

Ordinary quadrants: low + negative → Sad. Low + neutral → Concerned. High +
positive → Happy. High + negative → Angry. Otherwise Attentive.

**Safety overrides everything above it.** Moderation runs on the transcript,
server-side, independently of whatever the conversational model decides. It is a
hard interrupt — no suggestion, no confirmation, no "was I right?" It **fails
closed**: if the API errors, treat as flagged.

The evidence sentence says what was measured in words the person can check
against their own experience. "You're speaking slower than usual" is checkable.
"Your affect is blunted" is not, and isn't ours to say.

---

# Part 7 — Known limits

State these plainly. A judge who finds one you didn't mention is worse than one
you named yourself.

1. **No baseline before ~3 calls.** One minute gives one sample; variance from a
   single observation is meaningless. The app says "still learning what your
   normal sounds like" rather than inventing a comparison.
2. **Calibration mode ≠ conversation mode.** If the first minute is scripted
   reading and later calls are free speech, the baseline is biased fast. Free
   reading is more fluent than free talking. Calibrate on free speech, or let
   the rolling window correct it.
3. **Whisper deletes disfluencies.** Silent pauses survive in the timestamps and
   are reliable. Filled pauses are not.
4. **Word timestamps are ±100–200ms.** Fine at a 300ms threshold, useless finer.
5. **Browser AGC flattens dynamics**, biasing pitch spread down. The baseline is
   recorded under the same processing, so it largely cancels.
6. **Energy is not mood.** The app is explicit about this in its own copy.
7. **localStorage is per-browser.** Clearing site data resets the baseline.
8. **Realtime audio bills per minute.** Cap call length.

---

# Part 8 — Build order

Ordered so that each step is testable before the next one exists.

1. **Cloud component.** Twelve faces, three rhythms, blink-through, idle blink.
   No APIs. *Done when:* you can cycle all twelve and each transition passes
   visibly through `- -`.
2. **Screen shell.** The six screens with hardcoded copy and a fake read.
   *Done when:* you can walk the whole flow with buttons.
3. **Pitch tracker, offline.** YIN against an uploaded audio file, printing
   semitone spread. *Done when:* reading a sentence flatly vs expressively
   produces visibly different numbers.
4. **Groq transcription.** Word timestamps → rate, pauseRatio, longPauses.
   *Done when:* a deliberately slow, pausing clip scores lower rate and higher
   pause ratio than a normal one.
5. **Baseline + energy + read.** Wire stages 2–6. *Done when:* the mismatch case
   fires — four normal clips, then one where you say your day was fine while
   speaking slowly, produces Unsure.
6. **Moderation gate.** Before any conversation work. *Done when:* a flagged
   transcript reaches 988 with no suggestion and no confirmation.
7. **Realtime call.** The mic tee and WebRTC handshake. Last because it's the
   hardest to debug and everything else is testable without it.
8. **Weather + suggestion.** Smallest piece, genuinely last.

**Do not build in the order the user experiences.** The conversation is the most
visible part and the least informative to build first — if the analysis half
doesn't work, a working call is a demo of somebody else's API.

---

# Part 9 — The video script

Three minutes maximum. This is the actual deliverable; the app exists to make it
true.

**Intro (~50s).** Name, school, app name. "When people ask how I'm doing, I say
I'm fine." The two statistics. The gap before help starts. What Hey There is and
who it's for.

**Demo (~1:25).** Starts with a phone call. First minute learns your normal.
*If you type, you edit* — when you talk, you hesitate, you pause, you reach for
a word, and that's part of what it reads. The avatar reacting. The reflection.
*Voice gives clues, not conclusions* — so you get the final say. Then one thing
to try: weather, location, what your week looked like, four clear hours ahead,
so a walk. In Florida "it's sunny" has a shelf life of about ten minutes.
One suggestion at a time, because when you're tired a list is one more decision.

**Tech (~40s).** The stack in one sentence. *"Let me show you one piece of it —
how it reads your voice."* The baseline. Compared to you, not to an average
person. A slow, flat voice means completely different things depending on whose
voice it is. The privacy sentence. The 988 line.

**Close (~12s).** "It's not therapy. It's built for the slightly-off day you'd
mention to a friend — if a friend happened to be around." Then the app:
*"Hey there."*

## Still to write

**The privacy sentence.** One line, specific, describing what the code actually
does: whether audio is uploaded or processed and discarded, what's stored (the
baseline numbers, not recordings), for how long. Specific beats reassuring.
Don't write a promise the code doesn't keep.

---

# Part 10 — What already exists

| Artifact | What it is |
|---|---|
| Pitch deck, 16 slides | Problem, data, mockups, tech, baseline, 988, close. Has a script-notes toggle. |
| Cloud motion study | Live playground: three rhythms, three modes, intensity slider. |
| Expression chart | All twelve faces, static, with usage notes. |
| Prototype repo | Vite + Preact, dev-proxy backend, full pipeline. Builds clean. |
| Lab artifact | Key entry, text chat, clip-upload pipeline with a numeric readout. |

## Open decisions, collected

1. Does Angry get a fourth rhythm?
2. Is Dying reachable from the voice model, or only from typed input?
3. Does the screen tint change before the user confirms the read?
4. Is the calibration minute scripted or free speech?
5. What exactly does the privacy sentence say?
