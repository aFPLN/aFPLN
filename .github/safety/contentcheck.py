"""Checks content.json (team content for the FPLN app, written in FPLN Studio) before it goes live.
Plain text only, fixed fields, dates as YYYY-MM-DD, size limits; no links, code, emails, SSNs or markings.
Usage: python3 .github/safety/contentcheck.py content.json"""
import json, re, sys
p = sys.argv[1] if len(sys.argv) > 1 else "content.json"
raw = open(p, encoding="utf-8").read()
bad = []
MARKS = re.compile(r"\b(" + "|".join(["FRAG" + "ORD", "OP" + "ORD\\s+\\d", "C" + "UI//", "FO" + "UO"]) + r")\b")
DAY = re.compile(r"\d{4}-\d{2}-\d{2}")
try: c = json.loads(raw)
except Exception as e: print("FAIL: content.json is not valid JSON:", e); sys.exit(1)
if len(raw) > 200000: bad.append("file is larger than 200 KB")
if not isinstance(c, dict) or c.get("v") != 1: print("FAIL: content.json must be an object with \"v\": 1"); sys.exit(1)

def text(v, path, n):
    if not isinstance(v, str): bad.append("%s must be text" % path); return
    if len(v) > n: bad.append("%s is longer than %d characters" % (path, n))
    if re.search(r"<\s*/?\s*[a-z]|javascript:|data:|on\w+\s*=", v, re.I): bad.append("%s contains code or markup" % path)
    if re.search(r"https?://|www\.", v, re.I): bad.append("%s contains a web address" % path)
    if re.search(r"\b\d{3}-\d{2}-\d{4}\b", v): bad.append("%s looks like it contains an SSN" % path)
    if re.search(r"[\w.+-]+@[\w-]+\.[\w.]+", v): bad.append("%s contains an email address" % path)
    if re.search(r"\b\(?\d{3}\)?[ .-]\d{3}[ .-]\d{4}\b", v): bad.append("%s contains a phone number" % path)
    if MARKS.search(v): bad.append("%s looks like it contains controlled-information markings" % path)
def day(v, path):
    if not (isinstance(v, str) and DAY.fullmatch(v)): bad.append("%s must be a date like 2026-11-24" % path)
def keys(o, allowed, path):
    if not isinstance(o, dict): bad.append("%s must be an object" % path); return False
    for k in o:
        if k not in allowed: bad.append("%s: unknown field %s" % (path, k))
    return True

keys(c, {"v", "updated", "by", "notices", "menus", "officers", "days", "quotes", "uniforms"}, "content")
if "updated" in c: text(c["updated"], "updated", 40)
if "by" in c: text(c["by"], "by", 60)
for i, n in enumerate(c.get("notices") or []):
    P = "notices[%d]" % i
    if i >= 20: bad.append("more than 20 announcements"); break
    if not keys(n, {"id", "title", "body", "from", "until", "tone"}, P): continue
    if not (isinstance(n.get("id"), str) and re.fullmatch(r"[\w-]{1,24}", n["id"])): bad.append("%s.id must be short letters and digits" % P)
    text(n.get("title", ""), P + ".title", 80); text(n.get("body", ""), P + ".body", 600)
    for k in ("from", "until"):
        if n.get(k): day(n[k], P + "." + k)
    if n.get("tone", "info") not in ("info", "warn", "good"): bad.append("%s.tone must be info, warn or good" % P)
for name, fields, n in (("menus", ("breakfast", "lunch", "dinner"), 160), ("officers", ("oic", "ood"), 60)):
    m = c.get(name) or {}
    if not isinstance(m, dict): bad.append("%s must be an object" % name); continue
    if len(m) > 31: bad.append("%s covers more than 31 days" % name)
    for d, v in m.items():
        day(d, "%s key" % name)
        if keys(v, set(fields), "%s.%s" % (name, d)):
            for k in fields:
                if k in v: text(v[k], "%s.%s.%s" % (name, d, k), n)
for i, x in enumerate(c.get("days") or []):
    if i >= 20: bad.append("more than 20 days-until events"); break
    if keys(x, {"n", "d"}, "days[%d]" % i): text(x.get("n", ""), "days[%d].n" % i, 60); day(x.get("d"), "days[%d].d" % i)
for i, x in enumerate(c.get("quotes") or []):
    if i >= 60: bad.append("more than 60 quotes"); break
    if keys(x, {"q", "by"}, "quotes[%d]" % i): text(x.get("q", ""), "quotes[%d].q" % i, 300); text(x.get("by", ""), "quotes[%d].by" % i, 60)
u = c.get("uniforms") or {}
if not isinstance(u, dict): bad.append("uniforms must be an object")
else:
    if len(u) > 10: bad.append("uniforms covers more than 10 days")
    for d, v in u.items(): day(d, "uniforms key"); text(v, "uniforms.%s" % d, 200)
if bad:
    print("FAIL: content.json was not published:"); [print(" -", b) for b in bad[:40]]; sys.exit(1)
print("PASS: content.json is plain text in known fields (%d announcements, %d menu days, %d events, %d quotes)." % (
    len(c.get("notices") or []), len(c.get("menus") or {}), len(c.get("days") or []), len(c.get("quotes") or [])))
