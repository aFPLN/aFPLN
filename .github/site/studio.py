#!/usr/bin/env python3
"""Build FPLN Studio (.github/site/studio.src.html) from the Site Builder source plus studio.js / studio.style.html.

FPLN Studio = the Site Builder grown into a team tool: a multi-page website (site.json v3), the app's team
content (content.json), shared drafts with per-area editing locks, submit-for-review, and owner approval that
publishes through the FPLN control task. The Site Builder source stays as is; this script patches a copy.
Run: python3 .github/site/studio.py   then   python3 .github/site/build.py --studio OUT.html"""
import os, re
S = os.path.dirname(os.path.abspath(__file__))
s = open(os.path.join(S, "builder.src.html"), encoding="utf-8").read()
JS = open(os.path.join(S, "studio.js"), encoding="utf-8").read()
CSS = open(os.path.join(S, "studio.style.html"), encoding="utf-8").read().replace("<style>", "").replace("</style>", "").strip()
def rep(a, b, n=1):
    global s
    c = s.count(a); assert c == n, (c, a[:100]); s = s.replace(a, b)
def cut(start, end, new):
    global s
    i = s.index(start); j = s.index(end, i); s = s[:i] + new + s[j:]

rep("<title>FPLN Site Builder</title>", "<title>FPLN Studio</title>")
rep("\n<script>\n", "\n<script>/*UOD*/</script>\n<script>\n")
rep('''@media (max-width:1180px){.app{''', CSS + '''\n@media (max-width:1180px){.app{''')
rep('''<div class="gate" id="gate"><div><b>OWNER ONLY</b><p style="color:var(--dim)">The FPLN Site Builder is for FPLN's owner.</p></div></div>''',
    '''<div class="gate" id="gate"><div><b>SIGN IN TO EDIT</b><p style="color:var(--dim)" id="gateT">FPLN Studio saves the team's work in a shared draft. Open it signed in to claude.ai with access to this page.</p></div></div>''')
rep('''<div class="app" id="app">''', '''<div class="app" id="app" data-mode="web">''')
rep('''    <div class="brand"><i id="logo"></i><div><b>FPLN</b><small>SITE BUILDER</small></div></div>''',
'''    <div class="brand"><i id="logo"></i><div><b>FPLN</b><small>STUDIO</small></div></div>
    <div class="seg modes" role="tablist" aria-label="What you're editing"><button type="button" role="tab" data-mode="web" aria-selected="true">Website</button><button type="button" role="tab" data-mode="app" aria-selected="false">App</button><button type="button" role="tab" data-mode="team" aria-selected="false">Team<span class="dot" id="teamDot" hidden></span></button></div>''')
rep('''    <span class="status" id="status">LOADING</span>''', '''    <span class="people" id="people" aria-label="People here"></span>
    <span class="status" id="status">LOADING</span>''')
rep('''    <button type="button" class="ib pub" id="pubBtn">PUBLISH</button>''', '''    <button type="button" class="ib pub" id="pubBtn">SUBMIT</button>''')
rep('''<button type="button" role="tab" data-tab="sec" aria-selected="true">Sections</button>''',
    '''<button type="button" role="tab" data-tab="pgs" aria-selected="false">Pages</button><button type="button" role="tab" data-tab="sec" aria-selected="true">Sections</button>''')
rep('''    <div class="cbar"><span id="cinfo">LAPTOP · 1280 PX</span>''', '''    <div class="lockbar" id="lockbar" hidden></div>
    <div class="cbar"><span id="cinfo">LAPTOP · 1280 PX</span>''')
rep('''  <aside class="side r" aria-label="Section settings">''', '''  <section class="mode" id="appMode" aria-label="App content" hidden></section>
  <section class="mode" id="teamMode" aria-label="Team" hidden></section>
  <aside class="side r" aria-label="Section settings">''')
# publish modal becomes submit / review
cut('''<div class="modal" id="pubM"''', '''<div class="modal" id="picM"''', '''<div class="modal" id="pubM" role="dialog" aria-modal="true" aria-labelledby="pubT"><div class="box">
  <h2 id="pubT">Submit for review</h2>
  <div id="pubChk"></div>
  <div class="f"><label for="pubNote">Note for the reviewer <small>what changed and why</small></label><textarea id="pubNote" rows="3" maxlength="500" placeholder="e.g. Added a Team page and this week's menus"></textarea></div>
  <p class="hint" id="pubHint">The owner reviews every change before it goes live. Your draft stays editable; submitting again replaces your earlier submission.</p>
  <div class="end"><button type="button" class="ib" data-close>Cancel</button><button type="button" class="ib pub" id="pubGo">SUBMIT</button></div>
</div></div>

<div class="modal" id="revM" role="dialog" aria-modal="true" aria-labelledby="revT"><div class="box wide">
  <h2 id="revT">Review</h2>
  <div id="revBody"></div>
  <div class="f"><label for="revNote">Message back <small>shown to the person who submitted</small></label><textarea id="revNote" rows="2" maxlength="500"></textarea></div>
  <div class="end"><button type="button" class="ib" data-close>Close</button><button type="button" class="ib" id="revBack">SEND BACK</button><button type="button" class="ib pub" id="revGo">APPROVE &amp; PUBLISH</button></div>
</div></div>

''')
# preview: page links in the top bar; clicking one switches page
rep('''    var a = e.target.closest("a,button,summary"); if(a) e.preventDefault();''', '''    var a = e.target.closest("a,button,summary"); if(a) e.preventDefault();
    var pl = e.target.closest("[data-page]"); if(pl){ post({t:"page", slug:pl.getAttribute("data-page")}); return; }''')
rep('''function preview(scroll){ if(!pvReady) return; var m = {spec:S.spec, sel:S.sel, scroll:!!scroll, labels:labels()};''',
    '''function preview(scroll){ if(!pvReady) return; var m = {spec:pvSpec(), sel:S.sel, scroll:!!scroll, labels:labels()};''')
rep('''  else if(m.t === "sel"){''', '''  else if(m.t === "page"){ openPage(m.slug); }
  else if(m.t === "sel"){''')
# left panel: Pages tab
rep('''  if(S.tab === "sty"){ L.innerHTML = styleHTML(); wireStyle(); return; }''', '''  if(S.tab === "pgs"){ L.innerHTML = pagesHTML(); wirePages(); return; }
  if(S.tab === "sty"){ L.innerHTML = styleHTML(); wireStyle(); return; }''')
# every change: per-area lock check, then sync the page view back into the site
rep('''function commit(fn, key, opt){ opt = opt || {}; var now = Date.now();''', '''function commit(fn, key, opt){ opt = opt || {}; var now = Date.now();
  if(!editable()){ blocked(); preview(); return; }
  var before = areaSig();''')
rep('''  fn(S.spec); ensureIds(S.spec); changed(opt); }''', '''  fn(S.spec); ensureIds(S.spec); syncView();
  var after = areaSig(); if(!areaOk(before, after)){ S.spec = null; S.site = JSON.parse(S.hist.pop()); view(); blocked(); changed(opt); return; }
  markDirty(before, after); changed(opt); }''')
rep('''function undo(){ if(!S.hist.length) return; S.fut.push(JSON.stringify(S.spec)); S.spec = JSON.parse(S.hist.pop()); S.lastKey = ""; changed(); toast("Undone"); }
function redo(){ if(!S.fut.length) return; S.hist.push(JSON.stringify(S.spec)); S.spec = JSON.parse(S.fut.pop()); S.lastKey = ""; changed(); toast("Redone"); }''',
'''function undo(){ if(S.mode !== "web" || !S.hist.length || !editable()) return; var b = areaSig(); S.fut.push(JSON.stringify(S.site)); S.site = JSON.parse(S.hist.pop()); view(); S.lastKey = ""; markDirty(b, areaSig()); changed(); toast("Undone"); }
function redo(){ if(S.mode !== "web" || !S.fut.length || !editable()) return; var b = areaSig(); S.hist.push(JSON.stringify(S.site)); S.site = JSON.parse(S.fut.pop()); view(); S.lastKey = ""; markDirty(b, areaSig()); changed(); toast("Redone"); }''')
rep('''  if(!(key && key === S.lastKey && now - S.lastAt < 1500)){ S.hist.push(JSON.stringify(S.spec)); if(S.hist.length > 100) S.hist.shift(); }''',
    '''  if(!(key && key === S.lastKey && now - S.lastAt < 1500)){ S.hist.push(JSON.stringify(S.site)); if(S.hist.length > 100) S.hist.shift(); }''')
# whole-site loads ("load a site.json", "start from the live page") replace the whole site
rep('''  $("rstB").onclick = function(){ var src = LIVE || DEFAULT_SPEC; commit(function(sp){ var c = ensureIds(clone(src)); Object.keys(sp).forEach(function(k){ delete sp[k]; }); Object.assign(sp, c); }); S.sel = null; drawInsp(); toast("Back to the live page", true); }; }''',
    '''  $("rstB").onclick = function(){ loadWholeSite(LIVE || FPLNSITE.toV3(DEFAULT_SPEC), "Back to the live site"); }; }''')
rep('''  if(j && j.v !== 2) j = FPLNSITE.fromV1(j); var bad = check(j);''', '''  if(j && j.v === 3){ var bad3 = checkSite(j); if(bad3.length){ m.hidden = false; m.className = "msg bad"; m.innerHTML = "<b>Can't load it:</b><ul>" + bad3.slice(0, 6).map(function(x){ return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>"; return; } close("impM"); loadWholeSite(j, "Site file loaded"); return; }
  if(j && j.v !== 2) j = FPLNSITE.fromV1(j); var bad = check(j);''')
rep('''  $("dlB").onclick = function(){ save("FPLN-site-backup.json", out(S.spec), $("dlB")); };''', '''  $("dlB").onclick = function(){ save("FPLN-site-backup.json", out(siteOut()), $("dlB")); };''')
# storage, publish and start are replaced by studio.js
cut('''/* ---------- saving (owner-only database; each uploaded picture in its own record) ---------- */''', '''/* ---------- modals ---------- */''', "")
cut('''/* ---------- publish ---------- */''', '''/* ---------- Ask AI ---------- */''', "")
cut('''/* ---------- start ---------- */''', '''})();
</script>''', JS + "\n")
open(os.path.join(S, "studio.src.html"), "w", encoding="utf-8").write(s)
print("studio.src.html", len(s), "bytes")
