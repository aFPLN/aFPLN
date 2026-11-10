#!/usr/bin/env python3
"""Build the site that keeps FPLN's OLD address working after the move.

--layout project (default plan since 9 Nov): published as the gh-pages branch of the old Braveheart30/FPLN- repo itself.

It is published from the user-site repository (Braveheart30/braveheart30.github.io), which GitHub serves at
https://braveheart30.github.io/ and, once the FPLN- repository has moved away, also at /FPLN-/.
  /FPLN-/            hand-off page: moves the cadet's plan to the new address, then erases the old copy
  /FPLN-/sw.js       replaces the old FPLN worker on installed copies so they open the hand-off page
  every other path   404.html redirects to the same path at the new address (old links, QR codes, emails)
  /FPLN-/share/*.png, icons, favicon: kept so images in emails that were already sent still show

Usage: python3 .github/move/build_handoff.py --new https://ORG.github.io/FPLN-/ --out DIR
"""
import argparse, os, re, shutil, sys
ap = argparse.ArgumentParser(); ap.add_argument("--new", required=True); ap.add_argument("--out", required=True)
ap.add_argument("--layout", choices=["user", "project"], default="user", help="project = the old FPLN- repo's own gh-pages branch serves /FPLN-/")
A = ap.parse_args()
NEW = A.new if A.new.endswith("/") else A.new + "/"
if not re.fullmatch(r"https://[a-z0-9-]+\.github\.io/FPLN-/|https://[a-z0-9.-]+\.[a-z]{2,}/(FPLN-/)?", NEW): sys.exit("--new must look like https://org.github.io/FPLN-/")
if NEW.startswith("https://braveheart30.github.io"): sys.exit("--new must be a different address")
R = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))); H = os.path.join(R, ".github", "move", "handoff")
O = os.path.abspath(A.out); F = os.path.join(O, "FPLN-") if A.layout == "user" else O
os.makedirs(F, exist_ok=True)
def put(src, dst):
    t = open(os.path.join(H, src), encoding="utf-8").read().replace("__NEW__", NEW)
    assert "__NEW__" not in t; os.makedirs(os.path.dirname(dst), exist_ok=True); open(dst, "w", encoding="utf-8").write(t)
put("index.html", os.path.join(F, "index.html"))
put("sw.js", os.path.join(F, "sw.js"))
put("404.html", os.path.join(O, "404.html"))
if A.layout == "user": put("404.html", os.path.join(O, "index.html"))          # the bare user-site root also points to FPLN
for d, pat in [("share", r"\.png$"), ("icons", r"\.(png|ico)$")]:
    for f in os.listdir(os.path.join(R, d)):
        if re.search(pat, f): os.makedirs(os.path.join(F, d), exist_ok=True); shutil.copy2(os.path.join(R, d, f), os.path.join(F, d, f))
shutil.copy2(os.path.join(R, "favicon.ico"), os.path.join(F, "favicon.ico"))
open(os.path.join(O, ".nojekyll"), "w").close()
open(os.path.join(O, "README.md"), "w").write("# FPLN has moved\n\nFPLN now lives at " + NEW + "\n\nThis repository only keeps the old address working: it moves each cadet's plan to the new address and redirects old links. Built by `.github/move/build_handoff.py` in the FPLN repository. Don't add anything else here: every page on this address can read what FPLN used to store here.\n")
print("hand-off site written to", O, "→", NEW)
