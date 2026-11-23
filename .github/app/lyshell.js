/* FPLN layout in the app shell: reads the team layout (layout.json, published from FPLN Studio after the owner
   approves), lays out the menu, Home and Home tiles, shows custom sections on Home or as their own page, rings
   their reminders, and gives each cadet an Arrange dialog to change their own copy (saved on this device only).
   Synced into index.html by .github/app/sync.py (between the LYSHELL markers). Needs FPLNLY (lycore.js). */
window.FPLN_LAYOUT = (function(){
  "use strict";
  var L = FPLNLY, TEAM = null, ME = {}, KEY = "fpln:layout", MEKEY = "fpln:layout:me";
  function ls(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }
  function lset(k, v){ try{ if(v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); }catch(e){} }
  try{ var c0 = JSON.parse(ls(KEY) || "null"); if(c0 && c0.c) TEAM = L.clean(c0.c); }catch(e){}
  try{ ME = JSON.parse(ls(MEKEY) || "{}") || {}; }catch(e){ ME = {}; }
  /* each cadet's tracker, checklist and reminder answers, on this device only */
  var STORE = {get:function(k){ try{ return JSON.parse(ls("fpln:x:" + k) || "null"); }catch(e){ return null; } }, set:function(k, v){ lset("fpln:x:" + k, JSON.stringify(v)); }};
  function eff(){ return L.merge(TEAM, ME); }
  function secOf(id){ return (TEAM && TEAM.sections || []).filter(function(s){ return s.id === id; })[0] || null; }
  function $(id){ return document.getElementById(id); }
  function esc(s){ return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; }); }
  function ctx(){ return {store:STORE, go:function(to){ try{ FPLN.open(to); }catch(e){} }, askNotify:function(){ try{ FPLN.alert.askNotify(); }catch(e){} }}; }

  /* ---- the menu bar ---- */
  var HOMESEL = {appbar:"#appbar", setup:"#setupBan", notes:"#teamNotes", qotd:"#qotd", tiles:"#edc", scene:".bezel,.viewbar,.cap", dash:".dash", braindump:".qbox", alarms:"#armPanel,.dgrid", uod:".uod"};
  function navEl(k){ return document.querySelector(k.indexOf("t:") === 0 ? '[data-tool="' + k.slice(2) + '"]' : '[data-nav="' + k + '"]'); }
  function label(b, txt){ if(!b.hasAttribute("data-lyn")){ var t0 = [].filter.call(b.childNodes, function(n){ return n.nodeType === 3 && n.nodeValue.trim(); })[0]; b.setAttribute("data-lyn", t0 ? t0.nodeValue.trim() : ""); }
    var t = [].filter.call(b.childNodes, function(n){ return n.nodeType === 3 && n.nodeValue.trim(); })[0]; if(t) t.nodeValue = txt; else b.appendChild(document.createTextNode(txt)); }
  function paintShell(E){ var nav = document.querySelector("nav.bar"); if(!nav) return; var tools = nav.querySelector(".tools");
    [].forEach.call(nav.querySelectorAll("[data-lyx]"), function(b){ if(!E.nav.some(function(x){ return x.k === b.getAttribute("data-nav"); })) b.remove(); });
    E.nav.forEach(function(it){ var b = navEl(it.k);
      if(!b && it.custom){ b = document.createElement("button"); b.type = "button"; b.setAttribute("data-nav", it.k); b.setAttribute("data-lyx", "1"); b.appendChild(L.svg(document, it.custom.icon)); b.appendChild(document.createTextNode(it.n)); }
      if(!b) return; if(it.custom){ var sv = b.querySelector("svg"); if(sv) sv.innerHTML = L.ICON[it.custom.icon] || L.ICON.star; }
      label(b, it.n); b.classList.toggle("lyhide", !!it.hide);
      if(it.tool){ if(tools) tools.appendChild(b); } else nav.insertBefore(b, tools || null); }); }

  /* ---- a custom section as its own page ---- */
  var curX = null;
  function view(){ var v = $("vX"); if(v) return v; v = document.createElement("section"); v.className = "vx"; v.id = "vX"; v.hidden = true; v.setAttribute("aria-label", "Section");
    var w = document.createElement("div"); w.className = "xwrap"; var c = document.createElement("div"); c.id = "vXc"; w.appendChild(c); v.appendChild(w); var vs = $("views"); if(vs) vs.appendChild(v); return v; }
  function showPage(id){ var s = secOf(id); curX = id; var v = view(); if(!s){ v.hidden = true; return false; }
    L.render(document, $("vXc"), s, ctx()); v.hidden = false; v.scrollTop = 0; return true; }
  /* open("x:id"): its page, or its card on Home when it only lives on Home */
  function open(v){ var id = v.slice(2), s = secOf(id); if(!s) return "home";
    if(s.place === "home"){ setTimeout(function(){ try{ var d = $("fHome").contentDocument, el = d.querySelector('.wrap > [data-x="' + id + '"]'); if(el) el.scrollIntoView({behavior:"smooth", block:"start"}); }catch(e){} }, 60); return "home"; }
    showPage(id); return null; }

  /* ---- Home: section order, hidden sections, custom cards, tiles ---- */
  function paintHome(E){ var d; try{ d = $("fHome").contentDocument; }catch(e){ return; } if(!d || !d.head) return; var wrap = d.querySelector(".wrap"); if(!wrap) return;
    var css = "", ordered = !!((TEAM && TEAM.home && TEAM.home.length) || (ME.home && ME.home.order && ME.home.order.length)), i = 0;
    E.home.forEach(function(it){ var sel = it.custom ? '.wrap > [data-x="' + it.custom.id + '"]' : HOMESEL[it.k]; if(!sel) return; var S = sel.split(",");
      if(ordered && !it.inside){ i++; css += S.map(function(s){ return "body.app " + s.trim(); }).join(",") + "{order:" + i + "!important}\n"; }
      if(it.hide) css += S.map(function(s){ return s.trim(); }).join(",") + "{display:none!important}\n"; });
    var st = d.getElementById("fplnLayoutCss"); if(!st){ st = d.createElement("style"); st.id = "fplnLayoutCss"; d.head.appendChild(st); } if(st.textContent !== css) st.textContent = css;
    var want = E.home.filter(function(it){ return it.custom; });
    [].forEach.call(wrap.querySelectorAll(":scope > [data-x]"), function(el){ if(!want.some(function(it){ return it.custom.id === el.getAttribute("data-x"); })) el.remove(); });
    want.forEach(function(it){ var el = wrap.querySelector(':scope > [data-x="' + it.custom.id + '"]'); if(!el){ el = d.createElement("section"); wrap.appendChild(el); }
      var sig = JSON.stringify(it.custom) + "|" + L.ymd(new Date()); if(el.getAttribute("data-sig") !== sig || !el.firstChild){ L.render(d, el, it.custom, ctx()); el.setAttribute("data-sig", sig); } }); }
  /* Home calls this with its tile list before drawing it */
  function tiles(T){ var E = eff(), by = {}; T.forEach(function(t){ by[t.go] = t; }); var out = [];
    E.tiles.forEach(function(it){ if(it.hide) return; if(it.custom){ var s = it.custom; out.push({go:"x:" + s.id, c:s.color, l:it.n, b:s.tileText || s.title, s:s.place === "home" ? "On your Home" : "Tap to open"}); return; }
      var t = by[it.k]; if(!t) return; if(it.n !== it.def) t.l = it.n; out.push(t); delete by[it.k]; });
    Object.keys(by).forEach(function(k){ if(!E.tiles.some(function(it){ return it.k === k; })) out.push(by[k]); });
    return out; }
  function apply(){ var E = eff(); try{ paintShell(E); }catch(e){} try{ paintHome(E); }catch(e){}
    if(curX && !$("vX").hidden){ if(!secOf(curX)) { try{ FPLN.open("home"); }catch(e){} } else showPage(curX); }
    try{ var h = FPLN.home(); if(h && h.refresh) h.refresh(); }catch(e){}
    try{ var v = FPLN.view(); var it = E.nav.filter(function(x){ return x.k === v; })[0]; if(it && it.hide) FPLN.open("home"); }catch(e){} }

  /* ---- fetching the team layout ---- */
  function fetchTeam(){ var u; try{ u = new URL("layout.json", location.href).href; }catch(e){ return; } fetchTeam.last = Date.now();
    try{ fetch(u + "?t=" + Date.now(), {cache:"no-store"}).then(function(r){ return r.ok ? r.json() : null; }).then(function(j){ if(!j) return; var c = L.clean(j); if(!c) return;
      var was = JSON.stringify(TEAM); TEAM = c; lset(KEY, JSON.stringify({at:Date.now(), c:c})); if(was !== JSON.stringify(TEAM)) apply(); }).catch(function(){}); }catch(e){} }

  /* ---- reminders from custom sections ---- */
  var toastT = null;
  function toast(title, body){ var t = $("lyToast"); if(!t){ t = document.createElement("div"); t.id = "lyToast"; t.className = "lytoast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.textContent = ""; var b = document.createElement("b"); b.textContent = title; t.appendChild(b); if(body){ var p = document.createElement("span"); p.textContent = body; t.appendChild(p); }
    var x = document.createElement("button"); x.type = "button"; x.textContent = "OK"; x.onclick = function(){ t.classList.remove("on"); }; t.appendChild(x); t.classList.add("on"); clearTimeout(toastT); toastT = setTimeout(function(){ t.classList.remove("on"); }, 60000); }
  function ring(){ if(!TEAM || window.FPLN_LOCKED) return; var now = new Date(), fired = {}; try{ fired = JSON.parse(ls("fpln:x:fired") || "{}") || {}; }catch(e){}
    var td = L.ymd(now), changed = false;
    L.due(TEAM, now, STORE).forEach(function(r){ if(fired[r.key] === td) return; fired[r.key] = td; changed = true;
      var title = r.block.label || r.sec.title, body = r.block.text || r.sec.title; toast(title, body); try{ FPLN.alert.notify(title, body, "fpln-x-" + r.key, false); }catch(e){} });
    if(changed){ Object.keys(fired).forEach(function(k){ if(fired[k] !== td) delete fired[k]; }); lset("fpln:x:fired", JSON.stringify(fired)); } }

  /* ---- Arrange: each cadet's own layout, on this device ---- */
  var GN = {nav:"Menu", home:"Home", tiles:"Home tiles"}, tab = "nav";
  function saveMe(){ lset(MEKEY, Object.keys(ME).length ? JSON.stringify(ME) : null); apply(); paint(); }
  function paint(){ var box = $("lyList"); if(!box || $("lyM").hidden) return; var E = eff(), G = E[tab];
    [].forEach.call(document.querySelectorAll("#lyTabs [data-lyt]"), function(b){ b.setAttribute("aria-selected", String(b.dataset.lyt === tab)); });
    var movable = G.filter(function(x){ return !x.inside; });
    box.innerHTML = G.map(function(it){ var mi = movable.indexOf(it);
      return '<li' + (it.inside ? ' class="in"' : '') + '><div><b>' + esc(it.n) + '</b><small>' + esc(it.custom ? "From the FPLN team" : it.inside ? "Inside " + (E.home.filter(function(x){ return x.k === it.inside; })[0] || {}).n : it.n !== it.def ? it.def : (tab === "nav" && it.tool ? "Tool" : "")) + '</small></div>' +
        (it.inside ? "" : '<button type="button" class="lymv" data-lyup="' + esc(it.k) + '" aria-label="Move ' + esc(it.n) + ' up"' + (mi > 0 ? "" : " disabled") + '>↑</button><button type="button" class="lymv" data-lydn="' + esc(it.k) + '" aria-label="Move ' + esc(it.n) + ' down"' + (mi < movable.length - 1 ? "" : " disabled") + '>↓</button>') +
        (it.lock ? '<span class="lylock">Always on</span>' : '<button type="button" class="mtg" role="switch" data-lysw="' + esc(it.k) + '" aria-checked="' + !it.hide + '" aria-label="Show ' + esc(it.n) + '"></button>') + '</li>'; }).join("");
    $("lyReset").disabled = !Object.keys(ME).length; }
  function move(k, dir){ var E = eff(), keys = E[tab].filter(function(x){ return !x.inside; }).map(function(x){ return x.k; }), i = keys.indexOf(k), j = i + dir; if(i < 0 || j < 0 || j >= keys.length) return;
    var t = keys[i]; keys[i] = keys[j]; keys[j] = t; ME[tab] = ME[tab] || {}; ME[tab].order = keys; saveMe(); }
  function toggle(k, show){ ME[tab] = ME[tab] || {}; ME[tab].hide = ME[tab].hide || {}; ME[tab].hide[k] = !show;
    var team = L.merge(TEAM, {})[tab].filter(function(x){ return x.k === k; })[0]; if(team && team.hide === !show) delete ME[tab].hide[k]; saveMe(); }
  function openDlg(){ var d = $("lyM"); if(!d) return; d.hidden = false; paint(); try{ $("lyX").focus(); }catch(e){} }
  function close(){ var d = $("lyM"); if(d) d.hidden = true; }
  function wire(){ var d = $("lyM"); if(!d) return;
    $("lyX").onclick = close; $("lyDone").onclick = close;
    $("lyReset").onclick = function(){ ME = {}; saveMe(); };
    d.addEventListener("click", function(e){ if(e.target === d) return close(); var t;
      if((t = e.target.closest("[data-lyt]"))){ tab = t.dataset.lyt; paint(); return; }
      if((t = e.target.closest("[data-lyup]"))) return move(t.dataset.lyup, -1);
      if((t = e.target.closest("[data-lydn]"))) return move(t.dataset.lydn, 1);
      if((t = e.target.closest("[data-lysw]"))) return toggle(t.dataset.lysw, t.getAttribute("aria-checked") !== "true"); });
    document.addEventListener("keydown", function(e){ if(e.key === "Escape" && !d.hidden) close(); });
    if($("dLay")) $("dLay").onclick = function(){ try{ $("disp").hidden = true; }catch(e){} openDlg(); };
    if($("modsLay")) $("modsLay").onclick = function(){ try{ FPLN_MODS.close(); }catch(e){} openDlg(); };
    apply(); }
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", wire); else setTimeout(wire, 0);
  setTimeout(fetchTeam, 1500); setInterval(fetchTeam, 30 * 60000);
  document.addEventListener("visibilitychange", function(){ if(!document.hidden && Date.now() - (fetchTeam.last || 0) > 10 * 60000) fetchTeam(); });
  setInterval(ring, 20000);
  /* links like afpln.github.io/aFPLN/#go=tasks open FPLN on that page (used by the email tour and the Teams card) */
  function goHash(){ var m = /[#&]go=(home|ops|tasks|opord|brief|map|set|x:[a-z0-9-]{1,24})(?:&|$)/.exec(location.hash); if(!m) return; var to = m[1];
    try{ history.replaceState(null, "", location.pathname + location.search); }catch(e){}
    var n = 0; (function tryOpen(){ n++; try{ if(window.FPLN && FPLN.open && $("fHome") && $("fHome").contentDocument && $("fHome").contentDocument.readyState === "complete"){ FPLN.open(to); return; } }catch(e){} if(n < 40) setTimeout(tryOpen, 250); })(); }
  setTimeout(goHash, 600); window.addEventListener("hashchange", goHash);
  return {apply:apply, paintHome:function(){ try{ paintHome(eff()); }catch(e){} }, tiles:tiles, open:open, showPage:showPage, hidePage:function(){ var v = $("vX"); if(v) v.hidden = true; curX = null; },
    arrange:openDlg, effective:eff, team:function(){ return TEAM; }, mine:function(){ return ME; },
    summary:function(){ return (TEAM ? "team " + (TEAM.sections || []).length + "x" : "default") + (Object.keys(ME).length ? "+own" : ""); }};
})();
