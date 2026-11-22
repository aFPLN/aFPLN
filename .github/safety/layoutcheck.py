"""Checks layout.json (the app's layout and custom sections, written in FPLN Studio) before it goes live.
Uses the same rules the app and the Studio use (FPLNLY.problems in .github/app/lycore.js, run with Node), plus a size limit.
Plain text only, known menu/Home/tile items, known block types, https links to .edu/.mil/.gov only, #rrggbb colors.
Usage: python3 .github/safety/layoutcheck.py layout.json"""
import json, os, subprocess, sys
p = sys.argv[1] if len(sys.argv) > 1 else "layout.json"
raw = open(p, encoding="utf-8").read()
if len(raw) > 300000: print("FAIL: layout.json is larger than 300 KB"); sys.exit(1)
try: json.loads(raw)
except Exception as e: print("FAIL: layout.json is not valid JSON:", e); sys.exit(1)
core = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "app", "lycore.js")
js = "const L=require(process.argv[1]);const fs=require('fs');const j=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));const b=L.problems(j);" \
     "const c=L.clean(j);if(c&&JSON.stringify(c.sections.map(s=>s.blocks.length))!==JSON.stringify((j.sections||[]).map(s=>(s.blocks||[]).length)))b.push('a block would be dropped by the app (check every block)');" \
     "console.log(JSON.stringify(b));"
r = subprocess.run(["node", "-e", js, core, os.path.abspath(p)], capture_output=True, text=True)
if r.returncode: print("FAIL: layout check could not run:", (r.stderr or r.stdout).strip()[-400:]); sys.exit(1)
bad = json.loads(r.stdout.strip().splitlines()[-1])
if bad:
    print("FAIL: layout.json was not published:"); [print(" -", b) for b in bad[:40]]; sys.exit(1)
j = json.loads(raw)
print("PASS: layout.json is plain data (%d custom sections, %d menu, %d Home, %d tile settings)." % (
    len(j.get("sections") or []), len(j.get("nav") or []), len(j.get("home") or []), len(j.get("tiles") or [])))
