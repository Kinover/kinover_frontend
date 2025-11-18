// utils/chat/timeRegistry.js
const TimeGroup = new Map();

function recalcWinner(bucket) {
  let winnerId = null;
  let maxTime = -Infinity;
  let maxSeq = -Infinity;
  bucket.entries.forEach((val, id) => {
    if (val.timeMs > maxTime || (val.timeMs === maxTime && val.seq > maxSeq)) {
      winnerId = id;
      maxTime = val.timeMs;
      maxSeq = val.seq;
    }
  });
  bucket.entries.forEach((val, id) => {
    const shouldShow = id === winnerId;
    if (val.visible !== shouldShow) {
      val.visible = shouldShow;
      val.set(shouldShow);
    }
  });
}

export function registerTimeLast(key, id, timeMs, setShow) {
  if (!TimeGroup.has(key)) TimeGroup.set(key, {entries: new Map(), seq: 0});
  const bucket = TimeGroup.get(key);
  const prev = bucket.entries.get(id);
  const seq = ++bucket.seq;
  if (prev) {
    prev.timeMs = Number(timeMs) || 0;
    prev.seq = seq;
  } else {
    bucket.entries.set(id, {
      timeMs: Number(timeMs) || 0,
      set: setShow,
      seq,
      visible: undefined,
    });
  }
  recalcWinner(bucket);
}

export function unregisterTimeLast(key, id) {
  const bucket = TimeGroup.get(key);
  if (!bucket) return;
  bucket.entries.delete(id);
  if (bucket.entries.size === 0) {
    TimeGroup.delete(key);
  } else {
    recalcWinner(bucket);
  }
}

export function toEpochMs(v) {
  if (v == null) return NaN;
  if (v instanceof Date) return v.getTime();
  if (typeof v === 'number') return v > 1e12 ? v : v * 1000;
  const s = String(v).trim().replace(' ', 'T');
  const t = Date.parse(s);
  return Number.isNaN(t) ? NaN : t;
}

export function minuteKey(time) {
  const t = toEpochMs(time);
  if (Number.isNaN(t)) return 'invalid';
  const d = new Date(t);
  const pad = n => (n < 10 ? `0${n}` : `${n}`);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}
