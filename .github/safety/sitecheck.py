"""Checks site.json (written by the FPLN page builder) before it goes live.
Only plain text and colors are allowed: no links, no code, no personal data patterns."""
import json, re, sys
p = sys.argv[1] if len(sys.argv) > 1 else "site.json"
raw = open(p, encoding="utf-8").read()
bad = []
MARKS = re.compile(r"\b(" + "|".join(["FRAG" + "ORD", "OP" + "ORD\\s+\\d", "C" + "UI//", "FO" + "UO"]) + r")\b")
if len(raw) > 40000: bad.append("file is larger than 40 KB")
try: c = json.loads(raw)
except Exception as e: print("FAIL: site.json is not valid JSON:", e); sys.exit(1)
TOP = {"v","chip","wordmark","kicker","tagline","subline","lead","button","buttonSub","bullets","colors","show","steps","features","trust","faq","footer"}
for k in c:
    if k not in TOP: bad.append("unknown setting: %s" % k)
def walk(x, path):
    if isinstance(x, dict):
        for k, v in x.items(): walk(v, path + "." + str(k))
    elif isinstance(x, list):
        if len(x) > 20: bad.append("%s has more than 20 items" % path)
        for i, v in enumerate(x): walk(v, "%s[%d]" % (path, i))
    elif isinstance(x, str):
        if len(x) > 800: bad.append("%s is longer than 800 characters" % path)
        if re.search(r"<\s*/?\s*(script|iframe|img|a|svg|style|object|embed)\b|javascript:|data:|on\w+\s*=", x, re.I): bad.append("%s contains code or markup" % path)
        if re.search(r"https?://|www\.", x, re.I): bad.append("%s contains a web address (links aren't allowed in page text)" % path)
        if re.search(r"\b\d{3}-\d{2}-\d{4}\b", x): bad.append("%s looks like it contains an SSN" % path)
        if re.search(r"[\w.+-]+@[\w-]+\.[\w.]+", x): bad.append("%s contains an email address" % path)
        if MARKS.search(x): bad.append("%s looks like it contains controlled-information markings" % path)
    elif not isinstance(x, (bool, int, float)) and x is not None: bad.append("%s has an unsupported value" % path)
walk(c, "site")
for k, v in (c.get("colors") or {}).items():
    if not (isinstance(v, str) and re.fullmatch(r"#[0-9a-fA-F]{6}", v)): bad.append("colors.%s must look like #e2bd74" % k)
if bad:
    print("FAIL: site.json was not published:"); [print(" -", b) for b in bad]; sys.exit(1)
print("PASS: site.json is plain text and colors only.")
