# Imports last 50 real Magnum and Da Ma Cai draws (numbers only) into public/data/results.json
import json
def load(path, n=50):
    rows = []
    for line in open(path).read().strip().splitlines():
        date, no, f, s, t, sp, co = line.split(',')
        sp, co = sp.split(), co.split()
        assert len(sp) == 10 and len(co) == 10, date
        rows.append({'date': date, 'drawNo': no.split('/')[0], 'first': f, 'second': s, 'third': t, 'special': sp, 'consolation': co})
    rows.sort(key=lambda r: r['date'], reverse=True)
    return rows[:n]
p = 'public/data/results.json'
d = json.load(open(p))
for g, f in (('magnum', 'tools/data/magnum_50.csv'), ('damacai', 'tools/data/damacai_50.csv')):
    d['games'][g] = load(f)
    print(g, len(d['games'][g]), d['games'][g][0]['date'], '->', d['games'][g][-1]['date'])
json.dump(d, open(p, 'w'), separators=(',', ':'))
