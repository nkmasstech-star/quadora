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
json.dump(res, open("public/data/results.json", "w"), separators=(",", ":"))
json.dump(pred, open("public/data/predictions.json", "w"), separators=(",", ":"))
json.dump({"dummy": True, "wins": wins}, open("public/data/winnings.json", "w"), separators=(",", ":"))
print("ok", sum(len(v) for v in games.values()), "draws")
