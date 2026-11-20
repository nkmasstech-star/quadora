# Writes DUMMY results/predictions/winnings into public/data for phone testing.
import json, random, datetime as dt
# To go live, replace results.json, predictions.json, winnings.json with real data.
random.seed(4404)
TODAY = dt.date(2026, 11, 18)
def n4(): return f"{random.randint(0,9999):04d}"
def draw(date, no):
    return {"date": date.isoformat(), "drawNo": str(no), "first": n4(), "second": n4(), "third": n4(),
            "special": [n4() for _ in range(10)], "consolation": [n4() for _ in range(10)]}
def my_days(count):
    out, d = [], TODAY
    while len(out) < count:
        if d.weekday() in (2, 5, 6): out.append(d)   # Wed, Sat, Sun
        d -= dt.timedelta(days=1)
    return out
games, base = {}, {"magnum": 5000, "toto": 4300, "damacai": 3900, "singapore": 5170}
for gid, no in base.items():
    ds = my_days(26)
    games[gid] = [draw(d, no - i) for i, d in enumerate(ds)]
games["gdlotto"] = [draw(TODAY - dt.timedelta(days=i), 2100 - i) for i in range(40)]
res = {"dummy": True, "updated": "2026-11-18T18:30:00", "games": games}
def nxt(gid):
    d = TODAY + dt.timedelta(days=1)
    while gid != "gdlotto" and d.weekday() not in (2, 5, 6): d += dt.timedelta(days=1)
    return d.isoformat()
preds = {}
for gid in games:
    preds[gid] = {"forDate": nxt(gid),
                  "important3": [[random.randint(0, 9) for _ in range(3)] for _ in range(3)],
                  "numbers": [n4() for _ in range(6)], "top3": [n4(), n4()],
                  "chart": [random.randint(0, 9) for _ in range(12)]}
pred = {"dummy": True, "updated": "2026-11-18T18:30:00", "games": preds}
wins = []
for gid, i, prize in [("magnum", 2, "1st"), ("toto", 1, "Special"), ("singapore", 3, "3rd"),
                      ("gdlotto", 4, "Consolation"), ("damacai", 2, "2nd"), ("magnum", 5, "Special")]:
    d = games[gid][i]
    num = d["first"] if prize == "1st" else d["second"] if prize == "2nd" else d["third"] if prize == "3rd" else d["special"][0] if prize == "Special" else d["consolation"][0]
    wins.append({"game": gid, "date": d["date"], "number": num, "prize": prize})
hist = {}
def rand_path(chart):
    # random connected up/down/left/right walk of 4 different cells in the 4x3 chart
    while True:
        r, c = random.randint(0, 2), random.randint(0, 3)
        path = [(r, c)]
        while len(path) < 4:
            opts = [(r + a, c + b) for a, b in ((1, 0), (-1, 0), (0, 1), (0, -1)) if 0 <= r + a < 3 and 0 <= c + b < 4 and (r + a, c + b) not in path]
            if not opts: break
            r, c = random.choice(opts); path.append((r, c))
        if len(path) == 4: return path
def formula_row(d):
    chart = [random.randint(0, 9) for _ in range(12)]
    path = rand_path(chart)
    digits = [chart[r * 4 + c] for r, c in path]
    base = digits[:3]
    imp = [base, [random.randint(0, 9) for _ in range(3)]]
    nums = ["".join(map(str, digits))]
    while len(nums) < 6:
        x = base + [random.randint(0, 9)]; random.shuffle(x); nums.append("".join(map(str, x)))
    random.shuffle(nums)
    top = [n4(), n4()]
    if random.random() < 0.45:   # some predictions hit: a prize number is the same digits in any order
        h = list(random.choice(nums)); random.shuffle(h); h = "".join(h)
        slot = random.choice(["third", "second", "special", "consolation"])
        if slot in ("special", "consolation"): d[slot][random.randint(0, 9)] = h
        else: d[slot] = h
    if random.random() < 0.12:
        top[random.randint(0, 1)] = "".join(random.sample(random.choice([d["first"], d["second"], d["third"]]), 4))
    return {"forDate": d["date"], "important3": imp, "numbers": nums, "top3": top, "chart": chart}
for gid, ds in games.items():
    hist[gid] = [formula_row(d) for d in ds[:30]]
json.dump({"dummy": True, "games": hist}, open("public/data/pred_history.json", "w"), separators=(",", ":"))
json.dump(res, open("public/data/results.json", "w"), separators=(",", ":"))
json.dump(pred, open("public/data/predictions.json", "w"), separators=(",", ":"))
json.dump({"dummy": True, "wins": wins}, open("public/data/winnings.json", "w"), separators=(",", ":"))
print("ok", sum(len(v) for v in games.values()), "draws")
