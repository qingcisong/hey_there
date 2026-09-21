# Hey There — final video script

Congressional App Challenge, FL-25 · Suri, junior, American Heritage Schools

Target 2:50. Hard ceiling 3:00 — the rules say 1–3 minutes and judges can
penalize at their discretion. Spoken text below is ~475 words; everything in
〔brackets〕 is a stage direction, not read aloud.

---

## Intro — ~50 seconds

Hi, I'm Suri, a junior at American Heritage Schools. This is Hey There.

When people ask how I'm doing, I say "I'm fine." Tired, maybe a little
overwhelmed — but not serious enough to bring up.

I thought that was just me. In a study of over three thousand students, Asian
American teens reported more stigma around seeking mental help than any other
racial or ethnic group. And in Florida, more than half of high school girls
report feeling sad or hopeless for two weeks or more.

So there's a gap before help starts: the ordinary days when something feels off,
but not off enough to say out loud.

Hey There is for teenagers on those days. You talk through your day, it listens
to how you say it — not just what you say — and offers one small thing that
might help.

---

## Demo — ~1 minute 25 seconds

Hey There starts with a phone call. The first time, it listens for a minute to
learn my normal voice, pace, and pauses. After that, I just talk.

〔12–15 seconds of real audio: say how your day is going, with natural
hesitation, pauses, and the search for a word. The subtitles and avatar react on
screen while you're talking.〕

When you type, you edit. When you talk, you hesitate, you pause, you reach for a
word — and that's part of what it reads. The cloud reacts while I'm still
speaking: less like typing into a box, more like someone's listening.

When I stop, it tells me what it noticed.

〔On screen〕 *You said it was a long day — and you're talking slower than usual,
with longer pauses than normal.*

It isn't guessing the opposite of what I said. It's telling me how much. So I
get the final say: agree, correct it, or say there's more.

〔on screen: the mismatch / agree / correct prompts〕

And when the two don't line up — I say I'm fine, but I sound flat — it doesn't
overrule me. It says so, and asks.

〔On screen〕 *That didn't quite match how you sounded. Did I read that wrong?*

Then it offers one thing to try. It looks at the weather, where I am, and what
my week has looked like, and picks what fits right now. Today it sees four clear
hours ahead, so it suggests a walk — in Florida, "it's sunny" has a shelf life
of about ten minutes, so it checks the next few hours, not this second. If it
were raining, or if I'd been alone all week, it'd pick something else.

One suggestion at a time. When you're tired, a list of options is just one more
thing to decide.

---

## Technology — ~40 seconds

Hey There is built as a browser app with a static frontend and Cloudflare Pages
Functions handling the server side. The live conversation runs through OpenAI's
Realtime API, Groq handles speech-to-text and the text side of the read, and
Open-Meteo supplies the user's local weather and next-hours forecast.

Let me show you one piece of it — how it reads your voice.

A local pitch engine analyzes the speech on-device, and the transcript comes back
with word-level timestamps — so I can measure three things: how fast you're
speaking, how far your pitch moves, and how long you pause. Then that gets
compared against what the words actually said. 〔privacy sentence〕

The first minute is a calibration. Everything after that is measured against
your own baseline, not a generic average. That's why a slow, flat voice can mean
something completely different depending on whose voice it is.

And if what someone says goes past an ordinary bad day, it stops suggesting and
shows the 988 line.

---

## Close — ~12 seconds

It's not therapy. It's built for the slightly-off day you'd mention to a friend —
if a friend happened to be around.

〔The app, out loud〕 *Hey there.*

---

# Notes

## Two blanks left to fill

**〔framework〕** — depends on the build decision. If you drop the framework
entirely, "vanilla JavaScript" is the stronger line here: it says you wrote it
rather than configured it.

**〔privacy sentence〕** — one sentence, written after the code exists, saying
what actually happens: whether audio is uploaded or processed and discarded,
what's stored (the baseline numbers, not recordings), and for how long. Specific
beats reassuring. Don't write a promise the code doesn't keep.

## Why the tech section is worded the way it is

The earlier draft said "the part I wrote myself is the voice read," which
implied it was the *only* part you wrote. "Let me show you one piece of it"
frames the same material as a sample rather than a total — it suggests there's
more without needing to list it. Going deep on one thing shows more than three
shallow mentions would.

The AI-assistance disclosure was cut from the video. The submission form asks
about it separately; answering it fully there is enough.

## Repetitions removed from the earlier draft

Three pieces of information were each appearing two or three times, because
every feature was walking through demo → technical explanation → defense. The
fix was dividing the work: the demo section covers experience only, the tech
section adds why it works, and the defensive material is gone.

- **The baseline** appeared three times. Now: one experiential line in the demo,
  one substantive explanation in the tech section.
- **The Florida weather line** appeared twice, nearly word for word. Kept once.
- **"This isn't therapy"** appeared twice. Kept once, at the end, where it lands.

## Timing check

If you run long, cut from the intro first. The two statistics can become one —
the Florida number is the stronger of the pair for a Florida district. Don't cut
the baseline paragraph; it's the part that's yours.
