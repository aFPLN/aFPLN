#!/usr/bin/env python3
"""Build download/index.html from .github/site/page.html + render.js + the default spec.

The default spec is the current site.json (converted to v2 when it is still v1), so the
page looks right even before site.json loads. Run: python3 .github/site/build.py
Also writes .github/site/builder-engine.js (render.js + CSS as a string) for the Site Builder.
"""
import json, os, re, subprocess, sys
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
S = os.path.join(ROOT, ".github", "site")
def rd(p): return open(p, encoding="utf-8").read()
page, render = rd(os.path.join(S, "page.html")), rd(os.path.join(S, "render.js"))
site = json.loads(rd(os.path.join(ROOT, "site.json")))
if site.get("v") != 2:
    js = render + "\nprocess.stdout.write(JSON.stringify(FPLNSITE.fromV1(JSON.parse(require('fs').readFileSync(0,'utf8')))));"
    site = json.loads(subprocess.run(["node", "-e", js], input=json.dumps(site), capture_output=True, text=True, check=True).stdout)
def safe(s): return s.replace("</", "<\\/").replace("<!--", "<\\!--")
spec = safe(json.dumps(site, ensure_ascii=False, separators=(",", ":")))
out = re.sub(r"/\*RENDER-BEGIN\*/.*?/\*RENDER-END\*/", lambda m: "/*RENDER-BEGIN*/" + safe(render) + "/*RENDER-END*/", page, flags=re.S)
out = re.sub(r"/\*SPEC-BEGIN\*/.*?/\*SPEC-END\*/", lambda m: "/*SPEC-BEGIN*/var FPLN_DEFAULT_SPEC = " + spec + ";/*SPEC-END*/", out, flags=re.S)
open(os.path.join(ROOT, "download", "index.html"), "w", encoding="utf-8").write(out)
css = re.search(r"/\*CSS-BEGIN\*/(.*?)/\*CSS-END\*/", page, re.S).group(1)
open(os.path.join(S, "builder-engine.js"), "w", encoding="utf-8").write(render + "\nvar FPLNSITE_CSS = " + json.dumps(css) + ";\n")
print("download/index.html", len(out), "bytes")

# FPLN Site Builder (published as a private artifact; not part of the public site)
if len(sys.argv) > 2 and sys.argv[1] == "--builder":
    src = rd(os.path.join(S, "builder.src.html"))
    eng = rd(os.path.join(S, "builder-engine.js"))
    imgs = rd(os.path.join(S, "builder-imgs.json"))
    b = src.replace("/*ENGINE*/", safe(eng), 1)
    b = b.replace("/*IMGS*/{}", imgs, 1).replace("/*SPEC*/{}", spec, 1)
    b = b.replace('/*BRIDGE-ENGINE*/""', safe(json.dumps(eng)), 1)
    open(sys.argv[2], "w", encoding="utf-8").write(b)
    print("builder", len(b), "bytes")
