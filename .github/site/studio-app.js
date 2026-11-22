/* ---------- build the app: layout (menu, Home, tiles) and custom sections ---------- */
var LYG = [["nav","Menu","The bar at the bottom on phones, down the side on laptops."],["home","Home","The sections on the Home screen, top to bottom."],["tiles","Home tiles","The tappable tiles on Home."]];
var lyTab = "nav", lySel = null, secSel = null, blkOpen = {};
var NAVICO = {home:'<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>', ops:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3 2"/>', tasks:'<path d="M9 6h11M9 12h11M9 18h11"/><path d="M3.5 6l1.2 1.2L7 5M3.5 12l1.2 1.2L7 11M3.5 18l1.2 1.2L7 17"/>',
  opord:'<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 12h7M9 16h7"/>', brief:'<path d="M10.5 21l1.5-1 1.5 1v-3.5L21 13v-2l-7.5 2.5V6.5a1.5 1.5 0 0 0-3 0v7L3 11v2l7.5 4.5z"/>', map:'<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/>',
  set:'<circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>'};
function layoutOut(){ var o = {v:1, nav:[], home:[], tiles:[], sections:clone(S.app.sections || [])}, edited = S.app.layout || {};
  ["nav","home","tiles"].forEach(function(g){ if(edited[g] && edited[g].length) o[g] = edited[g].map(function(x){ var y = {k:x.k}; if(x.hide) y.hide = true; if(x.label) y.label = x.label; return y; }); });
  return o; }
function lyMerged(){ return FPLNLY.merge(FPLNLY.clean(layoutOut()) || {v:1, sections:[]}, {}); }
/* edit one list: start from what the app would show, change it, store the whole list */
function lyEdit(g, fn, rerender){ appEdit("layout", function(Lay){ var cur = lyMerged()[g].map(function(it){ var y = {k:it.k}; if(it.hide) y.hide = true; if(it.n !== it.def) y.label = it.n; return y; }); fn(cur); Lay[g] = cur; }, rerender); }
function layoutHTML(){ var M = lyMerged(), G = M[lyTab], info = LYG.filter(function(x){ return x[0] === lyTab; })[0];
  var h = '<h2>Layout</h2><p class="hint">Drag to reorder, switch things off, rename them. Applies to every cadet after you publish; each cadet can still rearrange their own copy in the app (Display › Arrange).</p>' +
    '<div class="seg lytabs" role="tablist">' + LYG.map(function(x){ return '<button type="button" role="tab" data-lyg="' + x[0] + '" aria-selected="' + (x[0] === lyTab) + '">' + x[1] + '</button>'; }).join("") + '</div><p class="hint" style="margin-top:8px">' + esc(info[2]) + '</p><ul class="lyl" id="lyl">';
  var movable = G.filter(function(x){ return !x.inside; });
  G.forEach(function(it){ var mi = movable.indexOf(it), canName = lyTab !== "home" && !it.custom;
    h += '<li class="' + (it.hide ? "off " : "") + (it.inside ? "in " : "") + (lySel === it.k ? "sel" : "") + '" data-lyk="' + esc(it.k) + '"' + (it.inside ? "" : ' draggable="true"') + '>' +
      (it.inside ? '<span class="grip in">↳</span>' : '<span class="grip" title="Drag to move">⠇</span>') +
      '<span class="nm">' + (canName ? '<input type="text" maxlength="24" data-lyname="' + esc(it.k) + '" value="' + esc(it.n) + '" aria-label="Name for ' + esc(it.def) + '"' + (it.lock && lyTab !== "nav" ? " disabled" : "") + '>' : '<b>' + esc(it.n) + '</b>') +
      '<small>' + (it.custom ? "Custom section" : it.tool ? "Tool" : it.n !== it.def ? "Built in: " + esc(it.def) : "Built in") + (it.inside ? " · inside " + esc((M.home.filter(function(x){ return x.k === it.inside; })[0] || {}).n || "") : "") + '</small></span>' +
      (it.inside ? "" : '<button type="button" class="sm" data-lymv="' + esc(it.k) + '.-1"' + (mi > 0 ? "" : " disabled") + ' aria-label="Move up">↑</button><button type="button" class="sm" data-lymv="' + esc(it.k) + '.1"' + (mi < movable.length - 1 ? "" : " disabled") + ' aria-label="Move down">↓</button>') +
      (it.lock ? '<span class="lyon">Always on</span>' : '<button type="button" class="sw2" role="switch" data-lyhide="' + esc(it.k) + '" aria-checked="' + !it.hide + '" aria-label="Show ' + esc(it.n) + '"></button>') + '</li>'; });
  h += '</ul><div class="acts"><button type="button" class="sm" id="lyReset">Back to the app\'s built-in ' + esc(info[1].toLowerCase()) + '</button><button type="button" class="sm" id="lyToSec">+ Add your own section</button></div>';
  return h; }
function wireLayout(){ var E = $("appEd");
  [].forEach.call(E.querySelectorAll("[data-lyg]"), function(b){ b.onclick = function(){ lyTab = b.dataset.lyg; lySel = null; renderApp(false); }; });
  [].forEach.call(E.querySelectorAll("[data-lymv]"), function(b){ b.onclick = function(){ var a = b.dataset.lymv.split("."), k = a.slice(0, -1).join("."), d = +a[a.length - 1]; lySel = k; lyMove(k, d); }; });
  [].forEach.call(E.querySelectorAll("[data-lyhide]"), function(b){ b.onclick = function(){ var k = b.dataset.lyhide, show = b.getAttribute("aria-checked") !== "true"; lySel = k; lyEdit(lyTab, function(L){ L.forEach(function(x){ if(x.k === k){ if(show) delete x.hide; else x.hide = true; } }); }, true); }; });
  [].forEach.call(E.querySelectorAll("[data-lyname]"), function(x){ x.oninput = function(){ var k = x.dataset.lyname, v = x.value.slice(0, 24), def = (lyMerged()[lyTab].filter(function(i){ return i.k === k; })[0] || {}).def;
    lyEdit(lyTab, function(L){ L.forEach(function(y){ if(y.k === k){ if(v.trim() && v !== def) y.label = v; else delete y.label; } }); }, false); }; });
  [].forEach.call(E.querySelectorAll("#lyl li"), function(li){ li.addEventListener("click", function(e){ if(e.target.closest("button,input")) return; lySel = li.dataset.lyk; [].forEach.call(E.querySelectorAll("#lyl li"), function(o){ o.classList.toggle("sel", o === li); }); drawPhone(); }); });
  /* drag to reorder */
  var drag = null;
  [].forEach.call(E.querySelectorAll('#lyl li[draggable="true"]'), function(li){
    li.addEventListener("dragstart", function(e){ drag = li.dataset.lyk; li.classList.add("drag"); try{ e.dataTransfer.setData("text/plain", drag); e.dataTransfer.effectAllowed = "move"; }catch(x){} });
    li.addEventListener("dragend", function(){ li.classList.remove("drag"); [].forEach.call(E.querySelectorAll("#lyl li"), function(o){ o.classList.remove("da","db"); }); });
    li.addEventListener("dragover", function(e){ if(!drag || drag === li.dataset.lyk) return; e.preventDefault(); var r = li.getBoundingClientRect(), after = e.clientY > r.top + r.height / 2; li.classList.toggle("db", after); li.classList.toggle("da", !after); });
    li.addEventListener("dragleave", function(){ li.classList.remove("da","db"); });
    li.addEventListener("drop", function(e){ e.preventDefault(); if(!drag) return; var r = li.getBoundingClientRect(), after = e.clientY > r.top + r.height / 2, to = li.dataset.lyk, from = drag; drag = null; lySel = from;
      lyEdit(lyTab, function(L){ var mv = L.filter(function(x){ return x.k === from; })[0]; if(!mv) return; L.splice(L.indexOf(mv), 1); var t = L.map(function(x){ return x.k; }).indexOf(to); L.splice(after ? t + 1 : t, 0, mv); }, true); }); });
  $("lyReset").onclick = function(){ appEdit("layout", function(Lay){ Lay[lyTab] = []; }, true); toast("Back to the built-in order for this list"); };
  $("lyToSec").onclick = function(){ S.appSec = "sections"; renderApp(true); acquireWanted(); }; }
function lyMove(k, d){ lyEdit(lyTab, function(L){ var M = lyMerged()[lyTab], ins = {}; M.forEach(function(x){ if(x.inside) ins[x.k] = 1; });
  var mov = L.filter(function(x){ return !ins[x.k]; }), i = mov.map(function(x){ return x.k; }).indexOf(k), j = i + d; if(i < 0 || j < 0 || j >= mov.length) return;
  var a = L.indexOf(mov[i]), b = L.indexOf(mov[j]), t = L[a]; L[a] = L[b]; L[b] = t; }, true); }
/* the phone preview: Home in its real order, the custom sections drawn for real, the menu bar at the bottom */
var PVSTORE = {}, pvStore = {get:function(k){ return PVSTORE[k] ? JSON.parse(PVSTORE[k]) : null; }, set:function(k, v){ PVSTORE[k] = JSON.stringify(v); }};
var HOMEPH = {appbar:["Good evening, Cadet", 34, "bar"], setup:["Finish setting up FPLN", 30, ""], notes:["From the FPLN team", 40, ""], qotd:["“Quote of the day”", 34, "q"], scene:["West Point scene", 92, "scene"], dash:["Brain dump & alerts", 0, ""], uod:["Uniform of the day", 74, "uod"]};
function drawLayoutPhone(P){ var M = lyMerged(), h = '<div class="lyph">', SEL = lySel;
  M.home.forEach(function(it){ if(it.hide || it.inside) return; var on = SEL === it.k ? " pk" : "";
    if(it.custom){ h += '<div class="lyx' + on + '" data-pk="' + esc(it.k) + '" data-xs="' + esc(it.custom.id) + '"></div>'; return; }
    if(it.k === "tiles"){ h += '<div class="lyt' + on + '" data-pk="tiles">' + M.tiles.filter(function(t){ return !t.hide; }).map(function(t){ var c = t.custom ? t.custom.color : "#7486a0";
        return '<span class="mt' + (SEL === t.k ? " pk" : "") + '" data-pk="' + esc(t.k) + '" style="--tc:' + esc(/^#[0-9a-f]{6}$/i.test(c) ? c : "#7486a0") + '"><i>' + esc(t.n) + '</i></span>'; }).join("") + '</div>'; return; }
    if(it.k === "dash"){ var sub = M.home.filter(function(x){ return x.inside === "dash" && !x.hide; }); if(!sub.length) return;
      h += '<div class="lyb' + on + '" data-pk="dash">' + sub.map(function(x){ return '<span class="sub' + (SEL === x.k ? " pk" : "") + '" data-pk="' + esc(x.k) + '">' + esc(x.n) + '</span>'; }).join("") + '</div>'; return; }
    var ph = HOMEPH[it.k] || [it.n, 30, ""]; h += '<div class="lyb ' + ph[2] + on + '" data-pk="' + esc(it.k) + '" style="min-height:' + ph[1] + 'px">' + esc(it.k === "appbar" ? ph[0] : it.n) + '</div>'; });
  h += '</div><div class="lynav">' + M.nav.filter(function(x){ return !x.hide && !x.tool; }).map(function(x){ var ic = x.custom ? FPLNLY.ICON[x.custom.icon] : NAVICO[x.k];
    return '<span class="' + (SEL === x.k ? "pk" : "") + '" data-pk="' + esc(x.k) + '"><svg viewBox="0 0 24 24">' + (ic || FPLNLY.ICON.star) + '</svg>' + esc(x.n) + '</span>'; }).join("") + '</div>';
  P.innerHTML = h; P.classList.add("lyp");
  [].forEach.call(P.querySelectorAll("[data-xs]"), function(el){ var s = (FPLNLY.clean(layoutOut()) || {sections:[]}).sections.filter(function(x){ return x.id === el.dataset.xs; })[0]; if(s){ var c = document.createElement("div"); el.appendChild(c); FPLNLY.render(document, c, s, {store:pvStore, go:function(){}}); } });
  [].forEach.call(P.querySelectorAll("[data-pk]"), function(el){ el.onclick = function(e){ e.stopPropagation(); var k = el.dataset.pk, g = M.nav.some(function(x){ return x.k === k; }) && el.closest(".lynav") ? "nav" : el.closest(".lyt") && k !== "tiles" ? "tiles" : "home";
    if(el.dataset.xs && e.target.closest("button,input,a")) return; lyTab = g; lySel = k; renderApp(false); }; }); }

/* custom sections */
var SECTPL = {
  blank:{title:"New section", icon:"star", color:"#e2bd74", blocks:function(){ return [{type:"heading", text:"Heading"}, {type:"text", text:"Write something useful for cadets here."}]; }},
  sleep:{title:"Sleep", icon:"moon", color:"#8fd6ff", tile:true, tileText:"Log last night", blocks:function(){ return [{type:"text", text:"Aim for **7 to 8 hours**. Every hour helps."}, {type:"tracker", kind:"number", label:"Hours slept last night", unit:"h", goal:8, min:0, max:14, step:0.5}, {type:"list", style:"check", reset:"daily", items:["Phone away","Uniform laid out","Alarm set"]}, {type:"reminder", label:"Lights out", time:"23:00", days:[0,1,2,3,4], text:"Start winding down", on:false}]; }},
  fitness:{title:"Fitness", icon:"dumbbell", color:"#5fe08a", blocks:function(){ return [{type:"tracker", kind:"yesno", label:"Worked out today?"}, {type:"tracker", kind:"number", label:"Push-ups", unit:"reps", goal:60}, {type:"countdown", label:"AFT", date:ymd(new Date(Date.now() + 30 * DAYMS))}]; }},
  study:{title:"Study", icon:"book", color:"#c79bff", blocks:function(){ return [{type:"tip", tone:"info", title:"Study hour", text:"Phones away, one subject at a time."}, {type:"tracker", kind:"number", label:"Hours studied", unit:"h", goal:3}, {type:"go", to:"tasks", label:"Open my tasks"}]; }},
  wellness:{title:"Check-in", icon:"heart", color:"#ff9f6b", blocks:function(){ return [{type:"tracker", kind:"scale", label:"How are you feeling today? (1 to 5)"}, {type:"text", text:"Talk to your team leader, squad leader or TAC if something's off."}]; }}};
var BLKNEW = {heading:{text:"Heading", size:"m"}, text:{text:""}, tip:{tone:"info", title:"", text:""}, list:{style:"bullet", reset:"daily", items:["First item"]}, tracker:{kind:"number", label:"What to track", unit:"", goal:""},
  reminder:{label:"Reminder", time:"21:00", days:[0,1,2,3,4,5,6], text:"", on:false}, countdown:{label:"Event", date:""}, link:{label:"More info", url:"https://"}, go:{to:"tasks", label:""}, divider:{}};
function newId(list, base){ base = String(base || "s").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 16) || "s"; var id = base, n = 2; while(list.some(function(x){ return x.id === id; })) id = (base.slice(0, 20) + "-" + n++); return id; }
function curSec(){ var L = S.app.sections || []; var s = L.filter(function(x){ return x.id === secSel; })[0]; if(!s && L.length){ s = L[0]; secSel = s.id; } return s || null; }
function sectionsHTML(){ var L = S.app.sections || [], s = curSec(), h = '<h2>Custom sections</h2><p class="hint">Build your own part of FPLN from blocks. Put it on Home, give it its own page in the menu, or both. Cadets\' answers (trackers, checklists) stay on their own phones.</p>';
  h += '<div class="seclist">' + L.map(function(x){ return '<button type="button" class="secc' + (s && x.id === s.id ? " sel" : "") + '" data-secid="' + esc(x.id) + '" style="--xc:' + esc(x.color || "#e2bd74") + '"><svg viewBox="0 0 24 24">' + (FPLNLY.ICON[x.icon] || FPLNLY.ICON.star) + '</svg><span><b>' + esc(x.title || "Untitled") + '</b><small>' + ({home:"Home", page:"Own page", both:"Home + own page"}[x.place || "home"]) + (x.tile ? " · tile" : "") + ' · ' + (x.blocks || []).length + ' blocks</small></span></button>'; }).join("") + '</div>';
  if(L.length < FPLNLY.LIM.sections) h += '<p class="hint" style="margin:10px 0 6px">Start a new section from:</p><div class="pal tpl">' + Object.keys(SECTPL).map(function(k){ var t = SECTPL[k]; return '<button type="button" data-sectpl="' + k + '"><svg viewBox="0 0 24 24">' + FPLNLY.ICON[t.icon] + '</svg><b>' + (k === "blank" ? "Blank" : esc(t.title)) + '</b></button>'; }).join("") + '</div>';
  if(!s) return h + '<p class="hint" style="margin-top:14px">No custom sections yet. Pick a starting point above.</p>';
  h += '<div class="secedit"><h3>Section</h3><div class="row3">' + fld("Name", '<input type="text" id="sTitle" maxlength="40" value="' + esc(s.title || "") + '">') +
    fld("Where it goes", '<select id="sPlace"><option value="home"' + (s.place === "home" || !s.place ? " selected" : "") + '>On Home</option><option value="page"' + (s.place === "page" ? " selected" : "") + '>Its own page in the menu</option><option value="both"' + (s.place === "both" ? " selected" : "") + '>Both</option></select>') +
    fld("Color", '<input type="color" id="sColor" value="' + esc(/^#[0-9a-f]{6}$/i.test(s.color || "") ? s.color : "#e2bd74") + '">') + '</div>' +
    '<div class="f"><label>Icon</label><div class="icp">' + FPLNLY.ICONS.map(function(n){ return '<button type="button" data-sico="' + n + '" aria-pressed="' + (s.icon === n) + '" title="' + n + '"><svg viewBox="0 0 24 24">' + FPLNLY.ICON[n] + '</svg></button>'; }).join("") + '</div></div>' +
    '<label class="tg"><span>Also show a tile on Home</span><input type="checkbox" id="sTile"' + (s.tile ? " checked" : "") + '></label>' + (s.tile ? fld("Tile text", '<input type="text" id="sTileT" maxlength="60" value="' + esc(s.tileText || "") + '" placeholder="' + esc(s.title || "") + '">') : "") +
    '<div class="acts"><button type="button" class="sm" id="sDup">Duplicate</button><button type="button" class="sm del" id="sDel">Delete section</button></div>';
  h += '<h3>Blocks</h3><div class="blks">' + (s.blocks || []).map(function(b, i){ var B = FPLNLY.BLOCKS[b.type] || {n:b.type}, open = blkOpen[s.id + ":" + b.id] !== false;
    return '<div class="blk' + (open ? " open" : "") + '" data-bi="' + i + '"><div class="bh"><button type="button" class="bt" data-btog="' + i + '"><b>' + esc(B.n) + '</b><small>' + esc(blkSum(b)) + '</small></button>' +
      '<button type="button" class="sm" data-bmv="' + i + '.-1"' + (i ? "" : " disabled") + ' aria-label="Move up">↑</button><button type="button" class="sm" data-bmv="' + i + '.1"' + (i < s.blocks.length - 1 ? "" : " disabled") + ' aria-label="Move down">↓</button><button type="button" class="sm del" data-brm="' + i + '" aria-label="Remove">×</button></div>' + (open ? '<div class="bb">' + blkFields(b, i) + '</div>' : "") + '</div>'; }).join("") + '</div>';
  if((s.blocks || []).length < FPLNLY.LIM.blocks) h += '<p class="hint" style="margin:10px 0 6px">Add a block:</p><div class="bpal">' + Object.keys(FPLNLY.BLOCKS).map(function(k){ return '<button type="button" data-badd="' + k + '" title="' + esc(FPLNLY.BLOCKS[k].d) + '"><b>' + esc(FPLNLY.BLOCKS[k].n) + '</b><small>' + esc(FPLNLY.BLOCKS[k].d) + '</small></button>'; }).join("") + '</div>';
  var bad = FPLNLY.problems(layoutOut()).filter(function(x){ return x.indexOf("“" + (s.title || "")) >= 0 || x.indexOf("Section") === 0; });
  if(bad.length) h += '<p class="msg bad"><b>Fix before publishing:</b><ul>' + bad.slice(0, 6).map(function(x){ return "<li>" + esc(x) + "</li>"; }).join("") + '</ul></p>';
  return h + '</div>'; }
function blkSum(b){ var t = b.text || b.label || b.title || (b.items || []).join(", ") || ""; if(b.type === "reminder") t = (b.label || "") + " · " + (b.time || ""); if(b.type === "countdown") t = (b.label || "") + " · " + (b.date || "no date"); if(b.type === "go") t = "Opens " + (FPLNLY.GONAME[b.to] || b.to); return String(t).slice(0, 60); }
function opt(v, cur, label){ return '<option value="' + esc(v) + '"' + (String(cur) === String(v) ? " selected" : "") + '>' + esc(label) + '</option>'; }
function blkFields(b, i){ var P = 'data-bf="' + i + '.';
  switch(b.type){
    case "heading": return fld("Text", '<input type="text" ' + P + 'text" maxlength="60" value="' + esc(b.text || "") + '">') + fld("Size", '<select ' + P + 'size">' + opt("s", b.size, "Small") + opt("m", b.size || "m", "Medium") + opt("l", b.size, "Large") + '</select>');
    case "text": return fld("Text", '<textarea ' + P + 'text" rows="4" maxlength="800">' + esc(b.text || "") + '</textarea>', "**bold** works");
    case "tip": return '<div class="row3">' + fld("Title", '<input type="text" ' + P + 'title" maxlength="60" value="' + esc(b.title || "") + '">') + fld("Style", '<select ' + P + 'tone">' + opt("info", b.tone, "Note") + opt("good", b.tone, "Good") + opt("warn", b.tone, "Heads up") + '</select>') + '</div>' + fld("Text", '<textarea ' + P + 'text" rows="3" maxlength="800">' + esc(b.text || "") + '</textarea>');
    case "list": return '<div class="row3">' + fld("Style", '<select ' + P + 'style">' + opt("bullet", b.style, "Bullets") + opt("number", b.style, "Numbered") + opt("check", b.style, "Checklist cadets tick") + '</select>') + (b.style === "check" ? fld("Boxes clear", '<select ' + P + 'reset">' + opt("daily", b.reset, "Every day") + opt("weekly", b.reset, "Every Monday") + opt("none", b.reset, "Never") + '</select>') : "") + '</div>' +
      fld("Items", '<textarea ' + P + 'items" rows="' + Math.max(3, (b.items || []).length + 1) + '" maxlength="2400">' + esc((b.items || []).join("\n")) + '</textarea>', "one per line");
    case "tracker": return '<div class="row3">' + fld("Question", '<input type="text" ' + P + 'label" maxlength="60" value="' + esc(b.label || "") + '">') + fld("Answer", '<select ' + P + 'kind">' + opt("number", b.kind, "A number") + opt("yesno", b.kind, "Yes or no") + opt("scale", b.kind, "1 to 5") + '</select>') + '</div>' +
      (b.kind === "number" || !b.kind ? '<div class="row3">' + fld("Unit", '<input type="text" ' + P + 'unit" maxlength="16" value="' + esc(b.unit || "") + '" placeholder="h, reps, miles">') + fld("Goal", '<input type="number" ' + P + 'goal" value="' + esc(b.goal == null ? "" : b.goal) + '">') + fld("Max", '<input type="number" ' + P + 'max" value="' + esc(b.max == null ? "" : b.max) + '">') + '</div>' : "");
    case "reminder": return '<div class="row3">' + fld("Name", '<input type="text" ' + P + 'label" maxlength="60" value="' + esc(b.label || "") + '">') + fld("Time", '<input type="time" ' + P + 'time" value="' + esc(b.time || "") + '">') + fld("On for cadets", '<select ' + P + 'on">' + opt("false", !!b.on, "Off until they switch it on") + opt("true", !!b.on, "On unless they switch it off") + '</select>') + '</div>' +
      '<div class="f"><label>Days</label><div class="dys">' + ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(function(d, k){ return '<button type="button" data-bday="' + i + '.' + k + '" aria-pressed="' + ((b.days || []).indexOf(k) >= 0) + '">' + d + '</button>'; }).join("") + '</div></div>' + fld("Message", '<input type="text" ' + P + 'text" maxlength="200" value="' + esc(b.text || "") + '">');
    case "countdown": return '<div class="row3">' + fld("Event", '<input type="text" ' + P + 'label" maxlength="60" value="' + esc(b.label || "") + '">') + fld("Date", '<input type="date" ' + P + 'date" value="' + esc(b.date || "") + '">') + '</div>';
    case "link": return '<div class="row3">' + fld("Button text", '<input type="text" ' + P + 'label" maxlength="60" value="' + esc(b.label || "") + '">') + fld("Address", '<input type="url" ' + P + 'url" maxlength="300" value="' + esc(b.url || "") + '" spellcheck="false">', ".edu, .mil or .gov") + '</div>';
    case "go": var L = (S.app.sections || []).filter(function(x){ return x.place !== "home"; }); return '<div class="row3">' + fld("Opens", '<select ' + P + 'to">' + FPLNLY.GO.map(function(g){ return opt(g, b.to, FPLNLY.GONAME[g]); }).join("") + L.map(function(x){ return opt("x:" + x.id, b.to, x.title + " (custom)"); }).join("") + '</select>') + fld("Button text", '<input type="text" ' + P + 'label" maxlength="60" value="' + esc(b.label || "") + '">') + '</div>';
    default: return '<p class="hint">A thin line between blocks.</p>'; } }
function secEdit(fn, rerender){ appEdit("sections", function(L){ fn(L, L.filter(function(x){ return x.id === secSel; })[0]); }, rerender); }
function wireSections(){ var E = $("appEd");
  [].forEach.call(E.querySelectorAll("[data-secid]"), function(b){ b.onclick = function(){ secSel = b.dataset.secid; renderApp(false); }; });
  [].forEach.call(E.querySelectorAll("[data-sectpl]"), function(b){ b.onclick = function(){ var t = SECTPL[b.dataset.sectpl];
    secEdit(function(L){ var id = newId(L, t.title), bl = t.blocks().map(function(x, k){ var y = clone(x); y.id = newId([], x.type) + "-" + (k + 1); return y; });
      L.push({id:id, title:t.title, icon:t.icon, color:t.color, place:"home", tile:!!t.tile, tileText:t.tileText || "", blocks:bl}); secSel = id; }, true); logAct("added the " + t.title + " section"); }; });
  var s = curSec(); if(!s) return;
  $("sTitle").oninput = function(){ var v = this.value.slice(0, 40); secEdit(function(L, x){ x.title = v; }, false); var c = E.querySelector('.secc.sel b'); if(c) c.textContent = v || "Untitled"; };
  $("sPlace").onchange = function(){ var v = this.value; secEdit(function(L, x){ x.place = v; }, true); };
  $("sColor").oninput = function(){ var v = this.value; secEdit(function(L, x){ x.color = v; }, false); };
  $("sTile").onchange = function(){ var v = this.checked; secEdit(function(L, x){ x.tile = v; }, true); };
  if($("sTileT")) $("sTileT").oninput = function(){ var v = this.value.slice(0, 60); secEdit(function(L, x){ x.tileText = v; }, false); };
  [].forEach.call(E.querySelectorAll("[data-sico]"), function(b){ b.onclick = function(){ var v = b.dataset.sico; secEdit(function(L, x){ x.icon = v; }, true); }; });
  $("sDup").onclick = function(){ secEdit(function(L, x){ var c = clone(x); c.id = newId(L, x.title + "-copy"); c.title = (x.title + " copy").slice(0, 40); L.splice(L.indexOf(x) + 1, 0, c); secSel = c.id; }, true); };
  $("sDel").onclick = function(){ if(!confirmDel()) return; secEdit(function(L, x){ L.splice(L.indexOf(x), 1); secSel = null; }, true); logAct("deleted a section"); };
  [].forEach.call(E.querySelectorAll("[data-badd]"), function(b){ b.onclick = function(){ var t = b.dataset.badd; secEdit(function(L, x){ var y = clone(BLKNEW[t]); y.type = t; y.id = newId(x.blocks, t); x.blocks.push(y); blkOpen[x.id + ":" + y.id] = true; }, true); }; });
  [].forEach.call(E.querySelectorAll("[data-btog]"), function(b){ b.onclick = function(){ var i = +b.dataset.btog, bl = s.blocks[i], k = s.id + ":" + bl.id; blkOpen[k] = blkOpen[k] === false; renderApp(false); }; });
  [].forEach.call(E.querySelectorAll("[data-bmv]"), function(b){ b.onclick = function(){ var a = b.dataset.bmv.split("."), i = +a[0], j = i + +a[1]; secEdit(function(L, x){ var t = x.blocks[i]; x.blocks[i] = x.blocks[j]; x.blocks[j] = t; }, true); }; });
  [].forEach.call(E.querySelectorAll("[data-brm]"), function(b){ b.onclick = function(){ var i = +b.dataset.brm; secEdit(function(L, x){ x.blocks.splice(i, 1); }, true); }; });
  [].forEach.call(E.querySelectorAll("[data-bday]"), function(b){ b.onclick = function(){ var a = b.dataset.bday.split("."), i = +a[0], d = +a[1]; secEdit(function(L, x){ var D = x.blocks[i].days = (x.blocks[i].days || []).slice(), j = D.indexOf(d); if(j >= 0) D.splice(j, 1); else D.push(d); D.sort(); }, true); }; });
  [].forEach.call(E.querySelectorAll("[data-bf]"), function(x){ var a = x.dataset.bf.split("."), i = +a[0], f = a[1], ev = x.tagName === "SELECT" ? "onchange" : "oninput";
    x[ev] = function(){ var v = x.value; if(f === "items") v = v.split("\n").map(function(t){ return t.slice(0, 120); }).filter(function(t, k, arr){ return t.trim() || k < arr.length - 1; }).slice(0, 20);
      else if(f === "goal" || f === "max" || f === "min") v = v === "" ? "" : +v; else if(f === "on") v = v === "true";
      var re = x.tagName === "SELECT" && (f === "kind" || f === "style"); secEdit(function(L, s2){ var bl = s2.blocks[i]; if(f === "items") bl.items = v.filter(function(t){ return t.trim(); }); else if(v === "") delete bl[f]; else bl[f] = v; }, re);
      if(!re){ var sm = x.closest(".blk").querySelector(".bt small"); if(sm) sm.textContent = blkSum(s.blocks[i]); } }; }); }
function confirmDel(){ var b = $("sDel"); if(b.dataset.sure){ return true; } b.dataset.sure = "1"; b.textContent = "Tap again to delete"; setTimeout(function(){ if(b){ delete b.dataset.sure; b.textContent = "Delete section"; } }, 3000); return false; }
function drawSecPhone(P){ var s = curSec(); P.classList.add("lyp"); if(!s){ P.innerHTML = '<p class="pempty" style="padding:20px">Your section will show here, working, as cadets will see it.</p>'; return; }
  var c = (FPLNLY.clean(layoutOut()) || {sections:[]}).sections.filter(function(x){ return x.id === s.id; })[0]; P.innerHTML = '<div class="pth" style="margin:2px 0 8px">' + ({home:"ON HOME", page:"ITS OWN PAGE", both:"ON HOME AND ITS OWN PAGE"}[s.place || "home"]) + '</div>';
  var el = document.createElement("div"); P.appendChild(el); if(c) FPLNLY.render(document, el, c, {store:pvStore, go:function(to){ toast("In the app this opens " + (FPLNLY.GONAME[to] || "that section")); }});
  var n = (s.blocks || []).length - (c ? c.blocks.length : 0); if(n > 0){ var w = document.createElement("p"); w.className = "msg warn"; w.style.marginTop = "10px"; w.textContent = n + " block" + (n > 1 ? "s aren't" : " isn't") + " shown yet: fill in every field (a link must go to a .edu, .mil or .gov site; reminders need a time; countdowns need a date)."; P.appendChild(w); } }

/* ---------- requests: anyone asks, the owner decides ---------- */
/* requests/<uid> = {items:[{id, text, where, kind, at}]} written by that person; replies/<uid> = {<id>:{status, reply, at}} written only by the owner */
var REQS = {}, REPLIES = {}, aiTab = "req";
function reqList(){ var out = []; Object.keys(REQS).forEach(function(uid){ (REQS[uid].items || []).forEach(function(it){ var r = (REPLIES[uid] || {})[it.id] || {}; out.push({uid:uid, id:it.id, text:String(it.text || ""), where:it.where || "", kind:it.kind || "", at:+it.at || 0, status:r.status || "new", reply:r.reply || "", rat:r.at || 0}); }); });
  return out.sort(function(a, b){ var w = function(x){ return x.status === "new" ? 0 : 1; }; return w(a) - w(b) || b.at - a.at; }); }
function loadReqs(){ if(!db) return;
  db.collection("requests").onSnapshot(function(q){ REQS = {}; q.docs.forEach(function(d){ REQS[d.id] = d.data() || {}; }); reqChanged(); }, function(){});
  db.collection("replies").onSnapshot(function(q){ REPLIES = {}; q.docs.forEach(function(d){ REPLIES[d.id] = d.data() || {}; }); reqChanged(); }, function(){}); }
function reqChanged(){ var L = reqList(), waiting = L.filter(function(r){ return r.status === "new"; }).length, mineNew = L.filter(function(r){ return r.uid === ME.id && r.status !== "new" && r.rat > (+lsGet("fpln-studio:seenReplies") || 0); }).length;
  var dot = $("aiDot"); if(dot){ dot.hidden = !(ME.owner ? waiting : mineNew); dot.textContent = ME.owner ? String(waiting) : "!"; }
  if($("aiM").classList.contains("on") && aiTab === "req") drawReq(); if(S.mode === "team") renderTeam(); }
function lsGet(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } } function lsSet(k, v){ try{ localStorage.setItem(k, v); }catch(e){} }
var RQST = {new:["Waiting for the owner","new"], approved:["Approved","ok"], building:["Approved · being built","ok"], done:["Done","ok"], declined:["Declined","bad"]};
function reqCard(r, owner){ var st = RQST[r.status] || RQST.new;
  var h = '<div class="rq" data-rq="' + esc(r.uid + "/" + r.id) + '"><div class="rqh"><b>' + esc(owner ? nm(r.uid, "Teammate") : "You") + '</b><small>' + esc(ago(r.at)) + (r.where ? " · " + esc(r.where) : "") + (r.kind ? " · " + esc(r.kind) : "") + '</small><span class="rqs ' + st[1] + '">' + esc(st[0]) + '</span></div><p class="rqt">' + esc(r.text) + '</p>' +
    (r.reply ? '<p class="reply">' + (owner ? "Your note: " : "Owner: ") + '“' + esc(r.reply) + '”</p>' : "");
  if(owner) h += '<div class="rqa"><input type="text" class="rqn" maxlength="300" placeholder="Note back (optional)">' +
      '<button type="button" class="ib pub" data-rqbuild>' + (sample ? "APPROVE &amp; DRAFT WITH AI" : "APPROVE") + '</button>' + (sample ? '<button type="button" class="ib" data-rqok>Approve only</button>' : "") +
      '<button type="button" class="ib" data-rqdone>Mark done</button><button type="button" class="ib" data-rqno>Decline</button><button type="button" class="ib" data-rqcopy>Copy for Claude</button></div><div class="rqout"></div>';
  else if(r.status === "new") h += '<div class="rqa"><button type="button" class="ib" data-rqdel>Withdraw</button></div>';
  return h + '</div>'; }
var RQOUT = {}, RQMSG = "";
function drawReq(){ var B = $("aiReq"); if(!B) return; var L = reqList(), h = "", keep = {txt:$("rqText") ? $("rqText").value : "", notes:{}, focus:document.activeElement && B.contains(document.activeElement) ? (document.activeElement.id || (document.activeElement.closest("[data-rq]") || {dataset:{}}).dataset.rq) : null};
  [].forEach.call(B.querySelectorAll("[data-rq]"), function(c){ var n = c.querySelector(".rqn"); if(n) keep.notes[c.dataset.rq] = n.value; });
  { h += '<p class="hint">Ask for a new feature, a change or a fix to the app or website. The owner reads every request and decides; nothing reaches cadets until the owner approves and publishes it.</p>' +
      '<div class="row3">' + fld("Where", '<select id="rqWhere"><option>App</option><option>Website</option><option>Not sure</option></select>') + fld("What kind", '<select id="rqKind"><option>New feature</option><option>Change</option><option>Fix</option></select>') + '</div>' +
      fld("Your request", '<textarea id="rqText" rows="4" maxlength="1000" placeholder="e.g. A sleep section on Home where cadets log their hours and get a lights-out reminder at 2300 on school nights"></textarea>', "be specific: what it does, where it shows") +
      '<div class="end" style="margin-top:6px"><button type="button" class="ib pub" id="rqGo"' + (db && ME.id ? "" : " disabled") + '>SEND REQUEST</button></div><div id="rqMsg"></div>'; }
  var mine = L.filter(function(r){ return r.uid === ME.id; });
  if(ME.owner){ var others = L, w = others.filter(function(r){ return r.status === "new"; }).length;
    h += '<h3 class="rqhd">Requests from the team <span class="cnt">' + w + ' waiting</span></h3>' + (others.length ? others.slice(0, 40).map(function(r){ return reqCard(r, true); }).join("") : '<p class="hint">No requests yet. Share this page with your team; they ask here.</p>'); }
  else if(mine.length){ h += '<h3 class="rqhd">Your requests</h3>' + mine.map(function(r){ return reqCard(r, false); }).join(""); lsSet("fpln-studio:seenReplies", String(Date.now())); var dot = $("aiDot"); if(dot) dot.hidden = true; }
  B.innerHTML = h;
  if($("rqText")) $("rqText").value = keep.txt; if($("rqMsg")) $("rqMsg").innerHTML = RQMSG;
  [].forEach.call(B.querySelectorAll("[data-rq]"), function(c){ var n = c.querySelector(".rqn"), k = c.dataset.rq; if(n && keep.notes[k]) n.value = keep.notes[k]; var o = c.querySelector(".rqout"); if(o && RQOUT[k]) o.innerHTML = RQOUT[k]; });
  if(keep.focus){ var f = $(keep.focus) || (B.querySelector('[data-rq="' + keep.focus + '"] .rqn')); if(f) try{ f.focus(); }catch(e){} }
  wireReq(); }
function myItems(){ return ((REQS[ME.id] || {}).items || []).slice(); }
function wireReq(){
  if($("rqGo")) $("rqGo").onclick = function(){ var t = $("rqText").value.trim(), m = $("rqMsg"), bad = FPLNLY.textBad(t);
    if(t.length < 10){ RQMSG = m.innerHTML = '<p class="msg warn">Say a little more about what you want.</p>'; return; }
    if(bad){ RQMSG = m.innerHTML = '<p class="msg bad">Your request contains ' + esc(bad) + '. Describe it in plain words instead.</p>'; return; }
    var items = myItems(); if(items.filter(function(x){ var r = (REPLIES[ME.id] || {})[x.id]; return !r || r.status === "new"; }).length >= 10){ RQMSG = m.innerHTML = '<p class="msg warn">You have 10 requests waiting. Wait for the owner to answer some first.</p>'; return; }
    items.push({id:"r" + Date.now().toString(36), text:t.slice(0, 1000), where:$("rqWhere").value, kind:$("rqKind").value, at:Date.now()});
    var keep = items.slice(-30); this.disabled = true;
    db.doc("requests/" + ME.id).set({items:keep, at:Date.now()}).then(function(){ $("rqText").value = ""; if($("rqText")) $("rqText").value = ""; RQMSG = m.innerHTML = '<p class="msg ok">Sent. The owner will see it in Ask AI and on the Team tab.</p>'; logAct("sent a request"); }, function(){ RQMSG = m.innerHTML = '<p class="msg bad">Couldn\'t send. Try again.</p>'; })
      .then(function(){ if($("rqGo")) $("rqGo").disabled = false; }); };
  [].forEach.call(document.querySelectorAll("#aiReq [data-rq]"), function(card){ var p = card.dataset.rq.split("/"), uid = p[0], id = p[1], r = reqList().filter(function(x){ return x.uid === uid && x.id === id; })[0]; if(!r) return;
    function note(){ var n = card.querySelector(".rqn"); return n ? n.value.trim().slice(0, 300) : ""; }
    function setSt(st, reply){ var o = {}; o[id] = {status:st, reply:reply || "", at:Date.now()}; return db.doc("replies/" + uid).get().then(function(d){ var cur = d && d.exists ? d.data() || {} : {}; cur[id] = o[id]; return db.doc("replies/" + uid).set(cur); }); }
    var q = function(s){ return card.querySelector(s); };
    if(q("[data-rqdel]")) q("[data-rqdel]").onclick = function(){ var items = myItems().filter(function(x){ return x.id !== id; }); db.doc("requests/" + ME.id).set({items:items, at:Date.now()}); };
    if(q("[data-rqok]")) q("[data-rqok]").onclick = function(){ setSt("approved", note()).then(function(){ toast("Approved"); logAct("approved a request"); }); };
    if(q("[data-rqdone]")) q("[data-rqdone]").onclick = function(){ setSt("done", note()).then(function(){ toast("Marked done"); }); };
    if(q("[data-rqno]")) q("[data-rqno]").onclick = function(){ setSt("declined", note()).then(function(){ toast("Declined"); logAct("declined a request"); }); };
    if(q("[data-rqcopy]")) q("[data-rqcopy]").onclick = function(){ copyText("FPLN feature request (" + (r.where || "") + ", " + (r.kind || "") + ") from a teammate, approved by me:\n" + r.text + "\n\nPlease build this in FPLN.", q("[data-rqcopy]")); };
    if(q("[data-rqbuild]")) q("[data-rqbuild]").onclick = function(){ var btn = this, out = q(".rqout"), n = note();
      if(!sample){ setSt("approved", n).then(function(){ toast("Approved"); }); return; }
      btn.disabled = true; btn.textContent = "DRAFTING…"; out.innerHTML = '<p class="msg">Thinking…</p>';
      aiDraft(r).then(function(res){ return setSt(res.code ? "approved" : "building", n || (res.code ? "Approved. This needs new code; I'll get it built." : "Approved. It's in the draft; it goes live when published.")).then(function(){ return res; }); })
        .then(function(res){ RQOUT[uid + "/" + id] = out.innerHTML = res.html; logAct("approved a request and drafted it with AI"); },
          function(e){ RQOUT[uid + "/" + id] = out.innerHTML = '<p class="msg bad">' + esc(e && e.code === "rate_limited" ? "Too many AI requests right now. Try again in a minute." : e && e.code === "not_granted" ? "AI access wasn't allowed for this page." : (e && e.message) || "The AI couldn't draft it. Nothing changed.") + '</p>'; })
        .then(function(){ btn.disabled = false; btn.textContent = "APPROVE & DRAFT WITH AI"; }); }; }); }
/* take one editing lock now (for drafting from the Ask AI window) */
function grab(a){ if(held(a)) return Promise.resolve(true); if(!db || !ME.id) return Promise.resolve(false);
  return db.doc("locks/" + a).acquire({holder:ME.id, ttlMs:90000, data:{uid:ME.id}}).then(function(r){ if(r && r.acquired){ HELD[a] = Date.now() + 85000; return true; } return db.doc("locks/" + a).get().then(function(d){ var x = d && d.exists ? d.data() : null; LOCKMSG[a] = x && x.uid ? String(x.uid) : "?"; return false; }); }, function(){ return false; }); }
/* the owner's AI turns an approved request into a draft change (a custom section, a layout change, or a website change), or says it needs code */
var SECSCHEMA = 'A custom section: {"id":short lowercase id,"title":str<=40,"icon":one of ' + JSON.stringify(FPLNLY.ICONS) + ',"color":"#rrggbb","place":"home|page|both","tile":bool,"tileText":str,"blocks":[...]} . Blocks (each has "id" short lowercase unique, "type"):\n' +
  'heading {text,size:"s|m|l"} · text {text (**bold** ok)} · tip {tone:"info|good|warn",title,text} · list {style:"bullet|number|check",reset:"daily|weekly|none",items:[str<=20]} · tracker {label,kind:"number|yesno|scale",unit,goal,min,max,step} · reminder {label,time:"HH:MM" 24h,days:[0-6, 0=Sun],text,on:bool} · countdown {label,date:"YYYY-MM-DD"} · link {label,url: https only to .edu/.mil/.gov} · go {label,to: one of ' + JSON.stringify(FPLNLY.GO) + '} · divider {}.\n' +
  'Layout lists: nav, home, tiles, each [{k,label?,hide?}] in order; built-in keys nav ' + JSON.stringify(FPLNLY.CAT.nav.map(function(x){ return x.k; })) + ', home ' + JSON.stringify(FPLNLY.CAT.home.map(function(x){ return x.k; })) + ', tiles ' + JSON.stringify(FPLNLY.CAT.tiles.map(function(x){ return x.k; })) + '; custom sections are "x:<id>".';
function aiDraft(r){ var lay = layoutOut();
  var prompt = "You help the owner of FPLN, a planner app made by and for West Point cadets, build an approved team request with FPLN Studio's no-code pieces.\n\nREQUEST (" + r.where + ", " + r.kind + "): " + r.text +
    "\n\nWhat the Studio can make:\n" + SECSCHEMA + "\n\nCURRENT APP LAYOUT AND SECTIONS:\n" + JSON.stringify(lay) +
    "\n\nDecide which fits best:\n- kind \"section\": a new or changed custom section (give the whole section; reuse an existing id to change one)\n- kind \"layout\": only reordering, hiding or renaming (give nav/home/tiles lists in full)\n- kind \"site\": a change to the public website (describe the change in one sentence in \"siteRequest\"; the owner will apply it)\n- kind \"code\": it needs new app behavior these pieces cannot do (explain briefly in \"cannot\")\n" +
    "Rules: plain text only, no personal data, no controlled or sensitive military markings, realistic cadet-appropriate content, times in 24h.\n" +
    'Reply with ONLY JSON: {"kind":"section|layout|site|code","section":{...}|null,"layout":{"nav":[],"home":[],"tiles":[]}|null,"siteRequest":"","summary":"one sentence","cannot":""}';
  return sample.json(prompt, {modelTier:"default", cache:false}).then(function(res){ if(!res || !res.kind) throw {message:"The AI didn't return a plan."};
    if(res.kind === "section" && res.section){ var s = res.section, test = clone(lay); s.id = String(s.id || "").toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 24) || newId(S.app.sections || [], s.title);
      (s.blocks || []).forEach(function(b, i){ b.id = String(b.id || "").toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 24) || (b.type + "-" + (i + 1)); });
      var ix = test.sections.map(function(x){ return x.id; }).indexOf(s.id); if(ix >= 0) test.sections[ix] = s; else test.sections.push(s);
      var bad = FPLNLY.problems(test); if(bad.length) return {html:'<p class="msg bad"><b>The AI\'s section didn\'t pass the safety check, so nothing changed:</b><ul>' + bad.slice(0, 5).map(function(x){ return "<li>" + esc(x) + "</li>"; }).join("") + '</ul></p>'};
      return grab("app_sections").then(function(ok){ return ok ? apply() : {html:'<p class="msg warn">' + esc(holderOf("app_sections")) + ' is editing custom sections right now, so the draft wasn\'t added. Try again in a minute.</p>'}; });
      function apply(){ appEdit("sections", function(L){ var j = L.map(function(x){ return x.id; }).indexOf(s.id); if(j >= 0) L[j] = s; else L.push(s); }, false); secSel = s.id;
        return {html:'<p class="msg ok"><b>Approved and drafted.</b> ' + esc(res.summary || "") + ' Check it in App › Custom sections, then publish.</p>' + (res.cannot ? '<p class="msg warn"><b>Left out:</b> ' + esc(res.cannot) + '</p>' : "") + '<button type="button" class="ib" data-rqsee>Open it</button>'}; } }
    if(res.kind === "layout" && res.layout){ var t2 = clone(lay); ["nav","home","tiles"].forEach(function(g){ if(Array.isArray(res.layout[g]) && res.layout[g].length) t2[g] = res.layout[g]; }); var b2 = FPLNLY.problems(t2);
      if(b2.length) return {html:'<p class="msg bad"><b>The AI\'s layout didn\'t pass the safety check, so nothing changed:</b><ul>' + b2.slice(0, 5).map(function(x){ return "<li>" + esc(x) + "</li>"; }).join("") + '</ul></p>'};
      return grab("app_layout").then(function(ok){ if(!ok) return {html:'<p class="msg warn">Someone is editing the layout right now, so the draft wasn\'t changed. Try again in a minute.</p>'};
        appEdit("layout", function(Lay){ ["nav","home","tiles"].forEach(function(g){ if(Array.isArray(res.layout[g]) && res.layout[g].length) Lay[g] = res.layout[g]; }); }, false);
        return {html:'<p class="msg ok"><b>Approved and drafted.</b> ' + esc(res.summary || "") + ' Check it in App › Layout, then publish.</p><button type="button" class="ib" data-rqsee="layout">Open it</button>'}; }); }
    if(res.kind === "site") return {html:'<p class="msg ok"><b>Approved.</b> ' + esc(res.summary || "") + '</p><p class="hint">Website change: ' + esc(res.siteRequest || r.text) + '</p><button type="button" class="ib" data-rqsite="' + esc(res.siteRequest || r.text) + '">Do it with Change the website now</button>'};
    return {code:true, html:'<p class="msg warn"><b>Approved, but this needs new code.</b> ' + esc(res.cannot || res.summary || "The Studio's blocks can't do this yet.") + ' Use Copy for Claude and paste it into a chat with Claude to have it built.</p>'}; }); }
document.addEventListener("click", function(e){ var b = e.target.closest && e.target.closest("[data-rqsee],[data-rqsite]"); if(!b || !$("aiReq").contains(b)) return;
  if(b.hasAttribute("data-rqsite")){ aiTabSet("now"); setMode("web"); $("aiIn").value = b.getAttribute("data-rqsite"); $("aiIn").focus(); return; }
  close("aiM"); S.appSec = b.getAttribute("data-rqsee") === "layout" ? "layout" : "sections"; setMode("app"); });
function aiTabSet(t){ aiTab = t; [].forEach.call(document.querySelectorAll("[data-ait]"), function(b){ b.setAttribute("aria-selected", String(b.dataset.ait === t)); }); $("aiReq").hidden = t !== "req"; $("aiNow").hidden = t !== "now"; if(t === "req") drawReq(); }
[].forEach.call(document.querySelectorAll("[data-ait]"), function(b){ b.onclick = function(){ aiTabSet(b.dataset.ait); }; });
$("aiBtn").onclick = function(){ $("aiOut").innerHTML = sample ? "" : '<p class="msg warn">AI isn\'t available for your account here. Every change can still be made by hand, and you can send a request.</p>'; open("aiM"); aiTabSet(ME.owner && sample ? (reqList().some(function(r){ return r.status === "new"; }) ? "req" : aiTab) : "req"); };
