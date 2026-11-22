"""Checks site.json (written by the FPLN Command Center launch-site editor) before it goes live.
Only plain text and colors are allowed: no links, no code, no personal data patterns."""
import json, os, re, sys
p = sys.argv[1] if len(sys.argv) > 1 else "site.json"
raw = open(p, encoding="utf-8").read()
bad = []
MARKS = re.compile(r"\b(" + "|".join(["FRAG" + "ORD", "OP" + "ORD\\s+\\d", "C" + "UI//", "FO" + "UO"]) + r")\b")
try: c = json.loads(raw)
except Exception as e: print("FAIL: site.json is not valid JSON:", e); sys.exit(1)
V3 = isinstance(c, dict) and c.get("v") == 3
if V3:
    # site.json v3 (FPLN Studio): the v2 checks below, once per page, plus the page list itself
    pages = c.get("pages")
    if not isinstance(pages, list) or not pages: print("FAIL: site.json was not published:\n - pages must be a list"); sys.exit(1)
    pbad, seen = [], set()
    if len(pages) > 12: pbad.append("more than 12 pages")
    for i, pg in enumerate(pages):
        if not isinstance(pg, dict): pbad.append("pages[%d] is not a page" % i); continue
        for k in pg:
            if k not in {"slug", "label", "title", "blocks", "inNav"}: pbad.append("pages[%d]: unknown setting %s" % (i, k))
        sl = pg.get("slug")
        if i == 0 and sl != "": pbad.append("the first page is the install page and must have an empty address")
        if i > 0 and not (isinstance(sl, str) and re.fullmatch(r"[a-z0-9](?:[a-z0-9-]{0,28}[a-z0-9])?", sl)): pbad.append("pages[%d] address must be lowercase letters, digits and dashes" % i)
        if sl in seen: pbad.append("two pages share the address %r" % sl)
        seen.add(sl)
        if "inNav" in pg and not isinstance(pg["inNav"], bool): pbad.append("pages[%d].inNav must be true or false" % i)
        for k in ("label", "title"):
            if k in pg and not (isinstance(pg[k], str) and len(pg[k]) <= (24 if k == "label" else 80)): pbad.append("pages[%d].%s is too long" % (i, k))
    if pbad: print("FAIL: site.json was not published:"); [print(" -", b) for b in pbad]; sys.exit(1)
    import subprocess, tempfile
    total = 0
    for i, pg in enumerate(pages):
        one = {"v": 2, "title": pg.get("title") or c.get("title") or "", "theme": c.get("theme") or {}, "nav": c.get("nav") or {}, "blocks": pg.get("blocks")}
        for k in c:
            if k not in {"v", "title", "theme", "nav", "pages"}: print("FAIL: site.json was not published:\n - unknown setting: %s" % k); sys.exit(1)
        with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as f: json.dump(one, f); tmp = f.name
        r = subprocess.run([sys.executable, os.path.abspath(__file__), tmp], capture_output=True, text=True)
        if r.returncode: print("FAIL: page %r was not published:" % (pg.get("label") or pg.get("slug") or "Home")); print("\n".join(r.stdout.splitlines()[1:])); sys.exit(1)
    if len(raw) > 6000000: print("FAIL: site.json is too large (over 6 MB)"); sys.exit(1)
    print("PASS: site.json (%d pages) is plain text, colors, allowed fonts and checked pictures only." % len(pages)); sys.exit(0)
V2 = isinstance(c, dict) and c.get("v") == 2
if len(raw) > (2600000 if V2 else 40000): bad.append("file is too large")
if V2:
    # site.json v2: blocks from the FPLN Site Builder. Text only, fixed block types, allowlisted fonts,
    # images only as built-in keys (@desktop...) or small data:image/png|jpeg|webp in image fields.
    import os
    eng = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "site", "render.js"), encoding="utf-8").read()
    FONTS = set(json.loads(re.search(r"var FONTS = (\[.*?\]);", eng).group(1)))
    TYPES = set(json.loads(re.search(r"var TYPES = (\[.*?\]);", eng).group(1)))
    IMGKEYS = set(re.findall(r'"(@\w+)":', re.search(r"var IMG = \{(.*?)\};", eng).group(1)))
    IMGF = {"image", "phone", "src"}
    DATA = re.compile(r"data:image/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+")
    for k in c:
        if k not in {"v","title","theme","nav","blocks"}: bad.append("unknown setting: %s" % k)
    th = c.get("theme") or {}
    for k, v in th.items():
        if k in ("bg","text","dim","gold","gold2","sky","panel"):
            if not (isinstance(v, str) and re.fullmatch(r"#[0-9a-fA-F]{6}", v)): bad.append("theme.%s must look like #e2bd74" % k)
        elif k in ("display","body"):
            if v not in FONTS: bad.append("theme.%s: font not on the allowed list" % k)
        elif k == "radius":
            if not isinstance(v, (int, float)) or not 0 <= v <= 28: bad.append("theme.radius must be 0-28")
        elif k == "backdrop":
            if not isinstance(v, bool): bad.append("theme.backdrop must be true or false")
        else: bad.append("unknown theme setting: %s" % k)
    bl = c.get("blocks")
    if not isinstance(bl, list) or not bl: bad.append("blocks must be a list of sections")
    else:
        if len(bl) > 60: bad.append("more than 60 sections")
        for i, b in enumerate(bl):
            if not isinstance(b, dict) or b.get("type") not in TYPES: bad.append("blocks[%d] has an unknown type" % i); continue
            if isinstance(b.get("bg"), str) and b["bg"].startswith("#") and not re.fullmatch(r"#[0-9a-fA-F]{6}", b["bg"]): bad.append("blocks[%d].bg must look like #0e182a" % i)
    imgs = []
    def strip(x, path, key=None):
        """pull image values out (checked separately) and return the rest for the text walk"""
        if isinstance(x, dict): return {k: strip(v, path + "." + str(k), k) for k, v in x.items()}
        if isinstance(x, list): return [strip(v, "%s[%d]" % (path, i)) for i, v in enumerate(x)]
        if key in IMGF and isinstance(x, str):
            if x in IMGKEYS or x == "": return ""
            if not DATA.fullmatch(x): bad.append("%s must be a built-in picture or an uploaded png/jpeg/webp" % path)
            elif len(x) > 600000: bad.append("%s picture is too large (over about 450 KB)" % path)
            imgs.append(path); return ""
        return x
    rest = strip(c, "site")
    if len(json.dumps(rest)) > 80000: bad.append("page text is larger than 80 KB")
    c = rest
TOP = {"v","chip","wordmark","kicker","tagline","subline","lead","button","buttonSub","bullets","colors","show","steps","features","trust","faq","footer","layout"}
if not V2:
    for k in c:
        if k not in TOP: bad.append("unknown setting: %s" % k)
def walk(x, path):
    if isinstance(x, dict):
        for k, v in x.items(): walk(v, path + "." + str(k))
    elif isinstance(x, list):
        if len(x) > (60 if V2 else 20): bad.append("%s has more than %d items" % (path, 60 if V2 else 20))
        for i, v in enumerate(x): walk(v, "%s[%d]" % (path, i))
    elif isinstance(x, str):
        if len(x) > (3000 if V2 else 800): bad.append("%s is too long" % path)
        if re.search(r"<\s*/?\s*(script|iframe|img|a|svg|style|object|embed)\b|javascript:|data:|on\w+\s*=", x, re.I): bad.append("%s contains code or markup" % path)
        if re.search(r"https?://|www\.", x, re.I): bad.append("%s contains a web address (links aren't allowed in page text)" % path)
        if re.search(r"\b\d{3}-\d{2}-\d{4}\b", x): bad.append("%s looks like it contains an SSN" % path)
        if re.search(r"[\w.+-]+@[\w-]+\.[\w.]+", x): bad.append("%s contains an email address" % path)
        if MARKS.search(x): bad.append("%s looks like it contains controlled-information markings" % path)
    elif not isinstance(x, (bool, int, float)) and x is not None: bad.append("%s has an unsupported value" % path)
walk(c, "site")
for k, v in (c.get("colors") or {}).items():
    if not (isinstance(v, str) and re.fullmatch(r"#[0-9a-fA-F]{6}", v)): bad.append("colors.%s must look like #e2bd74" % k)
LAY = {"align":["left","center"], "wordmark":["s","m","l"], "phoneShots":[True,False], "phoneOrder":["text","shots"], "phoneWordmark":["s","m","l"], "phoneCompact":[True,False], "phoneAlign":["left","center"]}
for k, v in (c.get("layout") or {}).items():
    if k not in LAY or v not in LAY[k]: bad.append("layout.%s has an unsupported value" % k)
if bad:
    print("FAIL: site.json was not published:"); [print(" -", b) for b in bad]; sys.exit(1)
print("PASS: site.json is plain text, colors%s only." % (", allowed fonts and checked pictures" if V2 else ""))
