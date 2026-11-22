#!/usr/bin/env python3
"""Put an approved FPLN Studio submission live (run by the FPLN control task, action publish-studio).

The Studio's database holds the approved version in live/site (site.json v3 as a string, pictures as img:<hash>
references), live/app (content.json as a string) and imgs/<hash> (one picture each, {uri}).

  1. python3 .github/site/studio_publish.py needs --site <live/site doc .json>
       prints the picture hashes the site uses, one per line (read each imgs/<hash> doc into the same folder).
  2. python3 .github/site/studio_publish.py apply --site <doc> --app <doc> --imgs <folder> --root .
       writes site.json and content.json, runs sitecheck, contentcheck and build.py, and prints JSON:
       {"ok": true, "pages": N, "uniforms": {"YYYY-MM-DD": "text", ...}}  (uniforms from today on, for control.py uod)
       Exit 1 with the reason when anything fails; nothing is committed by this script.
Docs may be the bare document or wrapped as {"data": {...}} (both forms of an ArtifactData read are accepted)."""
import argparse, datetime, glob, json, os, re, subprocess, sys

def doc(p):
    d = json.load(open(p, encoding="utf-8"))
    for _ in range(3):
        if isinstance(d, dict) and isinstance(d.get("data"), dict) and not ({"site", "content", "uri"} & set(d)): d = d["data"]
        elif isinstance(d, dict) and isinstance(d.get("document"), dict): d = d["document"]
        else: break
    return d

def refs(x, out):
    if isinstance(x, str):
        if x.startswith("img:"): out.add(x[4:])
    elif isinstance(x, list): [refs(v, out) for v in x]
    elif isinstance(x, dict): [refs(v, out) for v in x.values()]
    return out

def fail(msg): print(json.dumps({"ok": False, "error": msg})); sys.exit(1)

a = argparse.ArgumentParser(); a.add_argument("cmd", choices=["needs", "apply"]); a.add_argument("--site", required=True)
a.add_argument("--app"); a.add_argument("--imgs", default="."); a.add_argument("--root", default=".")
o = a.parse_args()
try: site = json.loads(doc(o.site)["site"])
except Exception as e: fail("live/site could not be read: %s" % e)
need = sorted(h for h in refs(site, set()) if re.fullmatch(r"[a-z0-9]{1,24}", h))
if o.cmd == "needs":
    print("\n".join(need)); sys.exit(0)

# pictures back in place of their references
imgs = {}
for h in need:
    hits = [p for p in glob.glob(os.path.join(o.imgs, "**", h + ".json"), recursive=True)]
    if not hits: fail("picture %s is missing (read imgs/%s first)" % (h, h))
    uri = doc(hits[0]).get("uri", "")
    if not re.fullmatch(r"data:image/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+", uri or ""): fail("picture %s is not a PNG, JPEG or WebP" % h)
    imgs[h] = uri
def put(x):
    if isinstance(x, str) and x.startswith("img:"): return imgs.get(x[4:], "")
    if isinstance(x, list): return [put(v) for v in x]
    if isinstance(x, dict): return {k: put(v) for k, v in x.items()}
    return x
site = put(site)
if not isinstance(site, dict) or site.get("v") != 3: fail("live/site is not a v3 site")

try: app = json.loads(doc(o.app)["content"]) if o.app else None
except Exception as e: fail("live/app could not be read: %s" % e)
today = datetime.date.today().isoformat()
uod = {}
if app is not None:
    if not isinstance(app, dict): fail("live/app is not an object")
    app["v"] = 1; app["updated"] = today; app.pop("by", None)
    uod = {d: t for d, t in sorted((app.get("uniforms") or {}).items()) if isinstance(d, str) and d >= today and isinstance(t, str) and t.strip()}

R = o.root
def run(*cmd):
    r = subprocess.run(list(cmd), cwd=R, capture_output=True, text=True)
    if r.returncode: fail((r.stdout + r.stderr).strip()[-1500:])
    return r.stdout
json.dump(site, open(os.path.join(R, "site.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1); open(os.path.join(R, "site.json"), "a").write("\n")
run(sys.executable, ".github/safety/sitecheck.py", "site.json")
if app is not None:
    json.dump(app, open(os.path.join(R, "content.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1); open(os.path.join(R, "content.json"), "a").write("\n")
    run(sys.executable, ".github/safety/contentcheck.py", "content.json")
run(sys.executable, ".github/site/build.py")
print(json.dumps({"ok": True, "pages": len(site.get("pages") or []), "uniforms": uod}))
