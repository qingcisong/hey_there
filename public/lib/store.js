// IndexedDB store: full-call recordings + per-user rolling baseline.

const DB_NAME = 'heythere-store';
const DB_VERSION = 1;
const MAX_TURNS = 12;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('recordings')) {
        db.createObjectStore('recordings', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('baseline')) {
        db.createObjectStore('baseline', { keyPath: 'user' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror  = () => reject(req.error);
  });
}

function tx(db, store, mode) {
  return db.transaction(store, mode).objectStore(store);
}

export async function saveRecording(rec) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction('recordings', 'readwrite');
    t.objectStore('recordings').put(rec);
    t.oncomplete = () => resolve();
    t.onerror    = () => reject(t.error);
  });
}

export async function listRecordings() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = tx(db, 'recordings', 'readonly').getAll();
    req.onsuccess = () => resolve(req.result.sort((a, b) => b.at - a.at));
    req.onerror   = () => reject(req.error);
  });
}

export async function getRecording(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = tx(db, 'recordings', 'readonly').get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

export async function deleteRecording(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction('recordings', 'readwrite');
    t.objectStore('recordings').delete(id);
    t.oncomplete = () => resolve();
    t.onerror    = () => reject(t.error);
  });
}

export async function getBaseline(user = 'default') {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = tx(db, 'baseline', 'readonly').get(user);
    req.onsuccess = () => resolve(req.result || { user, turns: [] });
    req.onerror   = () => reject(req.error);
  });
}

export async function pushTurn(turn, user = 'default') {
  const b = await getBaseline(user);
  b.turns.push({ ...turn, at: Date.now() });
  if (b.turns.length > MAX_TURNS) b.turns = b.turns.slice(-MAX_TURNS);
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction('baseline', 'readwrite');
    t.objectStore('baseline').put(b);
    t.oncomplete = () => resolve(b);
    t.onerror    = () => reject(t.error);
  });
}

export async function resetBaseline(user = 'default') {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction('baseline', 'readwrite');
    t.objectStore('baseline').put({ user, turns: [] });
    t.oncomplete = () => resolve();
    t.onerror    = () => reject(t.error);
  });
}

// ---- Feature math -------------------------------------------------

// Compute rate, pauseRatio, longPauses from Groq whisper verbose_json.
export function featuresFromWhisper(whisperJSON) {
  const words = whisperJSON.words || [];
  if (words.length === 0) {
    return { wordCount: 0, voicedSec: 0, spanSec: 0, rate: 0, pauseRatio: 0, longPauses: 0, gaps: [] };
  }
  const spanSec = words[words.length - 1].end - words[0].start;
  let voicedSec = 0, gapSum = 0, longPauses = 0;
  const gaps = [];
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    voicedSec += Math.max(0, w.end - w.start);
    if (i > 0) {
      const gap = w.start - words[i - 1].end;
      if (gap > 0.30) { gaps.push(gap); gapSum += gap; }
      if (gap > 1.0)  longPauses++;
    }
  }
  const rate = voicedSec > 0 ? words.length / voicedSec : 0;
  const pauseRatio = spanSec > 0 ? gapSum / spanSec : 0;
  return {
    wordCount: words.length,
    voicedSec, spanSec, rate, pauseRatio, longPauses, gaps,
  };
}

// Winsorized z-score against baseline turns, floor spread to avoid explosion.
const FLOOR = { rate: 0.25, pauseRatio: 0.04, pitchSpread: 0.5 };

function mean(a) { return a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0; }
function sd(a, m) {
  if (a.length < 2) return 0;
  const v = a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1);
  return Math.sqrt(v);
}
function winsorize(z) { return Math.max(-3, Math.min(3, z)); }

export function computeZ(current, baseline) {
  const turns = baseline.turns || [];
  if (turns.length < 3) return { ready: false, z: null };
  const out = {};
  for (const key of ['rate', 'pauseRatio', 'pitchSpread']) {
    const past = turns.map(t => t[key]).filter(v => Number.isFinite(v));
    const m = mean(past);
    const s = Math.max(sd(past, m), FLOOR[key]);
    out[key] = winsorize((current[key] - m) / s);
  }
  return { ready: true, z: out };
}

// Collapse to energy (voice); leave valence separate.
export function energy(z) {
  const timing = (z.rate + (-z.pauseRatio)) / 2;
  return 0.6 * timing + 0.4 * z.pitchSpread;
}

// Mismatch: energy low but valence non-negative -> Unsure.
export function mismatchFlag(energyZ, valence) {
  return energyZ < -1.2 && valence >= -0.15;
}
