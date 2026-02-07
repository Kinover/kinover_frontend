const clampPct = (n, min, max) => Math.min(Math.max(n, min), max);
const toPct = n => `${n.toFixed(1)}%`;

export function makeSnapWithFooterPx({
  windowH,
  headerPx,
  minContentPx,
  footerPx,
  bottomSafePx,
  extraPx = 0,
  minPct = 50,
  maxPct = 92,
}) {
  const neededPx = headerPx + minContentPx + footerPx + bottomSafePx + extraPx;
  const pct = (neededPx / windowH) * 100;
  return [toPct(clampPct(pct, minPct, maxPct)), '99%'];
}
