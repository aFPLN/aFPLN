"""Builds the email tour and Teams share pieces from their sources (run from the repo root, before build_kit.py):
  share/tour.html            the clickable email tour, with Copy for Outlook / Copy for Gmail / Copy HTML code
  share/teams.html           the Teams paste-in post, the announcement headers and the interactive Teams card
  share/teams/card.json      the Teams Adaptive Card (also built into teams.html)
Sources: .github/kit/email-tour.html, pictures in share/email/ and share/teams/."""
import base64, html, json, re
BASE = "https://afpln.github.io/aFPLN/"
APP = BASE
GET = BASE + "download/"
def b64(p, mime="image/png"): return "data:%s;base64,%s" % (mime, base64.b64encode(open(p, "rb").read()).decode())

# ---------- email tour ----------
TILE = ('<div style="display:inline-block;width:100%;max-width:286px;vertical-align:top;font-size:15px;text-align:left">'
  '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse"><tr><td style="padding:6px">'
  '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0e1522" style="background-color:#0e1522;border:1px solid #2a3445;border-radius:12px;border-collapse:separate">'
  '<tr><td valign="top" style="padding:16px 16px 18px;font-family:Arial,sans-serif">'
  '<a href="{url}" target="_blank" style="text-decoration:none;border:0"><img src="{{{{IMG:ico-{k}}}}}" width="48" height="48" alt="" border="0" style="display:block;width:48px;height:48px;border:0;outline:none"></a>'
  '<p style="margin:12px 0 4px;font-family:Arial,sans-serif;font-size:17px;line-height:22px;font-weight:bold;color:#f2f5f8"><a href="{url}" target="_blank" style="color:#f2f5f8;text-decoration:none">{t}</a></p>'
  '<p style="margin:0 0 14px;font-family:Arial,sans-serif;font-size:14px;line-height:20px;color:#a9b8c8;min-height:60px">{d}</p>'
  '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate"><tr><td bgcolor="#13243a" style="background-color:#13243a;border:1px solid #e2bd74;border-radius:999px;mso-padding-alt:9px 16px">'
  '<a href="{url}" target="_blank" style="display:inline-block;padding:9px 16px;font-family:Arial,sans-serif;font-size:13px;line-height:16px;font-weight:bold;color:#f6dca2;text-decoration:none;letter-spacing:.5px">{b} &#8250;</a></td></tr></table>'
  '</td></tr></table></td></tr></table></div>')
src = open(".github/kit/email-tour.html", encoding="utf-8").read().strip()
def tile(m):
    k, t, d, url, b = m.group(1).split("|")
    return TILE.format(k=k, t=t, d=d, url=url, b=b)
TOUR = re.sub(r"\{\{TILE:([^}]*)\}\}", tile, src)
IMGS = sorted(set(re.findall(r"\{\{IMG:([\w-]+)\}\}", TOUR)))
HOSTED = {k: BASE + "share/email/" + k + ".png" for k in IMGS}
DATA = {k: b64("share/email/" + k + ".png") for k in IMGS}
def fill(block, m): return re.sub(r"\{\{IMG:([\w-]+)\}\}", lambda x: m[x.group(1)], block)
assert "{{" not in fill(TOUR, HOSTED)

PAGE_CSS = """:root{color-scheme:dark}*{box-sizing:border-box}
body{margin:0;min-height:100vh;background:radial-gradient(110% 50% at 50% 0%,#15274a,#060b14 70%) #060b14;color:#eef4fa;font:16px/1.55 "Segoe UI",system-ui,sans-serif}
.wrap{width:min(820px,100%);margin:0 auto;padding:36px 16px 60px}
.k{font:600 12px/1 "Segoe UI",sans-serif;letter-spacing:.28em;color:#e2bd74;text-transform:uppercase;margin:0 0 12px}
h1{margin:0 0 8px;font:700 clamp(28px,5vw,40px)/1.1 "Segoe UI",sans-serif}h2{margin:44px 0 6px;font:700 24px/1.2 "Segoe UI",sans-serif}
p{margin:0 0 18px;color:#c3d1de;max-width:44em}a{color:#8fd6ff}
.stage{background:#eef2f6;border-radius:18px;padding:28px 18px;border:1px solid rgba(226,189,116,.45);box-shadow:0 30px 70px -30px #000;overflow:hidden}
.stage.dark{background:#0b0f16}.stage p{color:inherit;max-width:none}.stage>table,.stage>div{margin:0 auto}
.stage img{max-width:100%;height:auto}
@media (max-width:480px){.stage{padding:14px 6px}.wrap{padding-left:10px;padding-right:10px}}
.row{display:flex;flex-wrap:wrap;gap:10px;margin:18px 0 0}
button,.dl{all:unset;box-sizing:border-box;cursor:pointer;padding:13px 20px;border-radius:12px;font:700 13.5px/1 "Segoe UI",sans-serif;letter-spacing:.1em;text-transform:uppercase;text-align:center}
.pri{background:linear-gradient(180deg,#f6dca2,#d5a95c);color:#1a1205;box-shadow:0 14px 30px -12px rgba(226,189,116,.8)}
.gh{border:1px solid rgba(255,255,255,.22);color:#eef4fa}
button:focus-visible,.dl:focus-visible{outline:3px solid #8fd6ff;outline-offset:3px}
.msg{min-height:1.5em;margin:12px 0 0;color:#9fe3b4;font-weight:600}
ol{color:#9fb2c6;padding-left:20px;margin:22px 0 0}li{margin:0 0 6px}
.pics{display:grid;gap:14px}.pics img{width:100%;height:auto;border-radius:10px;border:1px solid rgba(255,255,255,.12);display:block}
pre{white-space:pre-wrap;word-break:break-word;background:#0b1220;border:1px solid #24324a;border-radius:12px;padding:14px;max-height:280px;overflow:auto;font:12.5px/1.5 Consolas,monospace;color:#c9d7e6}
.card{background:#fff;color:#242424;border-radius:10px;max-width:560px;margin:0 auto;padding:0;overflow:hidden;font-family:"Segoe UI",sans-serif}"""
COPYJS = """function say(id, t){ document.getElementById(id).textContent = t; }
function put(h, txt, id, done){ try{ if(window.ClipboardItem && navigator.clipboard && navigator.clipboard.write){ navigator.clipboard.write([new ClipboardItem({"text/html": new Blob([h], {type:"text/html"}), "text/plain": new Blob([txt], {type:"text/plain"})})]).then(function(){ say(id, done); }, function(){ selCopy(h, id, done); }); return; } }catch(e){} selCopy(h, id, done); }
function selCopy(h, id, done){ var d = document.createElement("div"); d.contentEditable = "true"; d.innerHTML = h; d.style.cssText = "position:fixed;left:-9999px;top:0"; document.body.appendChild(d);
  var r = document.createRange(); r.selectNodeContents(d); var s = getSelection(); s.removeAllRanges(); s.addRange(r); var ok = false; try{ ok = document.execCommand("copy"); }catch(e){} s.removeAllRanges(); d.remove(); say(id, ok ? done : "Couldn't copy here. Try another browser."); }
function text(t, id, done){ if(navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(function(){ say(id, done); }, function(){ fb(t, id, done); }); else fb(t, id, done); }
function fb(t, id, done){ var a = document.createElement("textarea"); a.value = t; document.body.appendChild(a); a.select(); try{ document.execCommand("copy"); say(id, done); }catch(e){ say(id, "Press Ctrl+C to copy."); } a.remove(); }"""

tour_page = """<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>FPLN email tour</title>
<meta name="robots" content="noindex"><style>@@CSS@@</style></head><body><div class="wrap">
<p class="k">FPLN · Email tour</p><h1>A clickable tour of FPLN for any email.</h1>
<p>Six features, each with its own button that opens FPLN right on that feature, plus a big <b>Get FPLN</b> button. Copy it, then paste into a new email with <b>Ctrl+V</b>.</p>
<div class="stage dark" id="tour">@@TOUR@@</div>
<div class="row"><button class="pri" id="cpo">Copy for Outlook</button><button class="pri" id="cpg">Copy for Gmail &amp; others</button><button class="gh" id="code">Copy HTML code</button></div>
<div class="msg" id="msg" role="status" aria-live="polite"></div>
<ol><li><b>Outlook</b> (Army and school email): Copy for Outlook puts the pictures inside the email, so they show even where Outlook blocks pictures from the internet.</li>
<li><b>Gmail and others:</b> Copy for Gmail &amp; others links the pictures from the FPLN site, which keeps the email small.</li>
<li>On phones the feature tiles stack in one column; in Outlook on a computer they sit two by two.</li>
<li>If pictures are turned off, every button and link still shows and works.</li>
<li>While you write the email, Outlook and Gmail show a small "Go to link" box when you click a link. The people you send it to can click straight through.</li></ol>
</div>
<script>
(function(){ @@COPYJS@@
  var HOSTED = @@HOSTED@@, DATA = @@DATA@@, box = document.getElementById("tour");
  function srcs(map){ var c = box.cloneNode(true); [].forEach.call(c.querySelectorAll("img[data-k]"), function(i){ i.src = map[i.getAttribute("data-k")]; i.removeAttribute("data-k"); }); return c.innerHTML; }
  [].forEach.call(box.querySelectorAll("img"), function(i){ for(var k in HOSTED){ if(i.getAttribute("src") === HOSTED[k]){ i.setAttribute("data-k", k); i.src = DATA[k]; } } });
  document.getElementById("cpo").onclick = function(){ put(srcs(DATA), "@@GET@@", "msg", "Copied for Outlook. Paste it into a new email."); };
  document.getElementById("cpg").onclick = function(){ put(srcs(HOSTED), "@@GET@@", "msg", "Copied. Paste it into a new email."); };
  document.getElementById("code").onclick = function(){ text(@@RAW@@, "msg", "HTML code copied."); };
})();
</script></body></html>"""
RAW = fill(TOUR, HOSTED)
tour_page = (tour_page.replace("@@CSS@@", PAGE_CSS).replace("@@COPYJS@@", COPYJS).replace("@@TOUR@@", RAW)
  .replace("@@HOSTED@@", json.dumps(HOSTED)).replace("@@DATA@@", json.dumps(DATA)).replace("@@GET@@", GET).replace("@@RAW@@", json.dumps(RAW).replace("</", "<\\/")))
open("share/tour.html", "w", encoding="utf-8").write(tour_page)

# ---------- Teams ----------
POST = ('<div><a href="' + GET + '" target="_blank"><img src="' + BASE + 'share/teams/header-2x1.png" width="600" height="300" alt="FPLN. Own the day." style="width:600px;max-width:100%;height:auto;border:0"></a></div>'
  '<p><b>FPLN: Own the day.</b> A free planner built by cadets, for cadets. What\'s next and when to leave, quick tasks, an alarm that briefs your day, minute-calling heads-ups and the uniform of the day. Your data stays on your device.</p>'
  '<p>&#9654; <a href="' + GET + '" target="_blank"><b>Get FPLN</b></a> (one click, free) &nbsp;&middot;&nbsp; <a href="' + APP + '" target="_blank">Open it in your browser</a> &nbsp;&middot;&nbsp; <a href="' + BASE + 'share/" target="_blank">Share it</a></p>')
POSTTXT = "FPLN: Own the day. A free planner built by cadets, for cadets.\nGet FPLN (one click, free): " + GET + "\nOpen it in your browser: " + APP
FEAT = [("next", "What's next", "Your next formation, class or duty, and when to leave.", "ops"),
        ("tasks", "Tasks & brain dump", "Jot a task in two seconds; FPLN fits it into your day.", "tasks"),
        ("alarm", "Alarm & minute calling", "A wake-up that briefs your day, and a heads-up before minute calling.", "home"),
        ("uniform", "Uniform of the day", "The uniform on your cadet as soon as it's posted.", "home"),
        ("brief", "Flight plan brief", "Your whole day read to you like a pilot's brief.", "brief"),
        ("eric", "Eric, your first officer", "Ask what's next or add a task in plain words.", "home")]
def feat(k, t, d, go):
    return {"type": "ColumnSet", "spacing": "Medium", "selectAction": {"type": "Action.OpenUrl", "url": APP + "#go=" + go, "tooltip": "Open " + t + " in FPLN"},
      "columns": [{"type": "Column", "width": "auto", "items": [{"type": "Image", "url": BASE + "share/email/ico-" + k + ".png", "width": "40px", "height": "40px", "altText": t}]},
                  {"type": "Column", "width": "stretch", "verticalContentAlignment": "Center", "items": [
                      {"type": "TextBlock", "text": t, "weight": "Bolder", "wrap": True},
                      {"type": "TextBlock", "text": d, "isSubtle": True, "spacing": "None", "wrap": True, "size": "Small"}]}]}
CARD = {"type": "AdaptiveCard", "version": "1.5", "msteams": {"width": "Full"},
  "body": [
    {"type": "Image", "url": BASE + "share/teams/header-2x1.png", "altText": "FPLN. Own the day.", "size": "Stretch", "selectAction": {"type": "Action.OpenUrl", "url": GET, "tooltip": "Get FPLN"}},
    {"type": "TextBlock", "text": "NOW IN BETA · CLEARED FOR TAKEOFF", "size": "Small", "weight": "Bolder", "color": "Good", "spacing": "Medium", "fontType": "Monospace"},
    {"type": "TextBlock", "text": "Your day, planned like a flight.", "size": "Large", "weight": "Bolder", "wrap": True, "spacing": "Small"},
    {"type": "TextBlock", "text": "FPLN is a free planner built by cadets, for cadets. It knows what's next, when to leave, and what to wear, and your data stays on your own device.", "wrap": True},
    {"type": "FactSet", "facts": [{"title": "Cost", "value": "Free"}, {"title": "Updates", "value": "Itself, automatically"}, {"title": "Your data", "value": "Stays on your device"}]},
    {"type": "Container", "id": "inside", "isVisible": False, "separator": True, "spacing": "Medium", "items":
      [{"type": "TextBlock", "text": "Tap a feature to open it in FPLN", "size": "Small", "isSubtle": True, "wrap": True}] + [feat(*f) for f in FEAT]}],
  "actions": [
    {"type": "Action.OpenUrl", "title": "Get FPLN", "url": GET, "style": "positive"},
    {"type": "Action.ToggleVisibility", "title": "What's inside", "targetElements": ["inside"]},
    {"type": "Action.OpenUrl", "title": "Open in browser", "url": APP}]}
CARDJSON = json.dumps(CARD, indent=2, ensure_ascii=False)
open("share/teams/card.json", "w", encoding="utf-8").write(CARDJSON + "\n")
HOWTO = """How to post the interactive FPLN card in Teams
==============================================
Teams doesn't let you paste a card straight into a chat, so you post it once with a Teams Workflow
(Power Automate). It takes about two minutes.

1. In Teams, open Workflows (in the left bar, or search "Workflows" under Apps) and choose Create, then
   start from blank ("Create from blank" or "Instant cloud flow" in Power Automate).
2. Trigger: "Manually trigger a flow".
3. Add an action: Microsoft Teams > "Post card in a chat or channel".
     Post as: Flow bot
     Post in: Channel (pick the team and channel), or Group chat
     Adaptive Card: paste everything from card.json (the Copy card code button on the Teams page)
4. Save, then press Test > Manually > Run flow. The card appears in the channel.

What people see: the FPLN banner, a short intro and three buttons. "Get FPLN" opens the install page,
"What's inside" opens the six features right inside the card (each one opens FPLN on that feature),
and "Open in browser" opens FPLN.

To check it before posting, paste card.json into the Adaptive Cards Designer (adaptivecards.io/designer)
and pick Microsoft Teams as the host app.
If your unit's Teams blocks Workflows, use the paste-in post instead; it needs no setup.
"""
open("share/teams/how-to-post-the-card.txt", "w", encoding="utf-8").write(HOWTO)

teams_page = """<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>FPLN for Teams</title>
<meta name="robots" content="noindex"><style>@@CSS@@</style></head><body><div class="wrap">
<p class="k">FPLN · Microsoft Teams</p><h1>Put FPLN in front of your team.</h1>
<p>Three ways, from quickest to fanciest: a post you paste into any chat or channel, a header picture for a channel Announcement, and an interactive card with buttons.</p>

<h2>1. Paste-in post</h2><p>Click <b>Copy post</b>, then paste (<b>Ctrl+V</b>) into a Teams chat or a new channel post. The picture and links come with it. No setup.</p>
<div class="stage" id="post"><div style="max-width:600px;margin:0 auto;color:#242424;font:15px/1.5 'Segoe UI',sans-serif">@@POST@@</div></div>
<div class="row"><button class="pri" id="cpPost">Copy post</button><button class="gh" id="cpPostT">Copy as plain text</button></div><div class="msg" id="m1" role="status" aria-live="polite"></div>

<h2>2. Announcement header</h2><p>In a channel, start a post, choose <b>Announcement</b>, then the picture button on the headline and <b>Upload an image</b>. Teams crops headers differently on computers and phones, so there are two shapes: wide (Teams' banner shape) and 2:1 (shows more). The FPLN name sits in the middle so it survives any crop.</p>
<div class="pics"><img src="teams/header-wide.png" alt="FPLN wide Teams announcement header"><img src="teams/header-2x1.png" alt="FPLN 2:1 Teams announcement header" style="max-width:600px"></div>
<div class="row"><a class="dl pri" href="teams/header-wide.png" download="FPLN Teams header (wide).png">Download wide header</a><a class="dl gh" href="teams/header-2x1.png" download="FPLN Teams header (2x1).png">Download 2:1 header</a></div>

<h2>3. Interactive card</h2><p>A Teams card with buttons: <b>Get FPLN</b>, <b>What's inside</b> (opens six features inside the card; each opens FPLN on that feature) and <b>Open in browser</b>. Teams needs a Workflow to post a card; the steps take about two minutes.</p>
<div class="pics"><img src="teams/card-preview.png" alt="Preview of the FPLN Teams card with What's inside open" style="max-width:560px;margin:0 auto"></div>
<div class="row"><button class="pri" id="cpCard">Copy card code</button><a class="dl gh" href="teams/card.json" download="FPLN Teams card.json">Download card.json</a><a class="dl gh" href="teams/how-to-post-the-card.txt" download="How to post the FPLN Teams card.txt">Download the steps</a></div><div class="msg" id="m3" role="status" aria-live="polite"></div>
<ol><li>Teams &rsaquo; <b>Workflows</b> &rsaquo; Create from blank. Trigger: <b>Manually trigger a flow</b>.</li><li>Add <b>Microsoft Teams &rsaquo; Post card in a chat or channel</b>. Post as Flow bot, pick the channel, and paste the card code into <b>Adaptive Card</b>.</li><li>Save, then <b>Test &rsaquo; Run flow</b>. The card appears in the channel.</li></ol>
</div>
<script>
(function(){ @@COPYJS@@
  var POSTDATA = @@POSTDATA@@, CARD = @@CARD@@;
  document.getElementById("cpPost").onclick = function(){ put(POSTDATA, @@POSTTXT@@, "m1", "Post copied. Paste it into Teams."); };
  document.getElementById("cpPostT").onclick = function(){ text(@@POSTTXT@@, "m1", "Text copied."); };
  document.getElementById("cpCard").onclick = function(){ text(CARD, "m3", "Card code copied. Paste it into the Adaptive Card box."); };
})();
</script></body></html>"""
POSTDATA = POST.replace(BASE + "share/teams/header-2x1.png", b64("share/teams/header-2x1.png"))
teams_page = (teams_page.replace("@@CSS@@", PAGE_CSS).replace("@@COPYJS@@", COPYJS).replace("@@POST@@", POST.replace(BASE + "share/teams/header-2x1.png", "teams/header-2x1.png"))
  .replace("@@POSTDATA@@", json.dumps(POSTDATA).replace("</", "<\\/")).replace("@@CARD@@", json.dumps(CARDJSON).replace("</", "<\\/")).replace("@@POSTTXT@@", json.dumps(POSTTXT)))
open("share/teams.html", "w", encoding="utf-8").write(teams_page)
print("share/tour.html, share/teams.html, share/teams/card.json built")
