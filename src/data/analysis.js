// Statistics over 4-digit lottery numbers. Pure functions, no network.

export function numbersOf(draw) {
  const all = [draw.first, draw.second, draw.third, ...(draw.special || []), ...(draw.consolation || [])];
  return all.filter((n) => typeof n === 'string' && /^\d{4}$/.test(n));
}

const TYPE_LABELS = {
  ABCD: 'All 4 digits different',
  AABC: 'One pair (e.g. 1123)',
  AABB: 'Two pairs (e.g. 1122)',
  AAAB: 'Triple (e.g. 1112)',
  AAAA: 'Four of a kind',
};

function typeOf(n) {
  const c = {};
  for (const d of n) c[d] = (c[d] || 0) + 1;
  const v = Object.values(c).sort((a, b) => b - a).join('');
  return { 1111: 'ABCD', 211: 'AABC', 22: 'AABB', 31: 'AAAB', 4: 'AAAA' }[v];
}

function topN(map, n, minCount = 1) {
  return Object.entries(map)
    .filter(([, c]) => c >= minCount)
    .sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))
    .slice(0, n);
}

export function analyze(draws) {
  const nums = [];
  draws.forEach((d) => numbersOf(d).forEach((n) => nums.push(n)));
  const total = nums.length;
  const s = {
    drawCount: draws.length,
    total,
    digit: Array(10).fill(0),
    pos: [0, 1, 2, 3].map(() => Array(10).fill(0)),
    types: { ABCD: 0, AABC: 0, AABB: 0, AAAB: 0, AAAA: 0 },
    adjacentPair: 0,
    withDouble: 0,
    direction: { Rising: 0, Falling: 0, Mixed: 0 },
    oddDigits: 0,
    lowDigits: 0,
    oddNumbers: 0,
    sums: [],
    first2: {},
    last2: {},
    last3: {},
    freq: {},
    boxGroups: [],
    repeats: [],
    typeLabels: TYPE_LABELS,
    byType: { ABCD: {}, AABC: {}, AABB: {}, AAAB: {}, AAAA: {} },
    oePat: {},
    hlPat: {},
  };
  if (!total) return s;

  nums.forEach((n) => {
    const ds = n.split('').map(Number);
    ds.forEach((d, i) => { s.digit[d]++; s.pos[i][d]++; if (d % 2) s.oddDigits++; if (d <= 4) s.lowDigits++; });
    const t = typeOf(n);
    s.types[t]++;
    s.byType[t][n] = (s.byType[t][n] || 0) + 1;
    const oe = ds.map((d) => (d % 2 ? 'O' : 'E')).join('');
    const hl = ds.map((d) => (d <= 4 ? 'L' : 'H')).join('');
    s.oePat[oe] = (s.oePat[oe] || 0) + 1;
    s.hlPat[hl] = (s.hlPat[hl] || 0) + 1;
    if (t !== 'ABCD') s.withDouble++;
    if (ds[0] === ds[1] || ds[1] === ds[2] || ds[2] === ds[3]) s.adjacentPair++;
    if (ds[0] < ds[1] && ds[1] < ds[2] && ds[2] < ds[3]) s.direction.Rising++;
    else if (ds[0] > ds[1] && ds[1] > ds[2] && ds[2] > ds[3]) s.direction.Falling++;
    else s.direction.Mixed++;
    if (ds[3] % 2) s.oddNumbers++;
    s.sums.push(ds[0] + ds[1] + ds[2] + ds[3]);
    s.first2[n.slice(0, 2)] = (s.first2[n.slice(0, 2)] || 0) + 1;
    s.last2[n.slice(2)] = (s.last2[n.slice(2)] || 0) + 1;
    s.last3[n.slice(1)] = (s.last3[n.slice(1)] || 0) + 1;
    s.freq[n] = (s.freq[n] || 0) + 1;
  });

  // box (same digits, any order)
  const boxes = {};
  Object.keys(s.freq).forEach((n) => {
    const k = n.split('').sort().join('');
    (boxes[k] = boxes[k] || []).push(n);
  });
  s.boxGroups = Object.values(boxes).filter((g) => g.length > 1).sort((a, b) => b.length - a.length);
  s.repeats = Object.entries(s.freq).filter(([, c]) => c > 1).sort((a, b) => b[1] - a[1]);

  s.avgSum = s.sums.reduce((a, b) => a + b, 0) / total;
  s.minSum = Math.min(...s.sums);
  s.maxSum = Math.max(...s.sums);
  const sumMap = {};
  s.sums.forEach((x) => { sumMap[x] = (sumMap[x] || 0) + 1; });
  s.commonSum = topN(sumMap, 1)[0];
  s.topOe = topN(s.oePat, 3);
  s.topHl = topN(s.hlPat, 3);
  s.topFirst2 = topN(s.first2, 6);
  s.topLast2 = topN(s.last2, 6);
  s.topLast3 = topN(s.last3, 5, 2);
  s.hotNumbers = topN(s.freq, 6, 2);

  // history-only extras
  if (draws.length > 1) {
    // draws are newest first
    const lastSeen = {};
    draws.forEach((d, i) => numbersOf(d).forEach((n) => { if (!(n in lastSeen)) lastSeen[n] = i; }));
    s.overdue = Object.entries(lastSeen).filter(([, i]) => i > 0).sort((a, b) => b[1] - a[1]).slice(0, 6);
    let carry = 0, pairs = 0;
    for (let i = 0; i < draws.length - 1; i++) {
      const prev = new Set(numbersOf(draws[i + 1]));
      const cur = new Set(numbersOf(draws[i]));
      let c = 0;
      cur.forEach((n) => { if (prev.has(n)) c++; });
      carry += c; pairs++;
    }
    s.carryAvg = pairs ? carry / pairs : 0;
    // first prize digit trend
    s.firstPrizes = draws.map((d) => d.first).filter(Boolean).slice(0, 10);
  }
  return s;
}

export const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
