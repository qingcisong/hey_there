// YIN pitch detector, tuned for speech.
// de Cheveigné & Kawahara, 2002. Clamped to 70–320 Hz, median-filtered width 5.

export const YIN_MIN_HZ = 70;
export const YIN_MAX_HZ = 320;
const THRESHOLD = 0.15;

export function estimatePitch(buffer, sampleRate) {
  const N = buffer.length;
  const halfN = Math.floor(N / 2);
  const maxTau = Math.min(Math.floor(sampleRate / YIN_MIN_HZ), halfN);
  const minTau = Math.max(2, Math.ceil(sampleRate / YIN_MAX_HZ));
  if (maxTau <= minTau) return { hz: 0, probability: 0 };

  const d = new Float32Array(maxTau + 1);
  for (let tau = 1; tau <= maxTau; tau++) {
    let sum = 0;
    for (let i = 0; i < halfN; i++) {
      const diff = buffer[i] - buffer[i + tau];
      sum += diff * diff;
    }
    d[tau] = sum;
  }

  const dp = new Float32Array(maxTau + 1);
  dp[0] = 1;
  let running = 0;
  for (let tau = 1; tau <= maxTau; tau++) {
    running += d[tau];
    dp[tau] = running === 0 ? 1 : d[tau] * tau / running;
  }

  let tau = -1;
  for (let t = minTau; t <= maxTau; t++) {
    if (dp[t] < THRESHOLD) {
      while (t + 1 <= maxTau && dp[t + 1] < dp[t]) t++;
      tau = t;
      break;
    }
  }
  if (tau === -1) return { hz: 0, probability: 0 };

  const x0 = Math.max(minTau, tau - 1);
  const x2 = Math.min(maxTau, tau + 1);
  let refined = tau;
  if (x0 !== tau && x2 !== tau) {
    const s0 = dp[x0], s1 = dp[tau], s2 = dp[x2];
    const denom = 2 * (2 * s1 - s2 - s0);
    if (denom !== 0) refined = tau + (s2 - s0) / denom;
  }

  const hz = sampleRate / refined;
  const probability = 1 - dp[tau];
  if (hz < YIN_MIN_HZ || hz > YIN_MAX_HZ) return { hz: 0, probability: 0 };
  return { hz, probability };
}

export function median(arr) {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export function percentile(arr, p) {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const idx = (s.length - 1) * p;
  const lo = Math.floor(idx), hi = Math.ceil(idx);
  return s[lo] + (s[hi] - s[lo]) * (idx - lo);
}

export class PitchTracker {
  constructor({ ctx, source, onFrame } = {}) {
    this.ctx = ctx;
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 2048;
    this.buf = new Float32Array(this.analyser.fftSize);
    source.connect(this.analyser);
    this.onFrame = onFrame || (() => {});
    this.frames = [];
    this.recent = [];
    this.median5 = [];
    this.callMedianHz = 0;
    this.rollingFrames = 125; // ~5s at 40ms
    this.timer = null;
  }

  start() {
    if (this.timer) return;
    this.timer = setInterval(() => this._tick(), 40);
  }

  stop() {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
  }

  reset() {
    this.frames = []; this.recent = []; this.median5 = []; this.callMedianHz = 0;
  }

  _tick() {
    this.analyser.getFloatTimeDomainData(this.buf);
    const { hz } = estimatePitch(this.buf, this.ctx.sampleRate);
    this.median5.push(hz);
    if (this.median5.length > 5) this.median5.shift();
    const smoothed = this.median5.length >= 3 ? median(this.median5.filter(v => v > 0)) : hz;
    if (!smoothed || smoothed <= 0) {
      this.onFrame({ voiced: false });
      return;
    }
    this.frames.push(smoothed);
    if (this.frames.length > 500) this.frames = this.frames.slice(-500);
    this.callMedianHz = median(this.frames);
    const semis = 12 * Math.log2(smoothed / this.callMedianHz);
    this.recent.push(semis);
    if (this.recent.length > this.rollingFrames) this.recent.shift();
    this.onFrame({
      voiced: true,
      hz: smoothed,
      semitones: semis,
      p10: percentile(this.recent, 0.1),
      p90: percentile(this.recent, 0.9),
      spread: percentile(this.recent, 0.9) - percentile(this.recent, 0.1),
      medianHz: this.callMedianHz,
    });
  }

  summarize() {
    if (this.frames.length === 0) return { spread: 0, medianHz: 0, voicedFrames: 0 };
    const medHz = median(this.frames);
    const semis = this.frames.map(hz => 12 * Math.log2(hz / medHz));
    return {
      spread: percentile(semis, 0.9) - percentile(semis, 0.1),
      medianHz: medHz,
      voicedFrames: this.frames.length,
    };
  }
}
