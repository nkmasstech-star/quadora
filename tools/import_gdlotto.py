# Imports real GD Lotto results (last ~6 months, from gdlotto.com past-results page) into public/data/results.json
import csv, json
ANCH = {'2026-11-20': 3630, '2026-11-19': 3629, '2026-11-18': 3628, '2026-11-17': 3627, '2026-11-16': 3626}
rows = []
for line in open('tools/data/gdlotto_6m.csv').read().strip().splitlines():
    date, f, s, t, sp13, cons = line.split(',')
    sp = sp13.split()
    for top in (f, s, t):
        sp.remove(top)  # special list in the CSV holds all 13 A-M numbers, the top 3 sit inside it
    assert len(sp) == 10 and len(cons.split()) == 10, date
    rows.append({'date': date, 'drawNo': str(ANCH.get(date, '')), 'first': f, 'second': s, 'third': t, 'special': sp, 'consolation': cons.split()})
rows.sort(key=lambda r: r['date'], reverse=True)
p = 'public/data/results.json'
d = json.load(open(p))
d['games']['gdlotto'] = rows
json.dump(d, open(p, 'w'), separators=(',', ':'))
print('gdlotto draws:', len(rows), rows[0]['date'], '->', rows[-1]['date'])
