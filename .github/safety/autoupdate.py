#!/usr/bin/env python3
"""FPLN dependency auto-update: prepare a library bump; a human approves the PR.

What it does, within fixed rules and never deploying:
  1. Reads the vaccine list (.github/safety/threats.json) and the vendored-library
     sources (.github/safety/vendor_sources.json).
  2. For every "dependency" threat whose vendored version is BELOW the required
     minimum ("min"), it plans a bump to exactly that minimum.
  3. With --apply it edits vendor_sources.json, re-vendors the file (download +
     SHA-256 pin, via vendor.py), rewrites the matching filename in index.html,
     and deletes the superseded vendor file.

It never pauses, erases, or deploys. The workflow that runs it opens a pull
request; the owner reviews and merges. The download needs open network, so the
real bump runs in CI (GitHub Actions), not in a locked-down session: without
--apply the script only reports the plan and touches nothing.

Usage:
  python3 .github/safety/autoupdate.py --root . [--apply] [--out summary.json]
"""
import argparse, json, os, re, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))


def ver_tuple(v):
    nums = re.findall(r"\d+", str(v))
    return tuple(int(n) for n in nums) if nums else (0,)


def load(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def dump(path, data):
    with open(path, "w", encoding="utf-8") as f:
        f.write(json.dumps(data, indent=2, ensure_ascii=False) + "\n")


def required_minimums(threats):
    """pkg -> (highest required min, [threat ids]) over dependency threats that name a min."""
    out = {}
    for t in threats.get("threats", []):
        if t.get("type") != "dependency":
            continue
        pkg, mn = t.get("pkg"), t.get("min")
        if not pkg or not mn:
            continue
        cur = out.get(pkg)
        if cur is None or ver_tuple(mn) > ver_tuple(cur[0]):
            out[pkg] = (mn, [t.get("id", "?")])
        elif ver_tuple(mn) == ver_tuple(cur[0]):
            cur[1].append(t.get("id", "?"))
    return out


def plan_bumps(root):
    threats = load(os.path.join(root, ".github", "safety", "threats.json"))
    sources = load(os.path.join(root, ".github", "safety", "vendor_sources.json"))
    mins = required_minimums(threats)
    plans = []
    for lib in sources["libs"]:
        need = mins.get(lib["name"])
        if not need:
            continue
        new_ver, ids = need
        if ver_tuple(lib["version"]) >= ver_tuple(new_ver):
            continue
        old_ver = lib["version"]
        if old_ver not in lib["url"] or old_ver not in lib["file"]:
            # Naming scheme we can't safely rewrite by version substitution; report, don't guess.
            plans.append({"name": lib["name"], "from": old_ver, "to": new_ver,
                          "ids": ids, "skip": "url/file do not embed the version string"})
            continue
        plans.append({
            "name": lib["name"], "from": old_ver, "to": new_ver, "ids": ids,
            "old_file": lib["file"],
            "new_file": lib["file"].replace(old_ver, new_ver),
            "new_url": lib["url"].replace(old_ver, new_ver),
        })
    return threats, sources, plans


def apply_bumps(root, sources, plans):
    sources_path = os.path.join(root, ".github", "safety", "vendor_sources.json")
    index_path = os.path.join(root, "index.html")
    doing = [p for p in plans if "skip" not in p]
    # 1. edit vendor_sources.json
    for p in doing:
        for lib in sources["libs"]:
            if lib["name"] == p["name"] and lib["version"] == p["from"]:
                lib["version"] = p["to"]
                lib["url"] = p["new_url"]
                lib["file"] = p["new_file"]
                lib["why"] = ("auto-update: %s needs >= %s (%s)"
                              % (p["name"], p["to"], ", ".join(p["ids"])))
    dump(sources_path, sources)
    # 2. download + pin (needs network; CI)
    vendored = subprocess.run(
        [sys.executable, os.path.join(HERE, "vendor.py"), "--root", root],
        capture_output=True, text=True)
    # 3. rewrite index.html filename references
    with open(index_path, encoding="utf-8") as f:
        html = f.read()
    for p in doing:
        html = html.replace(p["old_file"], p["new_file"])
    with open(index_path, "w", encoding="utf-8") as f:
        f.write(html)
    # 4. delete vendor files no longer in the manifest
    vdir = os.path.join(root, "vendor")
    man = load(os.path.join(vdir, "manifest.json"))
    keep = set(man["files"]) | {"manifest.json"}
    removed = []
    for fn in sorted(os.listdir(vdir)):
        if fn not in keep:
            os.remove(os.path.join(vdir, fn))
            removed.append(fn)
    return {"vendor_stdout": vendored.stdout, "vendor_stderr": vendored.stderr,
            "vendor_rc": vendored.returncode, "removed": removed}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", default=".")
    ap.add_argument("--apply", action="store_true", help="make the edits and download (needs network)")
    ap.add_argument("--out", default="")
    A = ap.parse_args()
    root = os.path.abspath(A.root)

    threats, sources, plans = plan_bumps(root)
    doing = [p for p in plans if "skip" not in p]
    summary = {"changed": False, "plans": plans, "applied": None}

    if not plans:
        print("auto-update: every vendored library already meets the vaccine list.")
    else:
        for p in plans:
            if "skip" in p:
                print("auto-update: SKIP %s %s -> %s (%s)" % (p["name"], p["from"], p["to"], p["skip"]))
            else:
                print("auto-update: bump %s %s -> %s  (%s)  [%s -> %s]"
                      % (p["name"], p["from"], p["to"], ", ".join(p["ids"]), p["old_file"], p["new_file"]))

    if A.apply and doing:
        summary["applied"] = apply_bumps(root, sources, plans)
        summary["changed"] = True
        print(summary["applied"]["vendor_stdout"].strip())
        if summary["applied"]["removed"]:
            print("auto-update: removed superseded file(s): " + ", ".join(summary["applied"]["removed"]))
        if summary["applied"]["vendor_rc"] != 0:
            print("auto-update: vendor.py exited %d" % summary["applied"]["vendor_rc"], file=sys.stderr)
            sys.stderr.write(summary["applied"]["vendor_stderr"])
    elif doing and not A.apply:
        print("auto-update: dry run (pass --apply to make the changes).")

    if A.out:
        dump(A.out, summary)
    # exit 0 always; "changed" in the summary / stdout tells the workflow what to do
    return 0


if __name__ == "__main__":
    sys.exit(main())
