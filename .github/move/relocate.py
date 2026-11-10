#!/usr/bin/env python3
"""Point FPLN at its new home: rewrites the site address and the repository owner everywhere in the repo.

Usage: python3 .github/move/relocate.py --org ORG [--dry-run]
  braveheart30.github.io  -> ORG.github.io        (links, share images, CSP, guard and worker allowlists, tests)
  Braveheart30/FPLN-      -> ORG/FPLN-            (GitHub links in the Command Center help and the Site Builder)
Left alone on purpose: move/index.html (it must keep accepting plans from the old address), .github/move/
and the git history. Afterwards run .github/site/build.py so the install page picks up the change.
"""
import argparse, os, re, sys
ap = argparse.ArgumentParser(); ap.add_argument("--org", required=True); ap.add_argument("--dry-run", action="store_true"); A = ap.parse_args()
org = A.org
if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9-]{0,38}", org) or org.lower() == "braveheart30": sys.exit("bad --org")
low = org.lower()
R = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SKIP_DIRS = {".git", "vendor", "node_modules"}
SKIP = {os.path.join("move", "index.html")}
SUBS = [("braveheart30.github.io", low + ".github.io"),
        ("braveheart30\\.github\\.io", low + "\\.github\\.io"),
        ("braveheart30\\\\.github\\\\.io", low + "\\\\.github\\\\.io"),
        ("Braveheart30/FPLN-", org + "/FPLN-"), ("Braveheart30/fpln-", org + "/fpln-"),
        ("owner Braveheart30", "owner " + org)]
changed = []
for d, ds, fs in os.walk(R):
    ds[:] = [x for x in ds if x not in SKIP_DIRS and not os.path.join(d, x).endswith(os.path.join(".github", "move"))]
    for f in fs:
        p = os.path.join(d, f); rel = os.path.relpath(p, R)
        if rel in SKIP or not re.search(r"\.(html|js|json|py|md|yml|webmanifest|txt|css)$", f): continue
        try: t = open(p, encoding="utf-8").read()
        except Exception: continue
        n = t
        for a, b in SUBS: n = n.replace(a, b)
        if n != t:
            changed.append((rel, sum(t.count(a) for a, _ in SUBS)))
            if not A.dry_run: open(p, "w", encoding="utf-8").write(n)
for rel, k in changed: print("%4d  %s" % (k, rel))
left = []
for d, ds, fs in os.walk(R):
    ds[:] = [x for x in ds if x not in SKIP_DIRS and not os.path.join(d, x).endswith(os.path.join(".github", "move"))]
    for f in fs:
        p = os.path.join(d, f); rel = os.path.relpath(p, R)
        if rel in SKIP or A.dry_run: continue
        try:
            if re.search(r"braveheart30", open(p, encoding="utf-8").read(), re.I): left.append(rel)
        except Exception: pass
if left: print("still mentions the old address:", ", ".join(left))
print("%s %d files" % ("would change" if A.dry_run else "changed", len(changed)))
