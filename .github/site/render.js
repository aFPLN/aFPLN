/* FPLN launch page engine (site.json v2). Shared by the live install page and the FPLN Site Builder preview.
   Everything from site.json is placed with textContent; images only from built-in keys or small data:image URIs;
   colors only #rrggbb; fonts only from the allowlist. No HTML from data, ever. */
var FPLNSITE = (function(){
  "use strict";
  var FONTS = ["Chakra Petch","Barlow","Inter","Oswald","Rajdhani","Teko","Bebas Neue","Montserrat","Saira","Saira Condensed","Exo 2","Orbitron","Roboto","Roboto Condensed","Source Sans 3","Merriweather","Playfair Display","Space Grotesk","IBM Plex Sans","IBM Plex Mono","B612","B612 Mono","Archivo","Archivo Black","Black Ops One","Stardos Stencil","Allerta Stencil","Russo One","Titillium Web","Barlow Condensed"];
  var IMG = {"@desktop":"shot-desktop.png", "@phone":"shot-phone.png", "@banner":"../share/banner.png", "@preview":"../share/og.png", "@icon":"../icons/icon-512.png", "@badge":"../share/badge.png"};
  var ICONS = {
    clock:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3.2 2"/>', bell:'<path d="M6 17V11a6 6 0 0 1 12 0v6l1.5 1.5h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
    list:'<path d="M9 6h11M9 12h11M9 18h11"/><path d="M3.5 6l1.2 1.2L7 5M3.5 12l1.2 1.2L7 11M3.5 18l1.2 1.2L7 17"/>', doc:'<path d="M8 4h9l3 3v13H8z"/><path d="M4 8v12h12"/><path d="M11 11h6M11 15h6"/>',
    pin:'<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/>', calendar:'<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><path d="M3.5 9h17M8 3v3M16 3v3"/>', plane:'<path d="M10.5 20l1.5-1 1.5 1v-3.5L21 13v-2l-7.5 2.5V6.5a1.5 1.5 0 0 0-3 0v7L3 11v2l7.5 3.5z"/>',
    shield:'<path d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6z"/><path d="M9 12l2 2 4-4"/>', plane:'<path d="M3 13.5l7-1.5 4.5-7.5 2 .5-2 7.5 5.5.5 1 2-6.5 1-3 5.5-2-.5 1-5.5-6.5-1z"/>',
    phone:'<rect x="7" y="3" width="10" height="18" rx="2"/><path d="M11 18h2"/>', laptop:'<rect x="5" y="5" width="14" height="10" rx="1.5"/><path d="M3 18h18"/>',
    star:'<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z"/>', download:'<path d="M12 4v11M7 10.5l5 5 5-5M5 19.5h14"/>',
    check:'<path d="M5 12.5l4.2 4.2L19 7"/>', bolt:'<path d="M13 3L5 14h6l-1 7 8-11h-6z"/>', flag:'<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>', users:'<circle cx="9" cy="8" r="3.2"/><path d="M3 19c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5"/><path d="M16 5.2a3 3 0 0 1 0 5.6M18 13.8c2 .8 3 2.6 3 5.2"/>',
    book:'<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20"/>', target:'<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>',
    wifi:'<path d="M2.5 9a14 14 0 0 1 19 0M5.5 12.5a9.5 9.5 0 0 1 13 0M8.5 16a5 5 0 0 1 7 0"/><circle cx="12" cy="19.2" r="1"/>', lock:'<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>',
    chat:'<path d="M4 5h16v11H9l-5 4z"/>', none:''};
  var TYPES = ["hero","heading","text","cards","image","callout","ways","faq","button","quote","banner","spacer","divider","footer"];
  var ACTIONS = {install:1, top:1, share:"../share/", app:"../", zip:"FPLN-beta.zip"};
  function hex(v, d){ return typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v) ? v : d; }
  function str(v, n){ return typeof v === "string" ? v.slice(0, n || 600) : ""; }
  function pick(v, list, d){ return list.indexOf(v) >= 0 ? v : d; }
  var IMGMAP = {};   /* the builder preview supplies its own copies of the built-in pictures */
  function img(v, base){ if(typeof v !== "string") return ""; if(IMG[v]) return IMGMAP[v] || (base || "") + IMG[v];
    return /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+\/=]+$/.test(v) && v.length < 600000 ? v : ""; }
  function el(tag, cls, text){ var e = document.createElement(tag); if(cls) e.className = cls; if(text != null && text !== "") e.textContent = text; return e; }
  function icon(name){ var s = document.createElementNS("http://www.w3.org/2000/svg", "svg"); s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("aria-hidden", "true");
    s.innerHTML = ICONS.hasOwnProperty(name) ? ICONS[name] : ICONS.star; return s; }   /* fixed, built-in icon markup only */
  /* **bold** and line breaks inside plain text */
  function rich(node, text){ str(text, 3000).split(/\n{2,}/).forEach(function(par, i){ var p = el("p"); par.split(/(\*\*[^*]+\*\*)/).forEach(function(bit){
      if(/^\*\*[^*]+\*\*$/.test(bit)) p.appendChild(el("b", "", bit.slice(2, -2))); else bit.split("\n").forEach(function(line, j){ if(j) p.appendChild(document.createElement("br")); if(line) p.appendChild(document.createTextNode(line)); }); });
    node.appendChild(p); }); }
  function gold(node, text){ var v = str(text, 120), m = v.match(/^(.*?)\[(.+?)\](.*)$/); if(!m){ node.textContent = v; return; }
    node.appendChild(document.createTextNode(m[1])); node.appendChild(el("span", "gd", m[2])); node.appendChild(document.createTextNode(m[3])); }
  var ED = false;   /* edit mode: the builder marks editable text */
  function k(node, bid, key){ if(ED){ node.setAttribute("data-b", bid); node.setAttribute("data-k", key); } return node; }
  function installBtn(b, bid, pre){ var a = el("button", "go"); a.type = "button"; a.setAttribute("data-install", "1"); a.appendChild(icon("download"));
    var t = el("span"), l = k(el("span", "goT", str(b[pre+"label"] || b.button || "Install FPLN", 60)), bid, pre ? pre+"label" : "button"), s = k(el("small", "goS", str(b[pre+"sub"] || b.buttonSub || "Free · one click", 60)), bid, pre ? pre+"sub" : "buttonSub");
    t.appendChild(l); t.appendChild(s); a.appendChild(t); return a; }
  function frame(src, kind, alt){ var w = el("div", "fr fr-"+kind), i = el("img"); i.src = src; i.alt = str(alt, 200); i.loading = "lazy"; i.decoding = "async"; w.appendChild(i); return w; }
  var R = {};
  R.hero = function(b, bid, base){ var s = el("div", "hero side-"+pick(b.side, ["right","left","below","none"], "right")), c = el("div", "hc");
    if(b.kicker) c.appendChild(k(el("p", "kick", str(b.kicker, 120)), bid, "kicker"));
    if(b.wordmark !== "") c.appendChild(k(el("h1", "wm wm-"+pick(b.wm, ["s","m","l"], "m"), str(b.wordmark || "FPLN", 24)), bid, "wordmark"));
    if(b.tagline){ var tg = el("p", "tag"); gold(tg, b.tagline); c.appendChild(k(tg, bid, "tagline")); }
    if(b.subline) c.appendChild(k(el("p", "subl", str(b.subline, 120)), bid, "subline"));
    if(b.lead) c.appendChild(k(el("p", "lead", str(b.lead, 600)), bid, "lead"));
    var cta = el("div", "cta"); if(b.button !== "") cta.appendChild(installBtn(b, bid, ""));
    var bl = Array.isArray(b.bullets) ? b.bullets.slice(0, 6) : []; if(bl.length){ var m = el("div", "meta"); bl.forEach(function(x, i){ m.appendChild(k(el("span", "", str(x, 80)), bid, "bullets."+i)); }); cta.appendChild(m); }
    cta.appendChild(el("div", "msgbox")); if(b.showAlt !== false){ var al = el("p", "alt"); al.setAttribute("data-alt", "1"); cta.appendChild(al); }
    c.appendChild(cta); s.appendChild(c);
    var d = img(b.image, base), ph = img(b.phone, base);
    if(b.side !== "none" && (d || ph)){ var sh = el("div", "shots"); if(d) sh.appendChild(frame(d, "laptop", b.imageAlt || "FPLN on a laptop")); if(ph) sh.appendChild(frame(ph, d ? "phone" : "phone solo", "FPLN on a phone")); s.appendChild(sh); }
    return s; };
  R.heading = function(b, bid){ var s = el("div", "hd hd-"+pick(b.size, ["s","m","l"], "m")); s.appendChild(k(el("h2", "", str(b.title, 160)), bid, "title")); if(b.sub) s.appendChild(k(el("p", "sub", str(b.sub, 400)), bid, "sub")); return s; };
  R.text = function(b, bid){ var s = k(el("div", "txt"), bid, "text"); rich(s, b.text); return s; };
  R.cards = function(b, bid){ var s = el("div"); if(b.title) s.appendChild(k(el("h2", "", str(b.title, 160)), bid, "title")); if(b.sub) s.appendChild(k(el("p", "sub", str(b.sub, 400)), bid, "sub"));
    var g = el("div", "cards c"+Math.max(1, Math.min(4, +b.cols || 3))+(b.numbered ? " num" : "")+(b.look === "plain" ? " plain" : ""));
    (Array.isArray(b.items) ? b.items.slice(0, 12) : []).forEach(function(it, i){ var c = el("div", "card"); if(b.numbered) c.appendChild(el("span", "n", (i < 9 ? "0" : "")+(i + 1)));
      else if(it.icon && it.icon !== "none") c.appendChild(icon(it.icon));
      c.appendChild(k(el("b", "", str(it.t, 120)), bid, "items."+i+".t")); c.appendChild(k(el("span", "", str(it.d, 400)), bid, "items."+i+".d")); g.appendChild(c); });
    s.appendChild(g); return s; };
  R.image = function(b, bid, base){ var src = img(b.src, base), s = el("figure", "im w-"+pick(b.width, ["full","wide","medium","small"], "wide"));
    if(src) s.appendChild(frame(src, pick(b.frame, ["none","rounded","laptop","phone"], "rounded"), b.alt)); else s.appendChild(el("div", "noimg", "Add an image"));
    if(b.caption) s.appendChild(k(el("figcaption", "", str(b.caption, 300)), bid, "caption")); return s; };
  R.callout = function(b, bid){ var s = el("div", "callout t-"+pick(b.tone, ["gold","sky","red"], "gold")); s.appendChild(icon(b.icon || "shield"));
    var d = el("div"); d.appendChild(k(el("b", "", str(b.title, 160)), bid, "title")); d.appendChild(k(el("p", "", str(b.text, 800)), bid, "text")); s.appendChild(d); return s; };
  R.ways = function(b, bid){ var s = el("div"); if(b.title) s.appendChild(k(el("h2", "", str(b.title, 160)), bid, "title")); if(b.sub) s.appendChild(k(el("p", "sub", str(b.sub, 400)), bid, "sub"));
    var g = el("div", "cards c"+Math.max(1, Math.min(4, (b.items || []).length || 3)));
    (Array.isArray(b.items) ? b.items.slice(0, 6) : []).forEach(function(it, i){ var c = el("div", "card way"); c.appendChild(k(el("b", "", str(it.t, 120)), bid, "items."+i+".t")); c.appendChild(k(el("span", "", str(it.d, 500)), bid, "items."+i+".d"));
      var act = pick(it.action, ["zip","app","share","install","none"], "none"); if(act !== "none" && it.label){ var a = el("a", "b2", str(it.label, 60)); if(act === "install"){ a.href = "#"; a.setAttribute("data-install-link", "1"); } else { a.href = ACTIONS[act]; if(act === "zip"){ a.setAttribute("download", ""); a.insertBefore(icon("download"), a.firstChild); } } c.appendChild(a); }
      g.appendChild(c); }); s.appendChild(g); return s; };
  R.faq = function(b, bid){ var s = el("div"); s.appendChild(k(el("h2", "", str(b.title || "Questions", 160)), bid, "title"));
    (Array.isArray(b.items) ? b.items.slice(0, 20) : []).forEach(function(it, i){ var d = el("details"), q = k(el("summary", "", str(it.q, 200)), bid, "items."+i+".q"), a = k(el("p", "", str(it.a, 1000)), bid, "items."+i+".a"); d.appendChild(q); d.appendChild(a); if(ED) d.open = true; s.appendChild(d); }); return s; };
  R.button = function(b, bid){ var s = el("div", "btnrow"), act = pick(b.action, ["install","top","share","app","zip"], "install");
    if(act === "install") s.appendChild(installBtn(b, bid, "")); else { var a = el("a", "go"), t = el("span"); a.href = act === "top" ? "#top" : ACTIONS[act]; if(act === "zip") a.setAttribute("download", ""); a.appendChild(icon(act === "zip" ? "download" : "plane"));
      t.appendChild(k(el("span", "goT", str(b.button || "Open FPLN", 60)), bid, "button")); if(b.buttonSub) t.appendChild(k(el("small", "goS", str(b.buttonSub, 60)), bid, "buttonSub")); a.appendChild(t); s.appendChild(a); }
    s.appendChild(el("div", "msgbox")); return s; };
  R.quote = function(b, bid){ var s = el("blockquote", "qt"); s.appendChild(k(el("p", "", "“"+str(b.text, 500)+"”"), bid, "text")); if(b.by) s.appendChild(k(el("cite", "", "— "+str(b.by, 120)), bid, "by")); return s; };
  R.banner = function(b, bid){ var s = el("div", "strip t-"+pick(b.tone, ["gold","sky","red"], "gold")); s.appendChild(icon(b.icon || "bolt")); s.appendChild(k(el("span", "", str(b.text, 300)), bid, "text")); return s; };
  R.spacer = function(b){ return el("div", "spc s-"+pick(b.size, ["s","m","l"], "m")); };
  R.divider = function(){ return el("hr", "dv"); };
  R.footer = function(b, bid){ return k(el("p", "foot", str(b.text, 600)), bid, "text"); };
  var FONTLINK = {};
  function font(name, fallback){ var f = FONTS.indexOf(name) >= 0 ? name : fallback; if(!FONTLINK[f] && typeof document !== "undefined" && !document.querySelector('link[data-font="'+f+'"]')){ FONTLINK[f] = 1;
      var l = document.createElement("link"); l.rel = "stylesheet"; l.setAttribute("data-font", f); l.href = "https://fonts.googleapis.com/css2?family="+f.replace(/ /g, "+")+":wght@400;500;600;700;800&display=swap"; document.head.appendChild(l); }
    return '"'+f+'","Segoe UI",system-ui,sans-serif'; }
  function render(spec, root, opts){ opts = opts || {}; ED = !!opts.edit; IMGMAP = opts.imgs || {}; var base = opts.base || "";
    if(!spec || spec.v !== 2 || !Array.isArray(spec.blocks)) return false;
    var th = spec.theme || {}, H = document.documentElement.style;
    [["bg","--bg","#060b14"],["text","--fg","#eef4fa"],["dim","--dim","#9fb2c6"],["gold","--gold","#e2bd74"],["gold2","--gold2","#f6dca2"],["sky","--sky","#8fd6ff"],["panel","--panel2","#0e182a"]].forEach(function(x){ H.setProperty(x[1], hex(th[x[0]], x[2])); });
    H.setProperty("--fd", font(th.display, "Chakra Petch")); H.setProperty("--fb", font(th.body, "Barlow"));
    H.setProperty("--r", Math.max(0, Math.min(28, +th.radius >= 0 ? +th.radius : 16))+"px");
    document.documentElement.setAttribute("data-sky", th.backdrop === false ? "off" : "on");
    if(spec.title && !opts.keepTitle) document.title = str(spec.title, 80);
    root.textContent = "";
    var nv = spec.nav || {}, nav = el("nav", "wrap topnav"); nav.id = "top"; var lg = el("img"); lg.src = IMGMAP["@logo"] || (base || "")+"../icons/icon-192.png"; lg.alt = ""; nav.appendChild(lg);
    nav.appendChild(k(el("b", "", str(nv.brand || "FPLN", 24)), "nav", "brand")); if(nv.chip) nav.appendChild(k(el("span", "chip", str(nv.chip, 20)), "nav", "chip")); nav.appendChild(el("span", "sp"));
    var main = el("main");
    spec.blocks.slice(0, 60).forEach(function(b, i){ if(!b || TYPES.indexOf(b.type) < 0) return; var bid = String(b.id || ("b"+i)).replace(/[^\w-]/g, "").slice(0, 24);
      var sec = el("section", "blk bt-"+b.type+" pad-"+pick(b.pad, ["s","m","l","none"], b.type === "spacer" || b.type === "divider" ? "none" : "m")+" bg-"+(/^#/.test(b.bg || "") ? "custom" : pick(b.bg, ["none","panel","tint","gold"], "none"))+" al-"+pick(b.align, ["left","center"], "left")+(b.hidePhone ? " hide-p" : "")+(b.hideLaptop ? " hide-l" : ""));
      if(/^#/.test(b.bg || "")) sec.style.background = hex(b.bg, "transparent");
      var anchor = String(b.anchor || "").replace(/[^a-z0-9-]/gi, "").slice(0, 30); if(anchor) sec.id = anchor;
      if(ED) sec.setAttribute("data-block", bid);
      var inner = el("div", "wrap"); inner.appendChild(R[b.type](b, bid, base)); sec.appendChild(inner); main.appendChild(sec);
      if(b.navLabel && anchor){ var a = el("a", "l hide", str(b.navLabel, 24)); a.href = "#"+anchor; nav.appendChild(a); } });
    if(nv.share !== false){ var sh = el("a", "l hide", str(nv.shareLabel || "Share", 24)); sh.href = (base || "")+"../share/"; nav.appendChild(sh); }
    if(nv.app !== false){ var ap = el("a", "l", str(nv.appLabel || "Open in browser", 24)); ap.href = (base || "")+"../"; nav.appendChild(ap); }
    root.appendChild(nav); root.appendChild(main);
    return true; }
  /* site.json v1 (simple editor) -> v2 blocks */
  function fromV1(c){ c = c || {}; var sh = c.show || {}, L = c.layout || {}, B = [];
    B.push({id:"hero", type:"hero", kicker:c.kicker, wordmark:c.wordmark || "FPLN", tagline:c.tagline, subline:c.subline, lead:c.lead, button:c.button, buttonSub:c.buttonSub, bullets:c.bullets || [], image:sh.shots === false ? "" : "@desktop", phone:sh.shots === false ? "" : "@phone", side:"right", wm:L.wordmark || "m", align:L.align || "left", hidePhone:false});
    if(sh.steps !== false && c.steps) B.push({id:"steps", type:"cards", title:c.steps.title, sub:c.steps.sub, cols:3, numbered:true, items:(c.steps.items || []).map(function(x){ return {t:x.t, d:x.d}; })});
    var ic = ["clock","bell","list","doc","pin","plane"];
    if(sh.features !== false && c.features) B.push({id:"features", type:"cards", anchor:"features", navLabel:"Features", title:c.features.title, sub:c.features.sub, cols:3, items:(c.features.items || []).map(function(x, i){ return {icon:ic[i] || "star", t:x.t, d:x.d}; })});
    if(sh.trust !== false && c.trust) B.push({id:"trust", type:"callout", icon:"shield", tone:"gold", title:c.trust.t, text:c.trust.d});
    if(sh.other !== false) B.push(DEF_WAYS());
    if(sh.faq !== false && c.faq) B.push({id:"faq", type:"faq", anchor:"faq", navLabel:"FAQ", title:c.faq.title, items:c.faq.items || []});
    B.push({id:"footer", type:"footer", pad:"m", text:c.footer || ""});
    return {v:2, title:"Get FPLN · Flight Plan (beta)", theme:{bg:"#060b14", text:"#eef4fa", dim:"#9fb2c6", gold:(c.colors || {}).gold || "#e2bd74", gold2:(c.colors || {}).gold2 || "#f6dca2", sky:(c.colors || {}).sky || "#8fd6ff", panel:"#0e182a", display:"Chakra Petch", body:"Barlow", radius:16, backdrop:true}, nav:{brand:c.wordmark || "FPLN", chip:c.chip || "BETA 1", app:true, appLabel:"Open in browser"}, blocks:B}; }
  function DEF_WAYS(){ return {id:"ways", type:"ways", anchor:"other", title:"Other ways to get FPLN", sub:"Every way gets the same app and the same automatic updates.", items:[
    {t:"Windows download", d:"A small folder with an installer shortcut, plus the keep-awake helper for overnight alarms on a laptop.", action:"zip", label:"Download (.zip)"},
    {t:"iPhone and Android", d:"iPhone: open this page in Safari, tap Share › Add to Home Screen. Android: tap Install FPLN above, or Chrome's ⋮ › Install app.", action:"none", label:""},
    {t:"Just the browser", d:"No install at all. Bookmark it; everything works, and your data stays in that browser.", action:"app", label:"Open FPLN"}]}; }
  return {render:render, fromV1:fromV1, FONTS:FONTS, ICONS:Object.keys(ICONS), ICONSRC:ICONS, TYPES:TYPES, IMG:IMG};
})();
