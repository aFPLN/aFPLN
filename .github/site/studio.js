/* ======================= FPLN STUDIO =======================
   One builder for the whole team: the public website (site.json v3, several pages) and the app's team content
   (content.json). Everyone edits one shared draft; whoever is working on a page or an app section holds it
   (a short lease, renewed while they work), so nobody overwrites anybody. Teammates submit for review; only the
   owner approves, and approval publishes through the FPLN control task, which runs the same safety checks as
   GitHub before anything goes live.
   Database (rules in the artifact): draft/* imgs/* locks/* shared by the team; reviews/<uid> and activity/<uid>
   each person's own; live/* owner only. */
var TRIG = "trig_016jugaA5GMQRmLuvupSpBBX", SITE_URL = "https://afpln.github.io/aFPLN/";
var ME = {id:null, owner:false, name:"You"}, user = null, room = null, mcp = null;
var HELD = {}, WANT = [], LOCKMSG = {}, PEERS = [], DIRTY = {}, SAVED = {}, lastActive = Date.now(), unsub = {};
var APPSECS = [["notices","Announcements","bell"],["menus","Menus","list"],["officers","Officers","users"],["days","Days until","clock"],["quotes","Quotes","chat"],["uniforms","Uniforms","shield"],["links","Setup links","bolt"]];
function emptyApp(){ return {notices:[], menus:{}, officers:{}, days:[], quotes:[], uniforms:{}}; }
S.site = FPLNSITE.toV3(DEFAULT_SPEC); S.site.pages[0].label = "Home"; S.pageKey = ""; S.mode = "web"; S.app = emptyApp(); S.appSec = "notices"; S.tab = "sec";
var LIVE = null, LIVEAPP = null, LIVESTAT = null, REVIEWS = [], MYREV = null;
var NAMES = {}, nameWait = {};
function nm(id, fb){ if(!id) return fb || "A teammate"; if(id === ME.id) return ME.name || "You"; if(NAMES[id] !== undefined) return NAMES[id] || fb || "A teammate";
  if(user && user.profiles && !nameWait[id]){ nameWait[id] = 1; clearTimeout(nm.t); nm.t = setTimeout(function(){ var ids = Object.keys(nameWait).filter(function(k){ return NAMES[k] === undefined; });
    user.profiles(ids).then(function(ps){ ids.forEach(function(k){ NAMES[k] = (ps && ps[k] && ps[k].name) || ""; }); drawPeople(); lockUI(); if(S.mode === "team") renderTeam(); if(S.tab === "pgs" && S.mode === "web") drawLeft(); }, function(){ ids.forEach(function(k){ NAMES[k] = ""; }); }); }, 50); }
  return fb || "A teammate"; }
function status(t, c){ var s = $("status"); s.textContent = t; s.className = "status " + (c || ""); }

/* ---------- the site and the current page ---------- */
function pkey(slug){ return slug || "home"; }
function curPage(){ var p = S.site.pages.filter(function(x){ return x.slug === S.pageKey; })[0]; if(!p){ p = S.site.pages[0]; S.pageKey = p.slug; } return p; }
function view(){ var p = curPage(); S.spec = {v:2, title:p.title || "", theme:S.site.theme || {}, nav:S.site.nav || {}, blocks:p.blocks || (p.blocks = [])}; ensureIds(S.spec); }
function syncView(){ var p = curPage(); p.blocks = S.spec.blocks; p.title = S.spec.title || ""; S.site.theme = S.spec.theme; S.site.nav = S.spec.nav; if(S.site.nav) delete S.site.nav.pages; }
function pvSpec(){ var o = Object.assign({}, S.spec), links = S.site.pages.filter(function(p){ return p.inNav !== false; });
  o.nav = Object.assign({}, S.spec.nav); if(links.length > 1) o.nav.pages = links.map(function(p){ return {slug:p.slug, label:p.label || "Home", href:"#", cur:p.slug === S.pageKey}; }); return o; }
function areaSig(){ return {meta:JSON.stringify([S.site.title, S.site.theme, S.site.nav, S.site.pages.map(function(p){ return [p.slug, p.label, p.title, p.inNav]; })]), page:JSON.stringify(curPage().blocks), key:S.pageKey}; }
function held(a){ return !db || (HELD[a] && HELD[a] > Date.now()); }
function areaOk(b, a){ return (b.meta === a.meta || held("site")) && (b.page === a.page || held("page_" + pkey(b.key))); }
function editable(){ if(!db) return true; if(S.mode === "app") return held("app_" + S.appSec); return held("page_" + pkey(S.pageKey)) || held("site"); }
function holderOf(a){ return nm(LOCKMSG[a], "Someone else"); }
function blocked(){ var a = S.mode === "app" ? "app_" + S.appSec : !held("page_" + pkey(S.pageKey)) ? "page_" + pkey(S.pageKey) : "site";
  toast(holderOf(a) + " is editing " + areaName(a) + " right now. Their changes show here live; it frees up when they stop."); }
function areaName(a){ if(a === "site") return "the look, top bar and page list"; if(/^page_/.test(a)){ var k = a.slice(5), p = S.site.pages.filter(function(x){ return pkey(x.slug) === k; })[0]; return "the " + (p ? p.label || "Home" : k) + " page"; }
  var s = APPSECS.filter(function(x){ return "app_" + x[0] === a; })[0]; return s ? "app " + s[1].toLowerCase() : a; }
function markDirty(b, a){ if(b.meta !== a.meta) DIRTY["draft/site_meta"] = 1; if(b.page !== a.page) DIRTY["draft/page_" + pkey(b.key)] = 1; queueSave(); }

/* ---------- saving: one document per page and per app section; pictures in their own records ---------- */
function hash(s){ var h = 2166136261; for(var i = 0; i < s.length; i += 7){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36) + s.length.toString(36); }
var IMGCACHE = {};
function stripImgs(x){ var map = {}; var o = JSON.parse(JSON.stringify(x), function(k, v){ if(IMGF[k] && typeof v === "string" && /^data:/.test(v)){ var h = hash(v); map[h] = v; IMGCACHE[h] = v; return "img:" + h; } return v; }); return {o:o, imgs:map}; }
function needImgs(x){ var need = {}; JSON.stringify(x, function(k, v){ if(typeof v === "string" && /^img:/.test(v)) need[v.slice(4)] = 1; return v; }); return Object.keys(need); }
function restoreImgs(x){ var need = needImgs(x).filter(function(h){ return !IMGCACHE[h]; });
  return Promise.all(need.map(function(h){ return db ? db.doc("imgs/" + h).get().then(function(r){ var y = r && r.exists ? r.data() : null; IMGCACHE[h] = y && y.uri || ""; savedImgs[h] = 1; }, function(){ IMGCACHE[h] = ""; }) : null; }))
    .then(function(){ return JSON.parse(JSON.stringify(x), function(k, v){ return typeof v === "string" && /^img:/.test(v) ? IMGCACHE[v.slice(4)] || "" : v; }); }); }
function metaOut(){ return {title:S.site.title || "", theme:S.site.theme || {}, nav:S.site.nav || {}, pages:S.site.pages.map(function(p){ var o = {slug:p.slug, label:p.label || ""}; if(p.title) o.title = p.title; if(p.inNav === false) o.inNav = false; return o; })}; }
function docData(id){
  if(id === "draft/site_meta") return {site:JSON.stringify(metaOut())};
  if(/^draft\/page_/.test(id)){ var k = id.slice(11), p = S.site.pages.filter(function(x){ return pkey(x.slug) === k; })[0]; if(!p) return null; var r = stripImgs(p.blocks || []); return {blocks:JSON.stringify(r.o), _imgs:r.imgs}; }
  if(/^draft\/app_/.test(id)){ var sec = id.slice(10); return {data:JSON.stringify(S.app[sec])}; }
  return null; }
var saveT = null, saving = false;
function queueSave(){ if(!loaded) return; status(db ? "SAVING…" : "NOT SAVED · LOCAL ONLY", db ? "" : "warn"); clearTimeout(saveT); saveT = setTimeout(saveNow, 900); }
function saveNow(){ if(!db){ status("NOT SAVED · LOCAL ONLY", "warn"); return; } if(saving){ clearTimeout(saveT); saveT = setTimeout(saveNow, 600); return; }
  var ids = Object.keys(DIRTY); if(!ids.length){ status("✓ SAVED", "ok"); return; } saving = true; DIRTY = {};
  var chain = Promise.resolve(), failed = null;
  ids.forEach(function(id){ chain = chain.then(function(){ var d = docData(id); if(!d) return; var imgs = d._imgs || {}; delete d._imgs; var str = JSON.stringify(d);
      if(SAVED[id] === str) return; d.at = Date.now(); d.by = ME.id || "";
      var jobs = Object.keys(imgs).filter(function(h){ return !savedImgs[h]; }).map(function(h){ return db.doc("imgs/" + h).set({uri:imgs[h], at:Date.now()}).then(function(){ savedImgs[h] = 1; }); });
      return Promise.all(jobs).then(function(){ return db.doc(id).set(d); }).then(function(){ SAVED[id] = str; }); })
    .catch(function(e){ failed = e; DIRTY[id] = 1; }); });
  chain.then(function(){ saving = false; if(failed) status("NOT SAVED · " + (failed && /large|exhaust/.test(failed.code || "") ? "TOO BIG" : "RETRYING"), "bad"), clearTimeout(saveT), saveT = setTimeout(saveNow, 4000);
    else { status("✓ SAVED", "ok"); logAct("edited " + ids.map(function(i){ return areaName(i.replace(/^draft\//, "").replace("site_meta", "site")); }).join(", ")); } }); }

/* ---------- live: everyone sees everyone's saved work, except in the area they hold themselves ---------- */
function subscribe(){ if(!db) return;
  unsub.meta = db.doc("draft/site_meta").onSnapshot(function(d){ var x = d && d.exists ? d.data() : null; if(!x || !x.site || held("site") && x.by === ME.id) return;
    try{ var m = JSON.parse(x.site); if(!m || !Array.isArray(m.pages) || !m.pages.length) return; var b = areaSig();
      var old = {}; S.site.pages.forEach(function(p){ old[p.slug] = p.blocks; });
      S.site.title = m.title || ""; S.site.theme = m.theme || {}; S.site.nav = m.nav || {};
      S.site.pages = m.pages.map(function(p){ return {slug:p.slug, label:p.label, title:p.title || "", inNav:p.inNav, blocks:old[p.slug] || []}; });
      SAVED["draft/site_meta"] = JSON.stringify({site:x.site}); subPages(); if(!S.site.pages.some(function(p){ return p.slug === S.pageKey; })) S.pageKey = "";
      view(); if(b.meta !== areaSig().meta){ changedQuiet(); } }catch(e){} }, function(){});
  APPSECS.forEach(function(sx){ var sec = sx[0]; if(sec === "links") return;
    unsub["app_" + sec] = db.doc("draft/app_" + sec).onSnapshot(function(d){ var x = d && d.exists ? d.data() : null; if(!x || !x.data || held("app_" + sec) && x.by === ME.id) return;
      try{ S.app[sec] = JSON.parse(x.data); SAVED["draft/app_" + sec] = JSON.stringify({data:x.data}); if(S.mode === "app") renderApp(false); }catch(e){} }, function(){}); });
  db.doc("live/status").onSnapshot(function(d){ LIVESTAT = d && d.exists ? d.data() : null; if(S.mode === "team") renderTeam(); }, function(){});
  db.doc("live/site").onSnapshot(function(d){ var x = d && d.exists ? d.data() : null; if(x && x.site) restoreImgs(JSON.parse(x.site)).then(function(s){ LIVE = s; }); }, function(){});
  db.doc("live/app").onSnapshot(function(d){ var x = d && d.exists ? d.data() : null; try{ LIVEAPP = x && x.content ? JSON.parse(x.content) : null; }catch(e){} }, function(){});
  db.collection("reviews").onSnapshot(function(q){ REVIEWS = q.docs.map(function(d){ var x = d.data() || {}; x.id = d.id; return x; }); MYREV = REVIEWS.filter(function(r){ return r.id === ME.id; })[0] || null;
    $("teamDot").hidden = !(ME.owner ? REVIEWS.some(function(r){ return r.status === "pending"; }) : MYREV && MYREV.status === "returned"); if(S.mode === "team") renderTeam(); }, function(){});
  subPages(); }
function subPages(){ if(!db) return; S.site.pages.forEach(function(p){ var k = pkey(p.slug), id = "page_" + k; if(unsub[id]) return;
  unsub[id] = db.doc("draft/" + id).onSnapshot(function(d){ var x = d && d.exists ? d.data() : null; if(!x || !x.blocks || held(id) && x.by === ME.id) return;
    try{ var bl = JSON.parse(x.blocks); restoreImgs(bl).then(function(full){ var pg = S.site.pages.filter(function(q){ return pkey(q.slug) === k; })[0]; if(!pg) return;
      pg.blocks = full; SAVED["draft/" + id] = JSON.stringify({blocks:x.blocks}); if(pkey(S.pageKey) === k){ view(); changedQuiet(); } }); }catch(e){} }, function(){}); }); }
function changedQuiet(){ var keep = document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) && $("insp").contains(document.activeElement);
  if(find(S.sel) < 0 && S.sel !== "nav") S.sel = null; preview(); if(S.tab !== "sec" || !keep) drawLeft(); if(!keep) drawInsp(); }

/* ---------- locks: hold what you're working on; renewed while you're active ---------- */
function wanted(){ if(S.mode === "web") return ["page_" + pkey(S.pageKey)].concat(/^(pgs|sty|pg)$/.test(S.tab) ? ["site"] : []); if(S.mode === "app" && S.appSec !== "links") return ["app_" + S.appSec]; return []; }
function acquireWanted(){ if(!db || !ME.id) { lockUI(); return Promise.resolve(); } var w = wanted(), idle = Date.now() - lastActive > 180000;
  Object.keys(HELD).forEach(function(a){ if(w.indexOf(a) < 0) delete HELD[a]; });
  if(idle){ lockUI(); return Promise.resolve(); }
  return Promise.all(w.map(function(a){ return db.doc("locks/" + a).acquire({holder:ME.id, ttlMs:90000, data:{uid:ME.id}}).then(function(r){
      if(r && r.acquired){ HELD[a] = Date.now() + 85000; delete LOCKMSG[a]; return; } delete HELD[a];
      return db.doc("locks/" + a).get().then(function(d){ var x = d && d.exists ? d.data() : null; LOCKMSG[a] = x && x.uid && x.uid !== ME.id ? String(x.uid) : "?"; }, function(){ LOCKMSG[a] = "?"; }); }, function(){}); })).then(lockUI); }
setInterval(acquireWanted, 30000);
["pointerdown","keydown","input"].forEach(function(ev){ document.addEventListener(ev, function(){ var was = Date.now() - lastActive > 180000; lastActive = Date.now(); if(was) acquireWanted(); }, true); });
function lockUI(){ var lb = $("lockbar"), a = S.mode === "web" ? (!held("page_" + pkey(S.pageKey)) ? "page_" + pkey(S.pageKey) : (/^(pgs|sty|pg)$/.test(S.tab) && !held("site") ? "site" : null)) : null;
  if(db && ME.id && a && LOCKMSG[a]){ lb.hidden = false; lb.innerHTML = '<b>' + esc(holderOf(a)) + '</b> is editing ' + esc(areaName(a)) + '. You\'re watching their changes live; it frees up a minute after they stop.'; } else lb.hidden = true;
  presence(); if(S.mode === "app") appLockUI(); }

/* ---------- people here (presence) and activity ---------- */
var COLORS2 = ["#e2bd74","#5fd4ff","#5fe08a","#ff9f6b","#c79bff","#ff6b9a","#8fd6ff"];
function myColor(){ var h = 0, s = String(ME.id || "x"); for(var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return COLORS2[h % COLORS2.length]; }
function where(){ return S.mode === "web" ? "Website › " + (curPage().label || "Home") + (S.tab === "sty" ? " › Style" : "") : S.mode === "app" ? "App › " + (APPSECS.filter(function(x){ return x[0] === S.appSec; })[0] || ["", ""])[1] : "Team"; }
var presT = null;
function presence(){ if(!room) return; clearTimeout(presT); presT = setTimeout(function(){ room.presence({color:myColor(), where:where(), owner:ME.owner}).catch(function(){}); }, 250); }
function drawPeople(){ var el = $("people"), ps = PEERS.filter(function(p){ return p.kind === "viewer"; });
  el.innerHTML = ps.slice(0, 6).map(function(p){ var pr = p.presence || {}, n = p.isMe ? ME.name || "You" : nm(p.by, "Teammate"), ini = n.split(/\s+/).map(function(w){ return w.charAt(0); }).join("").slice(0, 2).toUpperCase();
    return '<span class="av" style="--c:' + esc(/^#[0-9a-f]{6}$/i.test(pr.color || "") ? pr.color : "#7486a0") + '" title="' + esc(n + (p.isMe ? " (you)" : "") + " · " + (pr.where || "")) + '">' + esc(ini || "?") + '</span>'; }).join("") + (ps.length > 6 ? '<span class="av more">+' + (ps.length - 6) + '</span>' : "");
  if(S.mode === "team") renderTeam(); }
var ACT = [];
function logAct(what){ if(!db || !ME.id) return; ACT.unshift({at:Date.now(), what:String(what).slice(0, 160)}); ACT = ACT.slice(0, 25); clearTimeout(logAct.t);
  logAct.t = setTimeout(function(){ db.doc("activity/" + ME.id).set({items:ACT, at:Date.now()}).catch(function(){}); }, 4000); }

/* ---------- pages tab ---------- */
var PAGE_TPL = {
  blank:{label:"New page", blocks:function(){ return [NEW.heading(), NEW.text(), NEW.footer()]; }},
  about:{label:"About", blocks:function(){ return [{type:"heading", title:"About FPLN", sub:"Built by cadets, for cadets", size:"l"}, {type:"text", text:"FPLN started as one cadet's planner. Now a small team builds it for the whole Corps.\n\nWe keep it **simple**, **fast**, and **private**: your data stays on your device."}, NEW.footer()]; }},
  features:{label:"Features", blocks:function(){ return [{type:"heading", title:"What FPLN does", sub:"Everything a cadet's day needs, in one place.", size:"l"}, NEW.cards(), NEW.button(), NEW.footer()]; }},
  team:{label:"Team", blocks:function(){ return [{type:"heading", title:"The team", sub:"The cadets building FPLN", size:"l"}, {type:"cards", title:"", cols:3, items:[{icon:"users", t:"Name", d:"Role"},{icon:"users", t:"Name", d:"Role"},{icon:"users", t:"Name", d:"Role"}]}, NEW.footer()]; }},
  faq:{label:"FAQ", blocks:function(){ return [{type:"faq", title:"Questions", items:[{q:"Is FPLN official?", a:"No. It's an independent cadet project."},{q:"Where is my data?", a:"On your own device. FPLN has no account and no server."}]}, NEW.footer()]; }},
  updates:{label:"Updates", blocks:function(){ return [{type:"heading", title:"What's new", sub:"Release notes", size:"l"}, {type:"callout", icon:"bolt", tone:"sky", title:"Latest", text:"Describe the newest update here."}, NEW.footer()]; }}};
function pagesHTML(){ var h = '<h3>Pages</h3><p class="hint">Home is the install page. Other pages get their own address and a link in the top bar.</p><ul class="ol pgl">';
  S.site.pages.forEach(function(p, i){ var on = p.slug === S.pageKey, lk = LOCKMSG["page_" + pkey(p.slug)] && !held("page_" + pkey(p.slug)) ? holderOf("page_" + pkey(p.slug)) : "";
    h += '<li class="' + (on ? "sel" : "") + '" data-pg="' + esc(p.slug) + '"><span class="ty">' + ico(i ? "doc" : "star") + '</span><span class="nm"><b>' + esc(p.label || "Home") + '</b><small>' + (i ? "/pages/" + esc(p.slug) + "/" : "/download/ · install page") + (p.inNav === false ? " · not in menu" : "") + (lk ? " · " + esc(lk) + " editing" : "") + '</small></span>' +
      (i ? '<button type="button" class="mini" data-pgup="' + i + '" title="Move up"' + (i > 1 ? "" : " disabled") + '><svg viewBox="0 0 24 24"><path d="M6 15l6-6 6 6"/></svg></button>' : "") + '</li>'; });
  h += '</ul>';
  if(S.site.pages.length < 12){ h += '<h3>Add a page</h3><div class="pal tpl">'; Object.keys(PAGE_TPL).forEach(function(k){ h += '<button type="button" data-newpg="' + k + '">' + ico(k === "blank" ? "doc" : k === "team" ? "users" : k === "faq" ? "chat" : k === "updates" ? "bell" : "star") + '<b>' + esc(PAGE_TPL[k].label === "New page" ? "Blank" : PAGE_TPL[k].label) + '</b></button>'; }); h += '</div>'; }
  var p = curPage(), i0 = S.site.pages.indexOf(p);
  h += '<h3>This page</h3>' + fld("Name in the menu", '<input type="text" id="pgLabel" maxlength="24" value="' + esc(p.label || "") + '">');
  if(i0) h += fld("Address", '<input type="text" id="pgSlug" maxlength="30" value="' + esc(p.slug) + '" spellcheck="false">', "lowercase, digits, dashes") + '<p class="hint">' + esc(SITE_URL) + 'pages/<b>' + esc(p.slug) + '</b>/</p>';
  h += fld("Browser tab title", '<input type="text" id="pgTitle" maxlength="80" value="' + esc(p.title || "") + '">') + '<label class="tg"><span>Show in the top-bar menu</span><input type="checkbox" id="pgNav"' + (p.inNav === false ? "" : " checked") + '></label>';
  if(i0) h += '<div class="acts"><button type="button" class="sm" id="pgDup">Duplicate page</button><button type="button" class="sm del" id="pgDel">Delete page</button></div>';
  return h; }
function siteEdit(fn, msg){ if(db && !held("site")){ blocked(); return false; } var b = areaSig(); S.hist.push(JSON.stringify(S.site)); S.fut = []; fn(); view(); var a = areaSig();
  if(b.meta !== a.meta) DIRTY["draft/site_meta"] = 1; queueSave(); subPages(); changed({}); if(msg) toast(msg, true); return true; }
function slugify(t){ var s = String(t || "page").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 30) || "page", b = s, n = 2; while(S.site.pages.some(function(p){ return p.slug === s; })) s = (b.slice(0, 27) + "-" + n++); return s; }
function wirePages(){
  [].forEach.call(document.querySelectorAll("[data-pg]"), function(li){ li.onclick = function(e){ if(e.target.closest("[data-pgup]")) return; openPage(li.dataset.pg); }; });
  [].forEach.call(document.querySelectorAll("[data-pgup]"), function(b){ b.onclick = function(){ var i = +b.dataset.pgup; siteEdit(function(){ var P = S.site.pages, t = P[i]; P[i] = P[i - 1]; P[i - 1] = t; }); }; });
  [].forEach.call(document.querySelectorAll("[data-newpg]"), function(b){ b.onclick = function(){ var t = PAGE_TPL[b.dataset.newpg], slug = slugify(t.label), pg = {slug:slug, label:t.label.slice(0, 24), title:"", blocks:ensureIds({blocks:t.blocks()}).blocks};
    if(siteEdit(function(){ S.site.pages.push(pg); }, t.label + " page added")){ DIRTY["draft/page_" + pkey(slug)] = 1; HELD["page_" + pkey(slug)] = Date.now() + 85000; openPage(slug); logAct("added the " + t.label + " page"); } }; });
  var p = curPage();
  $("pgLabel").oninput = function(){ var v = this.value.slice(0, 24); siteEdit(function(){ p.label = v; }); };
  $("pgTitle").oninput = function(){ var v = this.value.slice(0, 80); siteEdit(function(){ p.title = v; }); };
  $("pgNav").onchange = function(){ var v = this.checked; siteEdit(function(){ if(v) delete p.inNav; else p.inNav = false; }); };
  if($("pgSlug")) $("pgSlug").onchange = function(){ var old = p.slug, v = slugify(this.value); if(v === old) return; var blocksCopy = p.blocks;
    if(siteEdit(function(){ p.slug = v; }, "Address changed")){ S.pageKey = v; DIRTY["draft/page_" + pkey(v)] = 1; HELD["page_" + pkey(v)] = Date.now() + 85000; if(db) db.doc("draft/page_" + pkey(old)).delete().catch(function(){}); p.blocks = blocksCopy; subPages(); acquireWanted(); } };
  if($("pgDup")) $("pgDup").onclick = function(){ var c = clone(p); c.slug = slugify(p.label + " copy"); c.label = (p.label + " copy").slice(0, 24);
    if(siteEdit(function(){ S.site.pages.splice(S.site.pages.indexOf(p) + 1, 0, c); }, "Page duplicated")){ DIRTY["draft/page_" + pkey(c.slug)] = 1; HELD["page_" + pkey(c.slug)] = Date.now() + 85000; openPage(c.slug); } };
  if($("pgDel")) $("pgDel").onclick = function(){ var k = pkey(p.slug); if(!held("page_" + k)){ blocked(); return; }
    if(siteEdit(function(){ S.site.pages.splice(S.site.pages.indexOf(p), 1); S.pageKey = ""; }, (p.label || "Page") + " deleted")){ if(db) db.doc("draft/page_" + k).delete().catch(function(){}); logAct("deleted the " + p.label + " page"); acquireWanted(); } }; }
function openPage(slug){ if(!S.site.pages.some(function(p){ return p.slug === slug; })) return; S.pageKey = slug; S.sel = null; S.hist = []; S.fut = []; view(); changed({}); acquireWanted(); presence(); }
function loadWholeSite(site, msg){ if(db && !held("site")){ blocked(); return; } var b = areaSig(); S.hist.push(JSON.stringify(S.site)); S.fut = []; var c = clone(site);
  c.pages.forEach(function(p){ ensureIds({blocks:p.blocks}); }); S.site = c; S.pageKey = ""; view();
  DIRTY["draft/site_meta"] = 1; S.site.pages.forEach(function(p){ DIRTY["draft/page_" + pkey(p.slug)] = 1; HELD["page_" + pkey(p.slug)] = Date.now() + 85000; }); queueSave(); subPages(); S.sel = null; changed({}); toast(msg, true); }
function siteOut(){ var o = {v:3, title:S.site.title || "", theme:S.site.theme || {}, nav:clone(S.site.nav || {}), pages:S.site.pages.map(function(p){ var x = {slug:p.slug, label:p.label || "Home", blocks:p.blocks || []}; if(p.title) x.title = p.title; if(p.inNav === false) x.inNav = false; return x; })};
  delete o.nav.pages; return o; }
/* the same rules GitHub runs, for the whole site */
function checkSite(site){ var bad = []; if(!site || site.v !== 3 || !Array.isArray(site.pages) || !site.pages.length) return ["The site needs at least one page."];
  if(site.pages.length > 12) bad.push("More than 12 pages"); var seen = {};
  site.pages.forEach(function(p, i){ var nm = p.label || (i ? p.slug : "Home");
    if(i === 0 && p.slug !== "") bad.push("The first page must be the install page"); if(i && !FPLNSITE.slugOk(p.slug)) bad.push(nm + ": address must be lowercase letters, digits and dashes");
    if(seen[p.slug]) bad.push("Two pages share the address " + p.slug); seen[p.slug] = 1; if(String(p.label || "").length > 24) bad.push(nm + ": menu name is too long");
    check({v:2, title:p.title || site.title || "", theme:site.theme || {}, nav:site.nav || {}, blocks:p.blocks || []}).forEach(function(x){ bad.push(nm + " › " + x); }); });
  return bad.filter(function(x, i, a){ return a.indexOf(x) === i; }); }

/* ---------- app content (content.json) ---------- */
var DAYMS = 864e5;
function ymd(d){ return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
function nextDays(n){ var t = new Date(), o = []; for(var i = 0; i < n; i++) o.push(ymd(new Date(t.getFullYear(), t.getMonth(), t.getDate() + i))); return o; }
function dLabel(s){ var p = s.split("-"), d = new Date(+p[0], +p[1] - 1, +p[2]); return ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d.getDay()] + " " + d.getDate() + " " + ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][d.getMonth()]; }
function appCheck(a){ var bad = [];
  function t(v, where, n){ if(typeof v !== "string") return; if(v.length > n) bad.push(where + " is longer than " + n + " characters");
    if(/<\s*\/?\s*[a-z]|javascript:|data:|on\w+\s*=/i.test(v)) bad.push(where + " contains code or markup"); if(/https?:\/\/|www\./i.test(v)) bad.push(where + " contains a web address");
    if(/\b\d{3}-\d{2}-\d{4}\b/.test(v)) bad.push(where + " looks like it contains an SSN"); if(/[\w.+-]+@[\w-]+\.[\w.]+/.test(v)) bad.push(where + " contains an email address");
    if(/\b\(?\d{3}\)?[ .-]\d{3}[ .-]\d{4}\b/.test(v)) bad.push(where + " contains a phone number"); if(MARKS.test(v)) bad.push(where + " looks like it contains controlled-information markings"); }
  (a.notices || []).forEach(function(n, i){ t(n.title, "Announcement " + (i + 1) + " title", 80); t(n.body, "Announcement " + (i + 1), 600); if(n.from && n.until && n.until < n.from) bad.push("Announcement " + (i + 1) + " ends before it starts"); });
  if((a.notices || []).length > 20) bad.push("More than 20 announcements");
  Object.keys(a.menus || {}).forEach(function(d){ ["breakfast","lunch","dinner"].forEach(function(m){ t((a.menus[d] || {})[m], "Menu " + d + " " + m, 160); }); });
  Object.keys(a.officers || {}).forEach(function(d){ ["oic","ood"].forEach(function(m){ t((a.officers[d] || {})[m], "Officers " + d, 60); }); });
  (a.days || []).forEach(function(x, i){ t(x.n, "Days-until " + (i + 1), 60); if(!/^\d{4}-\d{2}-\d{2}$/.test(x.d || "")) bad.push("Days-until " + (i + 1) + " needs a date"); });
  (a.quotes || []).forEach(function(x, i){ t(x.q, "Quote " + (i + 1), 300); t(x.by, "Quote " + (i + 1) + " author", 60); });
  Object.keys(a.uniforms || {}).forEach(function(d){ t(a.uniforms[d], "Uniform " + d, 200); });
  return bad.filter(function(x, i, arr){ return arr.indexOf(x) === i; }); }
function appOut(a){ var td = ymd(new Date()), o = {v:1, updated:td, notices:[], menus:{}, officers:{}, days:[], quotes:[], uniforms:{}};
  (a.notices || []).forEach(function(n){ if(!(n.title || n.body)) return; var x = {id:n.id, title:n.title || "", body:n.body || "", tone:n.tone || "info"}; if(n.from) x.from = n.from; if(n.until) x.until = n.until; if(!n.until || n.until >= td) o.notices.push(x); });
  ["menus","officers"].forEach(function(k){ Object.keys(a[k] || {}).sort().forEach(function(d){ if(d < td) return; var v = {}; Object.keys(a[k][d] || {}).forEach(function(f){ var s = String(a[k][d][f] || "").trim(); if(s) v[f] = s; }); if(Object.keys(v).length && Object.keys(o[k]).length < 31) o[k][d] = v; }); });
  (a.days || []).forEach(function(x){ if(x.n && x.d && x.d >= td) o.days.push({n:x.n, d:x.d}); });
  (a.quotes || []).forEach(function(x){ if(x.q) o.quotes.push({q:x.q, by:x.by || ""}); });
  Object.keys(a.uniforms || {}).sort().forEach(function(d){ var s = String(a.uniforms[d] || "").trim(); if(s && d >= td && Object.keys(o.uniforms).length < 10) o.uniforms[d] = s; });
  return o; }
function appEdit(sec, fn, rerender){ if(!held("app_" + sec)){ blocked(); renderApp(false); return; } fn(S.app[sec]); DIRTY["draft/app_" + sec] = 1; queueSave(); if(rerender) renderApp(false); else drawPhone(); }
function appLockUI(){ var b = $("appLock"); if(!b) return; var a = "app_" + S.appSec, lk = db && ME.id && S.appSec !== "links" && !held(a) && LOCKMSG[a];
  b.hidden = !lk; if(lk) b.innerHTML = '<b>' + esc(holderOf(a)) + '</b> is editing ' + esc(areaName(a)) + '. You\'re watching live; it frees up a minute after they stop.';
  [].forEach.call(document.querySelectorAll("#appEd input,#appEd textarea,#appEd select,#appEd button.sm,#appEd .addi"), function(x){ x.disabled = !!lk; }); }
function renderApp(full){ var M = $("appMode"); if(full || !$("appEd")){
    M.innerHTML = '<nav class="anav" aria-label="App content">' + APPSECS.map(function(x){ return '<button type="button" data-asec="' + x[0] + '" aria-current="' + (x[0] === S.appSec) + '">' + ico(x[2]) + '<span><b>' + x[1] + '</b><small id="cnt_' + x[0] + '"></small></span></button>'; }).join("") +
      '<p class="hint">Everything here reaches every cadet\'s app after the owner approves it. Plain text only.</p></nav><div class="aed"><div class="lockbar" id="appLock" hidden></div><div id="appEd"></div></div><aside class="aphone" aria-label="How it looks in the app"><div class="ph"><div class="phs" id="phone"></div></div><p class="hint">Preview of Home and today\'s minute call in the app.</p></aside>';
    [].forEach.call(M.querySelectorAll("[data-asec]"), function(b){ b.onclick = function(){ S.appSec = b.dataset.asec; renderApp(true); acquireWanted(); }; }); }
  APPSECS.forEach(function(x){ var c = $("cnt_" + x[0]); if(!c) return; var v = S.app[x[0]], n = Array.isArray(v) ? v.length : v ? Object.keys(v).filter(function(k){ return k >= ymd(new Date()); }).length : 0; c.textContent = x[0] === "links" ? "share a setup" : n ? n + (x[0] === "menus" || x[0] === "officers" || x[0] === "uniforms" ? " days" : "") : "none"; });
  var E = $("appEd"), sec = S.appSec, a = S.app, h = "";
  if(sec === "notices"){ h = '<h2>Announcements</h2><p class="hint">Cards on every cadet\'s Home under "From the FPLN team". Each cadet can dismiss one with Got it. Use dates to schedule them.</p>' +
      (a.notices || []).map(function(n, i){ return '<div class="acard tone-' + esc(n.tone || "info") + '"><div class="ih"><b>' + (i + 1) + '</b><button type="button" class="sm" data-nmv="' + i + '.-1"' + (i ? "" : " disabled") + '>↑</button><button type="button" class="sm" data-nmv="' + i + '.1"' + (i < a.notices.length - 1 ? "" : " disabled") + '>↓</button><button type="button" class="sm del" data-nrm="' + i + '">Remove</button></div>' +
        fld("Title", '<input type="text" data-n="' + i + '.title" maxlength="80" value="' + esc(n.title || "") + '">') + fld("Message", '<textarea data-n="' + i + '.body" maxlength="600" rows="3">' + esc(n.body || "") + '</textarea>') +
        '<div class="row3">' + fld("Show from", '<input type="date" data-n="' + i + '.from" value="' + esc(n.from || "") + '">') + fld("Until", '<input type="date" data-n="' + i + '.until" value="' + esc(n.until || "") + '">') +
        fld("Style", '<select data-n="' + i + '.tone"><option value="info"' + (n.tone === "info" || !n.tone ? " selected" : "") + '>Notice</option><option value="good"' + (n.tone === "good" ? " selected" : "") + '>Good news</option><option value="warn"' + (n.tone === "warn" ? " selected" : "") + '>Heads up</option></select>') + '</div></div>'; }).join("") +
      ((a.notices || []).length < 20 ? '<button type="button" class="addi" id="nAdd">+ Add an announcement</button>' : ""); }
  else if(sec === "menus" || sec === "officers"){ var F = sec === "menus" ? [["breakfast","Breakfast"],["lunch","Lunch"],["dinner","Dinner"]] : [["oic","Officer in charge"],["ood","Officer of the day"]];
    h = '<h2>' + (sec === "menus" ? "Menus" : "Officers") + '</h2><p class="hint">' + (sec === "menus" ? "Read in cadets' minute calls (\"The menu for dinner is…\") when they haven't typed their own. Two weeks ahead." : "Read in minute calls when a cadet hasn't typed their own. Ranks and last names only.") + '</p><div class="dtab"><div class="dr hd"><span>Day</span>' + F.map(function(f){ return '<span>' + f[1] + '</span>'; }).join("") + '</div>' +
      nextDays(14).map(function(d){ var v = (a[sec] || {})[d] || {}; return '<div class="dr"><span class="dl">' + dLabel(d) + '</span>' + F.map(function(f){ return '<input type="text" data-dd="' + d + '.' + f[0] + '" maxlength="' + (sec === "menus" ? 160 : 60) + '" value="' + esc(v[f[0]] || "") + '" aria-label="' + f[1] + ' ' + dLabel(d) + '">'; }).join("") + '</div>'; }).join("") + '</div>'; }
  else if(sec === "days"){ h = '<h2>Days until</h2><p class="hint">Added to every cadet\'s countdowns ("There are 21 days until Army-Navy"). Cadets\' own countdowns with the same name win.</p>' +
      (a.days || []).map(function(x, i){ return '<div class="col2"><input type="text" data-dy="' + i + '.n" maxlength="60" placeholder="Event" value="' + esc(x.n || "") + '"><input type="date" data-dy="' + i + '.d" value="' + esc(x.d || "") + '"><button type="button" class="sm del" data-dyrm="' + i + '">×</button></div>'; }).join("") +
      ((a.days || []).length < 20 ? '<button type="button" class="addi" id="dyAdd">+ Add a date</button>' : ""); }
  else if(sec === "quotes"){ h = '<h2>Quotes</h2><p class="hint">Join the quote of the day rotation. Check each quote and who said it.</p>' +
      (a.quotes || []).map(function(x, i){ return '<div class="acard"><div class="ih"><b>' + (i + 1) + '</b><button type="button" class="sm del" data-qrm="' + i + '">Remove</button></div>' + fld("Quote", '<textarea data-q="' + i + '.q" rows="2" maxlength="300">' + esc(x.q || "") + '</textarea>') + fld("Who said it", '<input type="text" data-q="' + i + '.by" maxlength="60" value="' + esc(x.by || "") + '">') + '</div>'; }).join("") +
      ((a.quotes || []).length < 60 ? '<button type="button" class="addi" id="qAdd">+ Add a quote</button>' : ""); }
  else if(sec === "uniforms"){ h = '<h2>Uniforms</h2><p class="hint">The uniform of the day for the next week. On publish each day is posted the same way as the Command Center\'s UOD page: on every cadet\'s avatar and in their minute calls.</p><div class="dtab">' +
      nextDays(7).map(function(d){ var v = (a.uniforms || {})[d] || "", r = v && window.FPLNUOD ? FPLNUOD.parse(v) : null;
        return '<div class="dr u"><span class="dl">' + dLabel(d) + '</span><input type="text" data-u="' + d + '" maxlength="200" placeholder="e.g. ACU under Level 5 with black gloves" value="' + esc(v) + '"><span class="uparse ' + (r ? r.k ? "ok" : "bad" : "") + '" id="up_' + d + '">' + (r ? r.k ? esc(r.text) + (r.unknown.length ? " · can't show: " + esc(r.unknown.join(" ")) : "") : "No uniform found. Start with ACU, As for Class, White over Gray…" : "") + '</span></div>'; }).join("") + '</div>'; }
  else { h = '<h2>Setup links</h2><p class="hint">Send one of these to a tester. Opening it sets FPLN up with that add-on preset. Nothing to approve: they\'re links to the live app.</p>' +
      [["essentials","Essentials","What's next and tasks. The fastest start."],["standard","Standard","Adds alerts, focus, Eric, music and the scene."],["everything","Everything","Every add-on."]].map(function(x){ var u = SITE_URL + "#cfg=" + x[0];
        return '<div class="acard"><b>' + x[1] + '</b><p class="hint" style="margin:4px 0 8px">' + x[2] + '</p><div class="col2"><input type="text" readonly value="' + esc(u) + '"><button type="button" class="sm" data-copy="' + esc(u) + '">Copy</button></div></div>'; }).join(""); }
  E.innerHTML = h; wireApp(); drawPhone(); appLockUI(); }
function wireApp(){ var E = $("appEd");
  function setPath(o, p, v){ var k = p.split("."); for(var i = 0; i < k.length - 1; i++){ o = o[k[i]]; } o[k[k.length - 1]] = v; }
  [].forEach.call(E.querySelectorAll("[data-n]"), function(x){ x.oninput = x.onchange = function(){ var p = x.dataset.n, v = x.value; appEdit("notices", function(L){ setPath(L, p, v); }, x.tagName === "SELECT"); }; });
  [].forEach.call(E.querySelectorAll("[data-nrm]"), function(b){ b.onclick = function(){ appEdit("notices", function(L){ L.splice(+b.dataset.nrm, 1); }, true); }; });
  [].forEach.call(E.querySelectorAll("[data-nmv]"), function(b){ b.onclick = function(){ var a = b.dataset.nmv.split("."), i = +a[0], j = i + +a[1]; appEdit("notices", function(L){ var t = L[i]; L[i] = L[j]; L[j] = t; }, true); }; });
  if($("nAdd")) $("nAdd").onclick = function(){ appEdit("notices", function(L){ L.push({id:"n" + Date.now().toString(36), title:"", body:"", from:ymd(new Date()), until:"", tone:"info"}); }, true); };
  [].forEach.call(E.querySelectorAll("[data-dd]"), function(x){ x.oninput = function(){ var a = x.dataset.dd.split("."), d = a[0], f = a[1], v = x.value; appEdit(S.appSec, function(M){ M[d] = M[d] || {}; if(v) M[d][f] = v; else delete M[d][f]; if(!Object.keys(M[d]).length) delete M[d]; }); }; });
  [].forEach.call(E.querySelectorAll("[data-dy]"), function(x){ x.oninput = x.onchange = function(){ var a = x.dataset.dy.split("."), v = x.value; appEdit("days", function(L){ L[+a[0]][a[1]] = v; }); }; });
  [].forEach.call(E.querySelectorAll("[data-dyrm]"), function(b){ b.onclick = function(){ appEdit("days", function(L){ L.splice(+b.dataset.dyrm, 1); }, true); }; });
  if($("dyAdd")) $("dyAdd").onclick = function(){ appEdit("days", function(L){ L.push({n:"", d:""}); }, true); };
  [].forEach.call(E.querySelectorAll("[data-q]"), function(x){ x.oninput = function(){ var a = x.dataset.q.split("."), v = x.value; appEdit("quotes", function(L){ L[+a[0]][a[1]] = v; }); }; });
  [].forEach.call(E.querySelectorAll("[data-qrm]"), function(b){ b.onclick = function(){ appEdit("quotes", function(L){ L.splice(+b.dataset.qrm, 1); }, true); }; });
  if($("qAdd")) $("qAdd").onclick = function(){ appEdit("quotes", function(L){ L.push({q:"", by:""}); }, true); };
  [].forEach.call(E.querySelectorAll("[data-u]"), function(x){ x.oninput = function(){ var d = x.dataset.u, v = x.value, r = v.trim() && window.FPLNUOD ? FPLNUOD.parse(v) : null, el = $("up_" + d);
    el.className = "uparse " + (r ? r.k ? "ok" : "bad" : ""); el.textContent = r ? r.k ? r.text + (r.unknown.length ? " · can't show: " + r.unknown.join(" ") : "") : "No uniform found. Start with ACU, As for Class, White over Gray…" : "";
    appEdit("uniforms", function(M){ if(v.trim()) M[d] = v; else delete M[d]; }); }; });
  [].forEach.call(E.querySelectorAll("[data-copy]"), function(b){ b.onclick = function(){ copyText(b.dataset.copy, b); }; }); }
function drawPhone(){ var P = $("phone"); if(!P) return; var a = appOut(S.app), td = ymd(new Date()), on = a.notices.filter(function(n){ return (!n.from || n.from <= td) && (!n.until || td <= n.until); });
  var mn = a.menus[td] || {}, of = a.officers[td] || {}, u = a.uniforms[td], uq = u && window.FPLNUOD ? FPLNUOD.parse(u) : null, lines = [];
  lines.push("Sir, there are five minutes until assembly for dinner formation."); if(uq && uq.k) lines.push("The uniform for dinner formation is " + (uq.unknown.length ? u : uq.text) + ".");
  lines.push("The menu for dinner is " + (mn.dinner || "not yet posted") + "."); if(of.oic) lines.push("The officer in charge is " + of.oic + "."); if(of.ood) lines.push("The officer of the day is " + of.ood + ".");
  a.days.slice(0, 2).forEach(function(x){ var p = x.d.split("-"), n = Math.round((new Date(+p[0], +p[1] - 1, +p[2]) - new Date(new Date().toDateString())) / DAYMS); if(n >= 0) lines.push("There " + (n === 1 ? "is one day" : "are " + n + " days") + " until " + x.n + "."); });
  lines.push("Five minutes, sir!");
  P.innerHTML = '<div class="pbar"><b>Good evening</b><span>' + dLabel(td) + '</span></div>' + (on.length ? '<div class="pth">FROM THE FPLN TEAM</div>' + on.map(function(n){ return '<div class="pnote ' + esc(n.tone) + '"><b>' + esc(n.title) + '</b><p>' + esc(n.body) + '</p></div>'; }).join("") : '<p class="pempty">No announcements showing today.</p>') +
    (a.quotes.length ? '<div class="pq">“' + esc(a.quotes[0].q) + '”<small>— ' + esc(a.quotes[0].by || "FPLN team") + '</small></div>' : "") +
    '<div class="pth">TODAY\'S MINUTE CALL</div><div class="pmc">' + lines.map(function(l){ return '<p>' + esc(l) + '</p>'; }).join("") + '</div>'; }

/* ---------- team: people, reviews, publishing ---------- */
function ago(t){ var s = Math.round((Date.now() - (+t || 0)) / 1000); return s < 60 ? "just now" : s < 3600 ? Math.round(s / 60) + " min ago" : s < 86400 ? Math.round(s / 3600) + " h ago" : Math.round(s / 86400) + " d ago"; }
var ACTS = [];
function renderTeam(){ var T = $("teamMode"), ps = PEERS.filter(function(p){ return p.kind === "viewer"; }), h = '<div class="tcol">';
  h += '<section class="tc"><h2>Here now</h2>' + (ps.length ? ps.map(function(p){ var pr = p.presence || {}, n = p.isMe ? ME.name || "You" : nm(p.by, "Teammate"); return '<div class="who"><span class="av" style="--c:' + esc(/^#[0-9a-f]{6}$/i.test(pr.color || "") ? pr.color : "#7486a0") + '">' + esc(n.charAt(0).toUpperCase()) + '</span><span><b>' + esc(n) + (p.isMe ? " (you)" : "") + (pr.owner ? ' <i class="tag">OWNER</i>' : "") + '</b><small>' + esc(pr.where || "") + '</small></span></div>'; }).join("") : '<p class="hint">Only you.</p>') + '</section>';
  var st = LIVESTAT; h += '<section class="tc"><h2>Live site and app</h2>' + (st ? '<p class="pubst ' + esc(st.state || "") + '"><b>' + esc(st.state === "done" ? "✓ Published" : st.state === "failed" ? "✗ Not published" : st.state === "publishing" ? "Publishing…" : st.state || "—") + '</b> ' + esc(ago(st.at)) + '</p>' + (st.detail ? '<p class="hint">' + esc(st.detail) + '</p>' : "") : '<p class="hint">Nothing published from the Studio yet.</p>') +
    '<p class="hint"><a href="' + SITE_URL + 'download/" target="_blank" rel="noopener">Open the website ↗</a> · <a href="' + SITE_URL + '" target="_blank" rel="noopener">Open the app ↗</a></p></section>';
  if(!ME.owner) h += '<section class="tc"><h2>How sharing works</h2><p class="hint">You and the team edit one shared draft. When you\'re happy, press <b>SUBMIT</b>. The owner reviews it and publishes it, or sends it back with a note.</p></section>';
  else h += '<section class="tc"><h2>Add teammates</h2><p class="hint">Use this page\'s <b>Share</b> menu and give each teammate access that lets them use the page (not edit its code). They edit drafts and submit; only you can approve and publish.</p></section>';
  h += '</div><div class="tcol wide">';
  var pend = REVIEWS.filter(function(r){ return r.status === "pending"; }).sort(function(a, b){ return (b.at || 0) - (a.at || 0); });
  if(ME.owner){ h += '<section class="tc"><h2>Waiting for your review <span class="cnt">' + pend.length + '</span></h2>' + (pend.length ? pend.map(function(r){ return '<div class="rv"><span><b>' + esc(nm(r.id, "Teammate")) + '</b><small>' + esc(ago(r.at)) + (r.note ? " · " + esc(r.note) : "") + '</small></span><button type="button" class="ib pub" data-rev="' + esc(r.id) + '">REVIEW</button></div>'; }).join("") : '<p class="hint">Nothing waiting.</p>') +
      '<div class="acts"><button type="button" class="ib" id="pubMine">Review and publish my own draft</button></div></section>'; }
  var mine = MYREV; h += '<section class="tc"><h2>Your submission</h2>' + (mine ? '<p class="pubst ' + esc(mine.status) + '"><b>' + esc({pending:"Waiting for review", approved:"✓ Approved and published", returned:"Sent back", published:"✓ Published"}[mine.status] || mine.status) + '</b> ' + esc(ago(mine.at2 || mine.at)) + '</p>' + (mine.reply ? '<p class="reply">“' + esc(mine.reply) + '”</p>' : "") : '<p class="hint">You haven\'t submitted anything.</p>') + '</section>';
  h += '<section class="tc"><h2>Recent work</h2><div id="acts">' + (ACTS.length ? ACTS.slice(0, 20).map(function(x){ return '<div class="act"><b>' + esc(nm(x.by, "Teammate")) + '</b> ' + esc(x.what) + ' <small>' + esc(ago(x.at)) + '</small></div>'; }).join("") : '<p class="hint">No activity yet.</p>') + '</div></section></div>';
  T.innerHTML = h;
  [].forEach.call(T.querySelectorAll("[data-rev]"), function(b){ b.onclick = function(){ openReview(REVIEWS.filter(function(r){ return r.id === b.dataset.rev; })[0]); }; });
  if($("pubMine")) $("pubMine").onclick = function(){ snapshot().then(function(sn){ openReview({id:ME.id, at:Date.now(), note:"Your own draft", site:sn.site, app:sn.app, own:true}); }); }; }
function loadActs(){ if(!db) return; db.collection("activity").onSnapshot(function(q){ var all = []; q.docs.forEach(function(d){ var x = d.data() || {}; (x.items || []).forEach(function(it){ all.push({by:d.id, what:it.what, at:it.at}); }); });
  ACTS = all.sort(function(a, b){ return b.at - a.at; }); if(S.mode === "team") renderTeam(); }, function(){}); }

/* a submission is the whole draft: site (pictures as references) and app content */
function snapshot(){ var site = siteOut(), r = stripImgs(site), jobs = Object.keys(r.imgs).filter(function(h){ return !savedImgs[h]; }).map(function(h){ return db ? db.doc("imgs/" + h).set({uri:r.imgs[h], at:Date.now()}).then(function(){ savedImgs[h] = 1; }) : null; });
  return Promise.all(jobs).then(function(){ return {site:JSON.stringify(r.o), app:JSON.stringify(appOut(S.app)), full:site}; }); }
$("pubBtn").onclick = function(){ if(ME.owner){ setMode("team"); $("pubMine").click(); return; }
  var site = siteOut(), bad = checkSite(site).concat(appCheck(S.app).map(function(x){ return "App › " + x; }));
  $("pubChk").innerHTML = bad.length ? '<p class="msg bad"><b>Fix these first</b> (the safety check would stop them):<ul>' + bad.slice(0, 8).map(function(x){ return "<li>" + esc(x) + "</li>"; }).join("") + "</ul></p>" : '<p class="msg ok"><b>✓ Passes the safety check.</b> ' + site.pages.length + ' page' + (site.pages.length > 1 ? "s" : "") + ' and the app content.</p>';
  $("pubGo").disabled = !!bad.length || !db; $("pubNote").value = ""; open("pubM"); };
$("pubGo").onclick = function(){ var b = $("pubGo"); b.disabled = true; b.textContent = "SUBMITTING…";
  snapshot().then(function(sn){ return db.doc("reviews/" + ME.id).set({by:ME.id, at:Date.now(), note:$("pubNote").value.slice(0, 500), status:"pending", site:sn.site, app:sn.app, reply:""}); })
    .then(function(){ close("pubM"); toast("Submitted. The owner will review it."); logAct("submitted changes for review"); }, function(e){ toast(e && /large|exhaust/.test(e.code || "") ? "Too big to submit. Remove a large picture and try again." : "Couldn't submit. Try again."); })
    .then(function(){ b.disabled = false; b.textContent = "SUBMIT"; }); };

/* review: what changed against what's live, then approve (publish) or send back */
var REV = null;
function diff(site, app){ var L = LIVE ? FPLNSITE.toV3(LIVE) : null, A = LIVEAPP || {v:1, notices:[], menus:{}, officers:{}, days:[], quotes:[], uniforms:{}}, out = [];
  if(!L) out.push(["New", "Whole website (nothing published from the Studio yet)"]);
  else { if(JSON.stringify([L.theme, L.nav, L.title]) !== JSON.stringify([site.theme, site.nav, site.title])) out.push(["Changed", "Look, colors, fonts or top bar"]);
    var lp = {}; L.pages.forEach(function(p){ lp[p.slug] = p; });
    site.pages.forEach(function(p){ var o = lp[p.slug]; if(!o) out.push(["New page", (p.label || "Home") + (p.slug ? " · /pages/" + p.slug + "/" : "")]);
      else { var ob = {}, nb = {}; (o.blocks || []).forEach(function(b){ ob[b.id] = JSON.stringify(b); }); (p.blocks || []).forEach(function(b){ nb[b.id] = JSON.stringify(b); });
        var add = Object.keys(nb).filter(function(k){ return !ob[k]; }).length, rem = Object.keys(ob).filter(function(k){ return !nb[k]; }).length, ch = Object.keys(nb).filter(function(k){ return ob[k] && ob[k] !== nb[k]; }).length;
        var mv = JSON.stringify((o.blocks || []).map(function(b){ return b.id; }).filter(function(k){ return nb[k]; })) !== JSON.stringify((p.blocks || []).map(function(b){ return b.id; }).filter(function(k){ return ob[k]; }));
        if(add || rem || ch || mv || o.label !== p.label) out.push(["Changed page", (p.label || "Home") + ": " + [add && add + " section" + (add > 1 ? "s" : "") + " added", rem && rem + " removed", ch && ch + " edited", mv && "reordered", o.label !== p.label && "renamed"].filter(Boolean).join(", ")]); } delete lp[p.slug]; });
    Object.keys(lp).forEach(function(k){ out.push(["Removed page", lp[k].label || k]); }); }
  [["notices","announcements"],["days","days-until"],["quotes","quotes"]].forEach(function(x){ var a = JSON.stringify(app[x[0]] || []), b = JSON.stringify(A[x[0]] || []); if(a !== b) out.push(["App", (app[x[0]] || []).length + " " + x[1] + " (was " + (A[x[0]] || []).length + ")"]); });
  [["menus","menus"],["officers","officers"],["uniforms","uniforms"]].forEach(function(x){ var a = JSON.stringify(app[x[0]] || {}), b = JSON.stringify(A[x[0]] || {}); if(a !== b) out.push(["App", x[1] + " for " + Object.keys(app[x[0]] || {}).length + " day(s)"]); });
  return out; }
function openReview(r){ if(!r) return; REV = r; var site, app;
  try{ site = JSON.parse(r.site); app = JSON.parse(r.app); }catch(e){ toast("That submission couldn't be read."); return; }
  restoreImgs(site).then(function(full){ var bad = checkSite(full).concat(appCheck(app).map(function(x){ return "App › " + x; })), d = diff(full, app);
    $("revT").textContent = r.own ? "Publish your draft" : "Review: " + nm(r.id, "Teammate");
    $("revBody").innerHTML = (r.note ? '<p class="reply">“' + esc(r.note) + '”</p>' : "") + '<h3>What changes</h3>' + (d.length ? '<ul class="diff">' + d.map(function(x){ return '<li><i>' + esc(x[0]) + '</i>' + esc(x[1]) + '</li>'; }).join("") + '</ul>' : '<p class="hint">Nothing differs from what\'s live.</p>') +
      (bad.length ? '<p class="msg bad"><b>The safety check would stop this:</b><ul>' + bad.slice(0, 8).map(function(x){ return "<li>" + esc(x) + "</li>"; }).join("") + '</ul></p>' : '<p class="msg ok"><b>✓ Passes the safety check.</b> GitHub runs it again before anything goes live.</p>') +
      (!mcp ? '<p class="msg warn">Publishing runs your FPLN control task. Allow this page to use Claude Code Remote when asked.</p>' : "");
    $("revGo").disabled = !!bad.length; $("revBack").hidden = !!r.own; $("revNote").value = ""; $("revNote").parentNode.hidden = !!r.own; REV.full = full; REV.appObj = app; open("revM"); }); }
$("revBack").onclick = function(){ if(!REV || !db) return; db.doc("reviews/" + REV.id).update({status:"returned", reply:$("revNote").value.slice(0, 500), at2:Date.now()}).then(function(){ close("revM"); toast("Sent back to " + nm(REV.id, "them")); logAct("sent back a submission"); }); };
$("revGo").onclick = function(){ if(!REV || !db || !ME.owner) return; var b = $("revGo"), r = REV; b.disabled = true; b.textContent = "PUBLISHING…";
  var site = stripImgs(r.full).o;
  db.doc("live/site").set({site:JSON.stringify(site), at:Date.now(), by:ME.id, review:r.id})
    .then(function(){ return db.doc("live/app").set({content:JSON.stringify(r.appObj), at:Date.now(), by:ME.id, review:r.id}); })
    .then(function(){ return db.doc("live/status").set({state:"publishing", at:Date.now(), detail:"Sent to the FPLN control task. It checks everything, then puts it live.", review:r.id}); })
    .then(function(){ return r.own ? null : db.doc("reviews/" + r.id).update({status:"approved", reply:$("revNote").value.slice(0, 500), at2:Date.now()}); })
    .then(function(){ if(!mcp) throw {code:"no_mcp"}; return mcp.callTool("Claude Code Remote", "fire_trigger", {trigger_id:TRIG, text:"FPLN-CONTROL action=publish-studio ring=all at=" + Date.now() + " off=none msg=" + (r.own ? "owner-draft" : "review-" + String(r.id || "").replace(/[^\w-]/g, "").slice(0, 40))}); })
    .then(function(){ close("revM"); toast("Publishing. The site and app update in a few minutes."); logAct("approved and published " + (r.own ? "the draft" : "a submission")); },
      function(e){ toast(e && e.code === "no_mcp" ? "Saved as approved, but this page can't start publishing. Allow Claude Code Remote for this page, then approve again." : "Publishing didn't start: " + ((e && (e.message || e.code)) || "try again")); })
    .then(function(){ b.disabled = false; b.textContent = "APPROVE & PUBLISH"; }); };

/* ---------- modes ---------- */
function setMode(m){ S.mode = m; $("app").dataset.mode = m; [].forEach.call(document.querySelectorAll("[data-mode]"), function(b){ if(b.tagName === "BUTTON") b.setAttribute("aria-selected", b.dataset.mode === m ? "true" : "false"); });
  $("appMode").hidden = m !== "app"; $("teamMode").hidden = m !== "team";
  $("pubBtn").textContent = ME.owner ? "PUBLISH…" : "SUBMIT";
  if(m === "app") renderApp(true); if(m === "team") renderTeam(); if(m === "web"){ fit(); preview(); }
  acquireWanted(); presence(); }
[].forEach.call(document.querySelectorAll("button[data-mode]"), function(b){ b.onclick = function(){ setMode(b.dataset.mode); }; });
var _setTab = setTab; setTab = function(t){ _setTab(t); acquireWanted(); presence(); };

/* ---------- start ---------- */
view(); drawLeft(); drawInsp(); fit(); status("LOADING");
var C = window.claude && window.claude.use ? window.claude : null;
function use(n){ return C ? C.use(n).catch(function(){ return null; }) : Promise.resolve(null); }
Promise.all([use("user"), use("db"), use("sample"), use("downloads"), use("room")]).then(function(r){ user = r[0]; db = r[1]; sample = r[2]; downloads = r[3]; room = r[4];
  if(C && (!user || !db)){ $("gate").classList.add("on"); $("gateT").textContent = "Sign in to claude.ai with access to this page to edit. FPLN Studio keeps the team's work in a shared draft."; }
  return user ? Promise.all([user.isOwner(), user.me().catch(function(){ return null; })]) : [false, null]; })
  .then(function(r){ ME.owner = !!r[0]; ME.id = (r[1] && r[1].id) || null; ME.name = (r[1] && r[1].name) || "You";
    if(ME.owner) use("mcp").then(function(m){ mcp = m; });
    $("pubBtn").textContent = ME.owner ? "PUBLISH…" : "SUBMIT";
    if(room){ room.onPeers(function(ch){ PEERS = ch.peers.slice(); drawPeople(); }); presence(); }
    if(!db) return null;
    return db.doc("draft/site_meta").get().then(function(d){ var x = d && d.exists ? d.data() : null; if(x && x.site){ var m = JSON.parse(x.site); S.site = {v:3, title:m.title || "", theme:m.theme || {}, nav:m.nav || {}, pages:m.pages.map(function(p){ return {slug:p.slug, label:p.label, title:p.title || "", inNav:p.inNav, blocks:[]}; })}; SAVED["draft/site_meta"] = JSON.stringify({site:x.site}); return true; }
        /* first run: start from the published site.json (built into the page) */
        DIRTY["draft/site_meta"] = 1; S.site.pages.forEach(function(p){ DIRTY["draft/page_" + pkey(p.slug)] = 1; }); return false; })
      .then(function(had){ if(!had) return; return Promise.all(S.site.pages.map(function(p){ return db.doc("draft/page_" + pkey(p.slug)).get().then(function(d){ var x = d && d.exists ? d.data() : null; if(!x || !x.blocks) return; SAVED["draft/page_" + pkey(p.slug)] = JSON.stringify({blocks:x.blocks});
          return restoreImgs(JSON.parse(x.blocks)).then(function(full){ p.blocks = full; }); }); })); })
      .then(function(){ return Promise.all(APPSECS.filter(function(x){ return x[0] !== "links"; }).map(function(x){ return db.doc("draft/app_" + x[0]).get().then(function(d){ var y = d && d.exists ? d.data() : null; if(y && y.data){ try{ S.app[x[0]] = JSON.parse(y.data); SAVED["draft/app_" + x[0]] = JSON.stringify({data:y.data}); }catch(e){} } }); })); }); })
  .then(function(){ view(); changed({}); loaded = true; status(db ? "✓ READY" : "NOT SAVED · LOCAL ONLY", db ? "ok" : "warn"); subscribe(); loadActs(); return acquireWanted(); })
  .then(function(){ if(Object.keys(DIRTY).length && db) queueSave(); /* first run: seed the shared draft from the live site */ })
  .catch(function(e){ loaded = true; status("NOT SAVED", "warn"); });
