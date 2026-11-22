#!/usr/bin/env python3
"""Copy the layout engine (lycore.js) and its app-shell glue (lyshell.js) into index.html, between their markers.
Run after editing either file:  python3 .github/app/sync.py"""
import os, re
A = os.path.dirname(os.path.abspath(__file__)); R = os.path.dirname(os.path.dirname(A))
p = os.path.join(R, "index.html"); s = open(p, encoding="utf-8").read()
for name, f in (("LYCORE", "lycore.js"), ("LYSHELL", "lyshell.js")):
    js = open(os.path.join(A, f), encoding="utf-8").read().replace("</", "<\\/")
    a, b = "/*%s-BEGIN*/" % name, "/*%s-END*/" % name
    assert s.count(a) == 1 and s.count(b) == 1, name
    i = s.index(a) + len(a); j = s.index(b); s = s[:i] + "\n" + js + s[j:]
open(p, "w", encoding="utf-8").write(s); print("index.html: layout engine synced")
