// Live-result probe (test only): during a draw window, read 4dpredict.app every 30 s and record how the
// numbers appear (one by one, or all at once). Writes tools/live_probe/<date>-<label>.json (changes only).
// Usage: node tools/live_probe.mjs <label> <stop HH:MM UTC>
import fs from 'node:fs';

const [label = 'probe', stopAt = '12:00'] = process.argv.slice(2);
const URL = 'https://www.4dpredict.app/';
const UA = 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36';
const TITLES = { magnum: /^MAGNUM 4D Classic/i, toto: /^TOTO 4D/i, damacai: /^DAMACAI 1\+3D/i, singapore: /^SINGAPORE POOLS/i, gdlotto: /^GRAND DRAGON LOTTO(?!\s*6D)/i };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const [sh, sm] = stopAt.split(':').map(Number);
const stop = new Date(); stop.setUTCHours(sh, sm, 0, 0);

function snap(html) {
  const out = {};
  for (const part of html.split('<span class="lottery-title">').slice(1)) {
    const title = part.slice(0, part.indexOf('</span>')).trim();
    const g = Object.keys(TITLES).find((k) => TITLES[k].test(title));
    if (!g || out[g]) continue;
    const end = part.search(/class="table-container|<\/section/);
    const body = end > 0 ? part.slice(0, end) : part.slice(0, 6000);
    const date = (part.match(/[?&]d=(\d{4}-\d{2}-\d{2})/) || [])[1] || '';
    const cells = [...body.matchAll(/<td[^>]*>\s*([^<]{0,12}?)\s*<\/td>/g)].map((m) => m[1]).filter((c) => /^(\d{4}|\*{2,4}|-{2,4}|\?+)$/.test(c));
    out[g] = { date, digits: cells.filter((c) => /^\d{4}$/.test(c)).length, hidden: cells.filter((c) => !/^\d{4}$/.test(c)).length, first: cells.slice(0, 3).join(' ') };
  }
  return out;
}

const log = []; let last = '';
const t0 = Date.now();
while (Date.now() < stop.getTime() && Date.now() - t0 < 110 * 60e3) {
  try {
    const r = await fetch(URL + '?t=' + Date.now(), { headers: { 'user-agent': UA, 'cache-control': 'no-cache' }, signal: AbortSignal.timeout(20000) });
    const s = snap(await r.text());
    const key = JSON.stringify(s);
    if (key !== last) { log.push({ at: new Date().toISOString(), status: r.status, games: s }); last = key; console.log(new Date().toISOString(), key); }
  } catch (e) { log.push({ at: new Date().toISOString(), error: String(e.message || e) }); }
  await sleep(30000);
}
fs.mkdirSync('tools/live_probe', { recursive: true });
const file = `tools/live_probe/${new Date().toISOString().slice(0, 10)}-${label}.json`;
fs.writeFileSync(file, JSON.stringify({ label, url: URL, intervalSec: 30, changes: log }, null, 1));
console.log('wrote', file, log.length, 'changes');
