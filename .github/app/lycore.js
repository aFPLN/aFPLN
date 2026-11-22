/* FPLN layout core: one source for the app and FPLN Studio.
   The team's layout (layout.json, published from FPLN Studio after the owner approves) reorders, hides and renames the
   app's menu, Home sections and Home tiles, and adds custom sections built from blocks. Each cadet can rearrange their
   own copy on top of it. Everything here is plain data: text is placed with textContent, links must be https to
   .edu, .mil or .gov, and colors must be #rrggbb.
   Synced into index.html by .github/app/sync.py (between the LYCORE markers) and inlined into FPLN Studio by build.py. */
var FPLNLY = (function(){
  "use strict";
  /* ---- what the app has today ---- */
  var CAT = {
    nav:[
      {k:"home", n:"Home", lock:1}, {k:"ops", n:"Today"}, {k:"tasks", n:"Tasks"}, {k:"opord", n:"OPORD"}, {k:"brief", n:"Flight plan"},
      {k:"map", n:"Map"}, {k:"set", n:"More", lock:1},
      {k:"t:load", n:"Load", tool:1}, {k:"t:canvas", n:"Canvas", tool:1}, {k:"t:feedback", n:"Feedback", tool:1}, {k:"t:display", n:"Display", tool:1, lock:1}, {k:"t:music", n:"Music", tool:1}],
    home:[
      {k:"appbar", n:"Top bar", d:"Greeting and quick buttons"}, {k:"setup", n:"Setup reminder", d:"Shows only until setup is done"},
      {k:"notes", n:"Team announcements", d:"From the FPLN team"}, {k:"qotd", n:"Quote of the day"}, {k:"tiles", n:"Tiles", d:"Next up, Tasks and the rest"},
      {k:"scene", n:"West Point scene", d:"Live scene and weather"}, {k:"dash", n:"Brain dump & alerts"},
      {k:"braindump", n:"Brain dump", inside:"dash"}, {k:"alarms", n:"Alarm & minute calling", inside:"dash"}, {k:"uod", n:"Uniform of the day"}],
    tiles:[
      {k:"ops", n:"Next up"}, {k:"tasks", n:"Tasks"}, {k:"focus", n:"Focus"}, {k:"uod", n:"Uniform"}, {k:"wx", n:"Weather"}, {k:"mc", n:"Minute calls"},
      {k:"al", n:"Wake-up"}, {k:"opord", n:"OPORD"}, {k:"eric", n:"Eric"}, {k:"days", n:"Days ahead"}, {k:"map", n:"Post map"}, {k:"addons", n:"Add-ons"}]
  };
  var GO = ["home","ops","tasks","opord","brief","map","set","focus","days"];
  var GONAME = {home:"Home", ops:"Today", tasks:"Tasks", opord:"OPORD", brief:"Flight plan", map:"Map", set:"More", focus:"Focus mode", days:"Days ahead"};
  var ICON = {
    star:'<path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.5 6.7 19.4l1.2-6L3.4 9.3l6-.7z"/>',
    moon:'<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
    bed:'<path d="M3 18V7M3 13h18v5M21 13a3 3 0 0 0-3-3h-7v3"/><circle cx="7" cy="11" r="1.6"/>',
    heart:'<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
    run:'<circle cx="14" cy="4.5" r="1.8"/><path d="M9 21l2.5-6 3 2.5V21M6.5 12l3-4h4l2 3 3 1M11.5 15l-1-4"/>',
    book:'<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/>',
    bell:'<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
    check:'<circle cx="12" cy="12" r="8.5"/><path d="M8 12.5l2.6 2.6L16 9.5"/>',
    chart:'<path d="M4 20V4M4 20h16"/><path d="M8 16v-4M12 16V8M16 16v-6"/>',
    clock:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3 2"/>',
    flag:'<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
    shield:'<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/>',
    water:'<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
    food:'<path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M17 3c-2 0-3 2.5-3 6h3v12"/>',
    brain:'<path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 3 3V4zM15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-3 3V4z"/>',
    users:'<circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0"/><circle cx="17" cy="9" r="2.4"/><path d="M15.5 14.2A5 5 0 0 1 21 19"/>',
    target:'<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>',
    info:'<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8v.01"/>',
    dumbbell:'<path d="M6 8v8M3.5 10v4M18 8v8M20.5 10v4M6 12h12"/>',
    map:'<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/>'
  };
  var ICONS = Object.keys(ICON);
  var BLOCKS = {
    heading:{n:"Heading", d:"A title inside the section"}, text:{n:"Text", d:"A paragraph. **bold** works."},
    tip:{n:"Tip", d:"A highlighted note"}, list:{n:"List or checklist", d:"Bullets, numbers, or boxes cadets tick"},
    tracker:{n:"Tracker", d:"Cadets log a number or yes/no each day and see their week"},
    reminder:{n:"Reminder", d:"A timed nudge cadets can switch on"}, countdown:{n:"Countdown", d:"Days until a date"},
    link:{n:"Link", d:"A web page (.edu, .mil or .gov)"}, go:{n:"Button", d:"Opens a part of FPLN"}, divider:{n:"Divider", d:"A thin line"}
  };
  var LIM = {sections:12, blocks:40, title:40, label:60, text:800, item:120, items:20};

  /* ---- checking: the same rules as .github/safety/layoutcheck.py ---- */
  var MARKS = new RegExp("\\b(" + ["FRAG" + "ORD", "OP" + "ORD\\s+\\d", "C" + "UI//", "FO" + "UO"].join("|") + ")\\b");
  function textBad(v){ v = String(v || "");
    if(/<\s*\/?\s*[a-z]|javascript:|data:|on\w+\s*=/i.test(v)) return "code or markup"; if(/https?:\/\/|www\./i.test(v)) return "a web address (use a Link block)";
    if(/\b\d{3}-\d{2}-\d{4}\b/.test(v)) return "what looks like an SSN"; if(/[\w.+-]+@[\w-]+\.[\w.]+/.test(v)) return "an email address";
    if(/\b\(?\d{3}\)?[ .-]\d{3}[ .-]\d{4}\b/.test(v)) return "a phone number"; if(MARKS.test(v)) return "controlled-information markings"; return ""; }
  function urlOk(u){ return typeof u === "string" && u.length <= 300 && /^https:\/\/([a-z0-9-]+\.)+(edu|mil|gov)(\/[\w\-.~%\/?#=&+:@!,;]*)?$/i.test(u); }
  function idOk(s){ return typeof s === "string" && /^[a-z0-9][a-z0-9-]{0,23}$/.test(s); }
  function str(v, n){ return typeof v === "string" ? v.replace(/[\u0000-\u0009\u000b-\u001f]/g, " ").slice(0, n) : ""; }
  function day(v){ return typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : ""; }
  /* problems(layout) -> list of plain-language problems (empty = fine) */
  function problems(L){ var bad = []; if(!L || typeof L !== "object" || L.v !== 1) return ["The layout file must be {v:1, ...}"];
    function t(v, where, n){ if(v == null || v === "") return; if(typeof v !== "string"){ bad.push(where + " must be text"); return; } if(v.length > n) bad.push(where + " is longer than " + n + " characters"); var b = textBad(v); if(b) bad.push(where + " contains " + b); }
    var secIds = {};
    (Array.isArray(L.sections) ? L.sections : []).forEach(function(s, i){ var W = "Section " + (i + 1);
      if(!s || typeof s !== "object"){ bad.push(W + " is not valid"); return; } if(!idOk(s.id)) bad.push(W + " needs a short id"); else if(secIds[s.id]) bad.push("Two sections share the id " + s.id); else secIds[s.id] = 1;
      W = "Section \u201c" + str(s.title, 40) + "\u201d"; t(s.title, W + " title", LIM.title); if(!String(s.title || "").trim()) bad.push("Section " + (i + 1) + " needs a title");
      if(s.icon && ICONS.indexOf(s.icon) < 0) bad.push(W + " has an unknown icon"); if(s.color && !/^#[0-9a-f]{6}$/i.test(s.color)) bad.push(W + " color must be #rrggbb");
      if(["home","page","both"].indexOf(s.place || "home") < 0) bad.push(W + " place must be home, page or both"); t(s.tileText, W + " tile text", LIM.label);
      var B = Array.isArray(s.blocks) ? s.blocks : []; if(B.length > LIM.blocks) bad.push(W + " has more than " + LIM.blocks + " blocks"); var bid = {};
      B.forEach(function(b, j){ var BW = W + " block " + (j + 1); if(!b || !BLOCKS[b.type]){ bad.push(BW + " is an unknown type"); return; }
        if(!idOk(b.id) || bid[b.id]) bad.push(BW + " needs its own id"); bid[b.id] = 1;
        t(b.text, BW, LIM.text); t(b.title, BW + " title", LIM.label); t(b.label, BW + " label", LIM.label); t(b.unit, BW + " unit", 16);
        if(b.type === "list"){ var it = Array.isArray(b.items) ? b.items : []; if(it.length > LIM.items) bad.push(BW + " has more than " + LIM.items + " items"); it.forEach(function(x, k){ t(x, BW + " item " + (k + 1), LIM.item); }); }
        if(b.type === "link" && !urlOk(b.url)) bad.push(BW + ": the link must start with https:// and go to a .edu, .mil or .gov site");
        if(b.type === "go" && GO.indexOf(b.to) < 0 && !(typeof b.to === "string" && /^x:/.test(b.to))) bad.push(BW + " opens an unknown part of FPLN");
        if(b.type === "reminder"){ if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(b.time || "")) bad.push(BW + " needs a time like 22:30"); if(b.days && !(Array.isArray(b.days) && b.days.every(function(d){ return d >= 0 && d <= 6 && d === Math.floor(d); }))) bad.push(BW + " has bad days"); }
        if(b.type === "countdown" && !day(b.date)) bad.push(BW + " needs a date");
        if(b.type === "tracker"){ if(["number","yesno","scale"].indexOf(b.kind || "number") < 0) bad.push(BW + " kind must be number, yes/no or 1-5"); ["goal","min","max"].forEach(function(f){ if(b[f] != null && b[f] !== "" && !isFinite(+b[f])) bad.push(BW + " " + f + " must be a number"); }); } }); });
    if((L.sections || []).length > LIM.sections) bad.push("More than " + LIM.sections + " custom sections");
    ["nav","home","tiles"].forEach(function(g){ var A = L[g]; if(A == null) return; if(!Array.isArray(A)){ bad.push(g + " must be a list"); return; }
      var seen = {}; A.forEach(function(x, i){ if(!x || typeof x.k !== "string"){ bad.push(g + " item " + (i + 1) + " is not valid"); return; }
        var known = CAT[g].some(function(c){ return c.k === x.k; }) || (/^x:/.test(x.k) && secIds[x.k.slice(2)]); if(!known) bad.push(g + " has an unknown item " + str(x.k, 30)); if(seen[x.k]) bad.push(g + " lists " + str(x.k, 30) + " twice"); seen[x.k] = 1;
        t(x.label, g + " " + x.k + " name", 24); var c = CAT[g].filter(function(c2){ return c2.k === x.k; })[0]; if(x.hide && c && c.lock) bad.push(c.n + " can't be hidden"); }); });
    return bad.filter(function(x, i, a){ return a.indexOf(x) === i; }); }
  /* clean(raw) -> a safe layout object (bad parts dropped), or null */
  function clean(L){ if(!L || typeof L !== "object" || L.v !== 1) return null; var o = {v:1, nav:[], home:[], tiles:[], sections:[]}, ids = {};
    (Array.isArray(L.sections) ? L.sections : []).slice(0, LIM.sections).forEach(function(s){ if(!s || !idOk(s.id) || ids[s.id] || textBad(s.title) || !str(s.title, LIM.title).trim()) return; ids[s.id] = 1;
      var x = {id:s.id, title:str(s.title, LIM.title), icon:ICONS.indexOf(s.icon) >= 0 ? s.icon : "star", color:/^#[0-9a-f]{6}$/i.test(s.color || "") ? s.color : "#e2bd74",
        place:["home","page","both"].indexOf(s.place) >= 0 ? s.place : "home", tile:!!s.tile, tileText:textBad(s.tileText) ? "" : str(s.tileText, LIM.label), blocks:[]}, bid = {};
      (Array.isArray(s.blocks) ? s.blocks : []).slice(0, LIM.blocks).forEach(function(b){ if(!b || !BLOCKS[b.type] || !idOk(b.id) || bid[b.id]) return; bid[b.id] = 1;
        var y = {id:b.id, type:b.type}, ok = true;
        ["text","title","label","unit"].forEach(function(f){ if(b[f] != null){ var v = str(b[f], f === "text" ? LIM.text : f === "unit" ? 16 : LIM.label); if(textBad(v)) ok = false; else y[f] = v; } });
        if(b.type === "heading") y.size = /^(s|m|l)$/.test(b.size) ? b.size : "m";
        if(b.type === "tip") y.tone = /^(info|good|warn)$/.test(b.tone) ? b.tone : "info";
        if(b.type === "list"){ y.style = /^(bullet|number|check)$/.test(b.style) ? b.style : "bullet"; y.reset = /^(none|daily|weekly)$/.test(b.reset) ? b.reset : "daily";
          y.items = (Array.isArray(b.items) ? b.items : []).slice(0, LIM.items).map(function(v){ return str(v, LIM.item); }).filter(function(v){ return v.trim() && !textBad(v); }); }
        if(b.type === "tracker"){ y.kind = /^(number|yesno|scale)$/.test(b.kind) ? b.kind : "number"; ["goal","min","max","step"].forEach(function(f){ if(b[f] != null && b[f] !== "" && isFinite(+b[f])) y[f] = +b[f]; }); }
        if(b.type === "reminder"){ if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(b.time || "")) ok = false; y.time = b.time; y.days = Array.isArray(b.days) ? b.days.filter(function(d){ return d >= 0 && d <= 6 && d === Math.floor(d); }) : [0,1,2,3,4,5,6]; y.on = !!b.on; }
        if(b.type === "countdown"){ if(!day(b.date)) ok = false; y.date = b.date; }
        if(b.type === "link"){ if(!urlOk(b.url)) ok = false; y.url = b.url; }
        if(b.type === "go"){ if(GO.indexOf(b.to) < 0 && !(typeof b.to === "string" && /^x:[a-z0-9-]{1,24}$/.test(b.to))) ok = false; y.to = b.to; }
        if(ok) x.blocks.push(y); });
      o.sections.push(x); });
    ["nav","home","tiles"].forEach(function(g){ var seen = {}; (Array.isArray(L[g]) ? L[g] : []).forEach(function(x){ if(!x || typeof x.k !== "string" || seen[x.k]) return;
      var c = CAT[g].filter(function(c2){ return c2.k === x.k; })[0]; if(!c && !(/^x:/.test(x.k) && ids[x.k.slice(2)])) return; seen[x.k] = 1;
      var y = {k:x.k}; if(x.hide && !(c && c.lock)) y.hide = true; var lb = str(x.label, 24); if(lb && !textBad(lb)) y.label = lb; o[g].push(y); }); });
    return o; }

  /* ---- merging: built-in catalog, then the team layout, then this cadet's own changes ---- */
  function customIn(g, L){ return (L && L.sections || []).filter(function(s){ return g === "nav" ? s.place === "page" || s.place === "both" : g === "home" ? s.place === "home" || s.place === "both" : s.tile; })
    .map(function(s){ return {k:"x:" + s.id, n:s.title, custom:s}; }); }
  /* merge(team, me) -> {nav:[], home:[], tiles:[]} each [{k, n (name shown), def (built-in name), hide, lock, custom, inside, tool}] */
  function merge(team, me){ var out = {};
    ["nav","home","tiles"].forEach(function(g){
      var base = CAT[g].map(function(c){ return {k:c.k, n:c.n, def:c.n, lock:!!c.lock, inside:c.inside || "", tool:!!c.tool, hide:false}; }).concat(customIn(g, team).map(function(c){ return {k:c.k, n:c.n, def:c.n, custom:c.custom, hide:false}; }));
      var by = {}; base.forEach(function(x){ by[x.k] = x; });
      var order = [];
      (team && team[g] || []).forEach(function(x){ var it = by[x.k]; if(!it) return; if(x.label) it.n = x.label; if(x.hide && !it.lock) it.hide = true; order.push(x.k); });
      base.forEach(function(x){ if(order.indexOf(x.k) < 0){ /* new built-ins and new sections: keep their catalog place */ var i = CAT[g].map(function(c){ return c.k; }).indexOf(x.k); var after = i > 0 ? CAT[g][i - 1].k : null, at = after ? order.indexOf(after) : -1; if(i === 0) order.unshift(x.k); else if(at >= 0) order.splice(at + 1, 0, x.k); else if(x.custom && g === "nav" && order.indexOf("set") >= 0) order.splice(order.indexOf("set"), 0, x.k); else order.push(x.k); } });
      var M = me && me[g] || {};
      if(M.hide) Object.keys(M.hide).forEach(function(k){ if(by[k] && !by[k].lock) by[k].hide = !!M.hide[k]; });
      if(Array.isArray(M.order) && M.order.length){ var pos = {}; M.order.forEach(function(k, i){ pos[k] = i; }); var tpos = {}; order.forEach(function(k, i){ tpos[k] = i; });
        order.sort(function(a, b){ var pa = a in pos ? pos[a] : 1e3 + tpos[a], pb = b in pos ? pos[b] : 1e3 + tpos[b]; return pa - pb; }); }
      out[g] = order.map(function(k){ return by[k]; }); });
    return out; }

  /* ---- custom section renderer (same in the app and in the Studio preview) ---- */
  var CSS = ".xs{display:flex;flex-direction:column;gap:10px;padding:16px 18px;border:1px solid var(--line,#2a3445);border-left:3px solid var(--xc,#e2bd74);border-radius:var(--rad,12px);background:var(--panel,#111a27);color:var(--fg,#eef3f9);font:15px/1.5 Inter,system-ui,sans-serif;text-align:left}" +
    ".xs-hd{display:flex;align-items:center;gap:10px}.xs-hd svg{width:22px;height:22px;flex:none;fill:none;stroke:var(--xc,#e2bd74);stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}.xs-hd b{font:700 13px/1 Inter,system-ui,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:var(--xc,#e2bd74)}" +
    ".xs h3{margin:2px 0 0;font:700 18px/1.25 Inter,system-ui,sans-serif}.xs h3.s{font-size:15px}.xs h3.l{font-size:23px}.xs p{margin:0;white-space:pre-line}" +
    ".xs-tip{padding:10px 12px;border-radius:10px;background:rgba(143,214,255,.08);border:1px solid rgba(143,214,255,.3)}.xs-tip.good{background:rgba(122,214,154,.08);border-color:rgba(122,214,154,.35)}.xs-tip.warn{background:rgba(226,189,116,.09);border-color:rgba(226,189,116,.4)}.xs-tip b{display:block;margin-bottom:2px}" +
    ".xs ul,.xs ol{margin:0;padding-left:22px;display:flex;flex-direction:column;gap:4px}.xs ul.ck{list-style:none;padding:0}.xs ul.ck li{display:flex;gap:10px;align-items:center}" +
    ".xs-cb{flex:none;width:24px;height:24px;border-radius:7px;border:2px solid var(--dim,#7486a0);background:none;padding:0;cursor:pointer;display:grid;place-items:center;color:#0a0f17}.xs-cb[aria-checked=true]{background:var(--xc,#e2bd74);border-color:var(--xc,#e2bd74)}.xs-cb[aria-checked=true]::after{content:'\\2713';font:800 14px/1 system-ui}.xs ul.ck li.on span{opacity:.55;text-decoration:line-through}" +
    ".xs-tr{display:flex;flex-direction:column;gap:8px;padding:12px;border-radius:10px;background:rgba(255,255,255,.03);border:1px solid var(--line,#2a3445)}.xs-tr .row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.xs-tr .lb{font-weight:600}" +
    ".xs .xs-in{width:96px;padding:8px 10px;border-radius:8px;border:1px solid var(--line,#2a3445);background:rgba(0,0,0,.25);color:inherit;font:inherit}.xs-bt{padding:8px 13px;border-radius:999px;border:1px solid var(--line,#2a3445);background:rgba(255,255,255,.05);color:inherit;font:600 13px/1 Inter,system-ui,sans-serif;cursor:pointer}.xs-bt[aria-pressed=true]{background:var(--xc,#e2bd74);color:#0a0f17;border-color:var(--xc,#e2bd74)}" +
    ".xs-bars{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;align-items:end;height:64px}.xs-bars i{display:block;border-radius:4px 4px 0 0;background:var(--xc,#e2bd74);min-height:2px;opacity:.85}.xs-bars i.no{background:rgba(255,255,255,.12)}.xs-days{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;font:600 11px/1 Inter,system-ui,sans-serif;color:var(--dim,#a9b8ca);text-align:center}.xs-sum{font-size:13px;color:var(--dim,#a9b8ca)}" +
    ".xs-rem{display:flex;gap:12px;align-items:center;justify-content:space-between;padding:10px 12px;border-radius:10px;border:1px solid var(--line,#2a3445)}.xs-rem small{display:block;color:var(--dim,#a9b8ca)}" +
    ".xs-sw{flex:none;width:46px;height:26px;border-radius:999px;border:1px solid var(--line,#2a3445);background:rgba(255,255,255,.06);position:relative;padding:0;cursor:pointer}.xs-sw::after{content:'';position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:var(--dim,#7486a0);transition:transform .15s}.xs-sw[aria-checked=true]{background:rgba(157,255,106,.2);border-color:#9dff6a}.xs-sw[aria-checked=true]::after{transform:translateX(20px);background:#9dff6a}" +
    ".xs-cd{display:flex;align-items:baseline;gap:10px}.xs-cd b{font:800 30px/1 Inter,system-ui,sans-serif;color:var(--xc,#e2bd74)}.xs-lk,.xs-go{align-self:flex-start;display:inline-flex;gap:8px;align-items:center;padding:9px 14px;border-radius:999px;border:1px solid var(--xc,#e2bd74);color:var(--xc,#e2bd74);background:none;text-decoration:none;font:600 14px/1 Inter,system-ui,sans-serif;cursor:pointer}.xs-lk small{color:var(--dim,#a9b8ca);font-weight:500}" +
    ".xs hr{border:0;border-top:1px solid var(--line,#2a3445);margin:2px 0;width:100%}.xs-empty{color:var(--dim,#a9b8ca);font-size:13px}";
  var DAYN = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  function pad(n){ return (n < 10 ? "0" : "") + n; }
  function ymd(d){ return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function weekKey(d){ var x = new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7)); return "w" + ymd(x); }
  function svg(doc, name){ var s = doc.createElementNS("http://www.w3.org/2000/svg", "svg"); s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("aria-hidden", "true"); s.innerHTML = ICON[name] || ICON.star; return s; }
  function rich(doc, el, text){ String(text || "").split(/(\*\*[^*]+\*\*)/).forEach(function(part){ if(/^\*\*[^*]+\*\*$/.test(part)){ var b = doc.createElement("strong"); b.textContent = part.slice(2, -2); el.appendChild(b); } else if(part) el.appendChild(doc.createTextNode(part)); }); }
  function css(doc){ if(doc.getElementById("fplnXsCss")) return; var s = doc.createElement("style"); s.id = "fplnXsCss"; s.textContent = CSS; (doc.head || doc.documentElement).appendChild(s); }
  function daysTxt(d){ return !d || d.length === 7 ? "every day" : d.slice().sort().join() === "1,2,3,4,5" ? "weekdays" : d.slice().sort().join() === "0,6" ? "weekends" : d.slice().sort().map(function(i){ return DAYN[i]; }).join(" "); }
  function hm12(t){ var h = +t.slice(0, 2), m = t.slice(3); return t + " (" + ((h % 12) || 12) + ":" + m + (h < 12 ? " am" : " pm") + ")"; }
  /* render(doc, el, section, ctx) — ctx: {store:{get(key), set(key, value)}, go(to), now: Date} */
  function render(doc, el, sec, ctx){ ctx = ctx || {}; css(doc); var now = ctx.now || new Date(), td = ymd(now), st = ctx.store || {get:function(){ return null; }, set:function(){}};
    el.textContent = ""; el.className = "xs"; el.style.setProperty("--xc", sec.color || "#e2bd74"); el.setAttribute("data-x", sec.id);
    var hd = doc.createElement("div"); hd.className = "xs-hd"; hd.appendChild(svg(doc, sec.icon)); var ht = doc.createElement("b"); ht.textContent = sec.title; hd.appendChild(ht); el.appendChild(hd);
    if(!sec.blocks.length){ var em = doc.createElement("p"); em.className = "xs-empty"; em.textContent = "Nothing here yet."; el.appendChild(em); }
    sec.blocks.forEach(function(b){ var K = sec.id + ":" + b.id, n;
      if(b.type === "heading"){ n = doc.createElement("h3"); n.className = b.size || "m"; n.textContent = b.text || ""; }
      else if(b.type === "text"){ n = doc.createElement("p"); rich(doc, n, b.text); }
      else if(b.type === "tip"){ n = doc.createElement("div"); n.className = "xs-tip " + (b.tone || "info"); if(b.title){ var tb = doc.createElement("b"); tb.textContent = b.title; n.appendChild(tb); } var tp = doc.createElement("p"); rich(doc, tp, b.text); n.appendChild(tp); }
      else if(b.type === "divider"){ n = doc.createElement("hr"); }
      else if(b.type === "list"){ var chk = b.style === "check"; n = doc.createElement(b.style === "number" ? "ol" : "ul"); if(chk) n.className = "ck";
        var pk = b.reset === "weekly" ? weekKey(now) : b.reset === "none" ? "all" : td, saved = st.get("l:" + K) || {}, on = saved.p === pk && Array.isArray(saved.on) ? saved.on : [];
        (b.items || []).forEach(function(it, i){ var li = doc.createElement("li"); if(chk){ var cb = doc.createElement("button"); cb.type = "button"; cb.className = "xs-cb"; cb.setAttribute("role", "checkbox"); cb.setAttribute("aria-label", it);
            var isOn = on.indexOf(i) >= 0; cb.setAttribute("aria-checked", String(isOn)); if(isOn) li.className = "on";
            cb.onclick = function(){ var s2 = st.get("l:" + K) || {}, o2 = s2.p === pk && Array.isArray(s2.on) ? s2.on.slice() : [], j = o2.indexOf(i); if(j >= 0) o2.splice(j, 1); else o2.push(i); st.set("l:" + K, {p:pk, on:o2}); var v = j < 0; cb.setAttribute("aria-checked", String(v)); li.className = v ? "on" : ""; };
            li.appendChild(cb); } var sp = doc.createElement("span"); sp.textContent = it; li.appendChild(sp); n.appendChild(li); }); }
      else if(b.type === "tracker"){ n = doc.createElement("div"); n.className = "xs-tr"; var data = st.get("t:" + K) || {}, kind = b.kind || "number";
        var lb = doc.createElement("div"); lb.className = "lb"; lb.textContent = b.label || "Today"; n.appendChild(lb);
        var row = doc.createElement("div"); row.className = "row"; n.appendChild(row);
        function put(v){ var d2 = st.get("t:" + K) || {}; if(v === null) delete d2[td]; else d2[td] = v; var ks = Object.keys(d2).sort(); while(ks.length > 120) delete d2[ks.shift()]; st.set("t:" + K, d2); render(doc, el, sec, ctx); }
        if(kind === "number"){ var inp = doc.createElement("input"); inp.type = "number"; inp.className = "xs-in"; inp.inputMode = "decimal"; if(b.min != null) inp.min = b.min; if(b.max != null) inp.max = b.max; inp.step = b.step || "any"; inp.value = data[td] != null ? data[td] : ""; inp.setAttribute("aria-label", b.label || "Today");
          var sv = doc.createElement("button"); sv.type = "button"; sv.className = "xs-bt"; sv.textContent = data[td] != null ? "Update" : "Save";
          sv.onclick = function(){ var v = inp.value === "" ? null : +inp.value; if(v !== null && !isFinite(v)) return; if(v !== null && b.min != null) v = Math.max(b.min, v); if(v !== null && b.max != null) v = Math.min(b.max, v); put(v); };
          inp.onkeydown = function(e){ if(e.key === "Enter") sv.onclick(); };
          row.appendChild(inp); if(b.unit){ var u = doc.createElement("span"); u.textContent = b.unit; row.appendChild(u); } row.appendChild(sv); }
        else { (kind === "yesno" ? [[1,"Yes"],[0,"No"]] : [[1,"1"],[2,"2"],[3,"3"],[4,"4"],[5,"5"]]).forEach(function(o){ var bt = doc.createElement("button"); bt.type = "button"; bt.className = "xs-bt"; bt.textContent = o[1]; bt.setAttribute("aria-pressed", String(data[td] === o[0])); bt.onclick = function(){ put(data[td] === o[0] ? null : o[0]); }; row.appendChild(bt); }); }
        var bars = doc.createElement("div"); bars.className = "xs-bars"; var dl = doc.createElement("div"); dl.className = "xs-days"; var vals = [];
        for(var i = 6; i >= 0; i--){ var d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i), k = ymd(d), v = data[k]; vals.push(v);
          var bi = doc.createElement("i"), top = kind === "yesno" ? 1 : kind === "scale" ? 5 : Math.max(b.goal || 0, b.max || 0, 1);
          if(kind === "number"){ var mx = Math.max.apply(null, [top].concat(Object.keys(data).map(function(q){ return +data[q] || 0; }))); top = mx; }
          if(v == null) { bi.className = "no"; bi.style.height = "2px"; } else bi.style.height = Math.max(4, Math.round((kind === "yesno" ? (v ? 1 : .08) : v / top) * 64)) + "px";
          bi.title = DAYN[d.getDay()] + ": " + (v == null ? "no entry" : kind === "yesno" ? (v ? "yes" : "no") : v + (b.unit ? " " + b.unit : "")); bars.appendChild(bi);
          var dn = doc.createElement("span"); dn.textContent = DAYN[d.getDay()].charAt(0); dl.appendChild(dn); }
        n.appendChild(bars); n.appendChild(dl);
        var got = vals.filter(function(v){ return v != null; }), sm = doc.createElement("div"); sm.className = "xs-sum";
        if(kind === "yesno"){ var streak = 0; for(var j = 0; j < 400; j++){ var dk = ymd(new Date(now.getFullYear(), now.getMonth(), now.getDate() - j)); if(data[dk] === 1) streak++; else if(j === 0 && data[dk] == null) continue; else break; }
          sm.textContent = (streak ? "Streak " + streak + " day" + (streak > 1 ? "s" : "") + " \u00b7 " : "") + got.filter(function(v){ return v === 1; }).length + " of the last 7 days"; }
        else if(got.length){ var avg = got.reduce(function(a, c){ return a + c; }, 0) / got.length; sm.textContent = "7-day average " + (Math.round(avg * 10) / 10) + (b.unit ? " " + b.unit : "") + (b.goal != null ? " \u00b7 goal " + b.goal + (b.unit ? " " + b.unit : "") : ""); }
        else sm.textContent = "No entries this week yet." + (b.goal != null ? " Goal " + b.goal + (b.unit ? " " + b.unit : "") + "." : "");
        n.appendChild(sm); var pv = doc.createElement("div"); pv.className = "xs-sum"; pv.textContent = "Saved only on this device."; n.appendChild(pv); }
      else if(b.type === "reminder"){ n = doc.createElement("div"); n.className = "xs-rem"; var tx = doc.createElement("div"), tb2 = doc.createElement("b"); tb2.textContent = b.label || "Reminder"; tx.appendChild(tb2);
        var sm2 = doc.createElement("small"); sm2.textContent = hm12(b.time) + " \u00b7 " + daysTxt(b.days) + (b.text ? " \u00b7 \u201c" + b.text + "\u201d" : ""); tx.appendChild(sm2); n.appendChild(tx);
        var r = st.get("r:" + K), onr = r && typeof r.on === "boolean" ? r.on : !!b.on, sw = doc.createElement("button"); sw.type = "button"; sw.className = "xs-sw"; sw.setAttribute("role", "switch"); sw.setAttribute("aria-checked", String(onr)); sw.setAttribute("aria-label", "Remind me: " + (b.label || "reminder"));
        sw.onclick = function(){ var v = sw.getAttribute("aria-checked") !== "true"; st.set("r:" + K, {on:v}); sw.setAttribute("aria-checked", String(v)); if(v && ctx.askNotify) ctx.askNotify(); }; n.appendChild(sw); }
      else if(b.type === "countdown"){ n = doc.createElement("div"); n.className = "xs-cd"; var p = b.date.split("-"), dd = Math.round((new Date(+p[0], +p[1] - 1, +p[2]) - new Date(now.getFullYear(), now.getMonth(), now.getDate())) / 864e5), big = doc.createElement("b"), lab = doc.createElement("span");
        big.textContent = dd > 0 ? String(dd) : dd === 0 ? "Today" : "\u2713"; lab.textContent = dd > 0 ? (dd === 1 ? "day" : "days") + " until " + (b.label || "") : dd === 0 ? b.label || "" : (b.label || "") + " has passed"; n.appendChild(big); n.appendChild(lab); }
      else if(b.type === "link"){ n = doc.createElement("a"); n.className = "xs-lk"; n.href = b.url; n.target = "_blank"; n.rel = "noopener noreferrer"; n.referrerPolicy = "no-referrer"; n.textContent = (b.label || "Open") + " \u2197 "; var dm = doc.createElement("small"); dm.textContent = b.url.replace(/^https:\/\//, "").split("/")[0]; n.appendChild(dm); }
      else if(b.type === "go"){ n = doc.createElement("button"); n.type = "button"; n.className = "xs-go"; n.textContent = (b.label || ("Open " + (GONAME[b.to] || "section"))) + " \u2192"; n.onclick = function(){ if(ctx.go) ctx.go(b.to); }; }
      if(n){ n.setAttribute("data-xb", b.id); el.appendChild(n); } });
    return el; }
  /* reminders due at this minute: [{sec, block, key}] (the app rings them; each fires once per day) */
  function due(L, now, store){ var out = [], t = pad(now.getHours()) + ":" + pad(now.getMinutes()), dw = now.getDay();
    (L && L.sections || []).forEach(function(s){ s.blocks.forEach(function(b){ if(b.type !== "reminder" || b.time !== t || (b.days || []).indexOf(dw) < 0) return; var K = s.id + ":" + b.id, r = store.get("r:" + K); if(!(r && typeof r.on === "boolean" ? r.on : b.on)) return; out.push({sec:s, block:b, key:K}); }); });
    return out; }
  return {CAT:CAT, GO:GO, GONAME:GONAME, ICON:ICON, ICONS:ICONS, BLOCKS:BLOCKS, LIM:LIM, problems:problems, clean:clean, merge:merge, render:render, due:due, urlOk:urlOk, textBad:textBad, ymd:ymd, CSS:CSS, svg:svg};
})();
if(typeof module !== "undefined" && module.exports) module.exports = FPLNLY;
