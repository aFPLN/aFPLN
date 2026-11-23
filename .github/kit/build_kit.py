"""Builds kit/FPLN-kit.zip: everything for FPLN in one download. Run from the repo root."""
import io, os, re, zipfile, html, json, runpy
R = "."
runpy.run_path(".github/kit/build_share.py")   # email tour + Teams pages, always current
ZIP = "kit/FPLN-kit.zip"
BASE = "https://afpln.github.io/aFPLN/"
def url(name, target): return ("[InternetShortcut]\r\nURL=%s\r\nIconIndex=0\r\n" % target).encode()
share = open("share/index.html", encoding="utf-8").read()
msg = html.unescape(re.search(r'id="msgT">(.*?)</pre>', share, re.S).group(1)).strip()
BLOCK = open(".github/kit/email-banner.html", encoding="utf-8").read().strip()
VER = json.load(open("version.json", encoding="utf-8"))
b = VER.get("built", "202611080000"); STAMP = (int(b[:4]), int(b[4:6]), int(b[6:8]), int(b[8:10]), int(b[10:12]), 0)
email = """<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>FPLN email banner</title>
<style>
:root{color-scheme:dark}*{box-sizing:border-box}
body{margin:0;min-height:100vh;background:radial-gradient(110% 50% at 50% 0%,#15274a,#060b14 70%) #060b14;color:#eef4fa;font:16px/1.55 "Segoe UI",system-ui,sans-serif}
.wrap{width:min(760px,100%);margin:0 auto;padding:36px 16px 60px}
.k{font:600 12px/1 "Segoe UI",sans-serif;letter-spacing:.28em;color:#e2bd74;text-transform:uppercase;margin:0 0 12px}
h1{margin:0 0 8px;font:700 clamp(28px,5vw,40px)/1.1 "Segoe UI",sans-serif}
p{margin:0 0 22px;color:#c3d1de;max-width:40em}
.stage{background:#eef2f6;border-radius:18px;padding:28px 18px;border:1px solid rgba(226,189,116,.45);box-shadow:0 30px 70px -30px #000}
.stage>table{margin:0 auto}
@media (max-width:480px){.stage{padding:14px 6px}.wrap{padding-left:10px;padding-right:10px}}
.row{display:flex;flex-wrap:wrap;gap:10px;margin:20px 0 0}
button,.dl{all:unset;box-sizing:border-box;cursor:pointer;padding:14px 22px;border-radius:12px;font:700 14px/1 "Segoe UI",sans-serif;letter-spacing:.12em;text-transform:uppercase}
.pri{background:linear-gradient(180deg,#f6dca2,#d5a95c);color:#1a1205;box-shadow:0 14px 30px -12px rgba(226,189,116,.8)}
.gh{border:1px solid rgba(255,255,255,.22);color:#eef4fa}
button:focus-visible{outline:3px solid #8fd6ff;outline-offset:3px}
#msg{min-height:1.5em;margin:14px 0 0;color:#9fe3b4;font-weight:600}
ol{color:#9fb2c6;padding-left:20px;margin:26px 0 0}li{margin:0 0 6px}
</style></head><body><div class="wrap">
<p class="k">FPLN · Email banner</p><h1>The reveal. Drop it into any email.</h1>
<p>Pick your email app, click its button, then paste into your message with <b>Ctrl+V</b>. The whole picture is one link to the install page, with a text link underneath in case pictures are turned off.</p>
<div class="stage" id="banner">@@BLOCK@@</div>
<div class="row"><button class="pri" id="cpo">Copy for Outlook</button><button class="pri" id="cp">Copy for Gmail &amp; others</button><button class="gh" id="code">Copy HTML code</button><a class="gh dl" id="dl" download="FPLN-reveal.jpg" href="#">Download picture</a></div>
<div id="msg" role="status" aria-live="polite"></div>
<ol><li><b>Outlook:</b> Copy for Outlook puts the picture inside the email itself, so it shows even where Outlook blocks pictures from the internet (as Army and school email often does).</li><li><b>Gmail and others:</b> Copy for Gmail &amp; others links the picture from the FPLN site, which keeps the email small.</li><li>If Outlook pastes without the picture: Insert &rsaquo; Pictures &rsaquo; pick the downloaded picture, select it, press <b>Ctrl+K</b> and paste <b>https://afpln.github.io/aFPLN/download/</b>.</li><li>Copy HTML code is for email signatures and newsletter tools that take HTML.</li><li>While you're writing the email, Gmail and Outlook show a small “Go to link” box when you click a link instead of opening it. That's normal; the people you send it to can click straight through.</li></ol>
</div>
<script>
(function(){
  var box = document.getElementById("banner"), m = document.getElementById("msg");
  function say(t){ m.textContent = t; }
  var HOST = "https://afpln.github.io/aFPLN/share/fpln-reveal.jpg", DATA = "@@DATA@@";
  /* the page shows the embedded copy, so it works offline too */
  var im = box.querySelector("img"); if(im) im.src = DATA; document.getElementById("dl").href = DATA;
  function html(src){ var c = box.cloneNode(true); var i = c.querySelector("img"); if(i) i.src = src; return c.innerHTML; }
  function put(h, done){ try{ if(window.ClipboardItem && navigator.clipboard && navigator.clipboard.write){ navigator.clipboard.write([new ClipboardItem({"text/html": new Blob([h], {type:"text/html"}), "text/plain": new Blob(["https://afpln.github.io/aFPLN/download/"], {type:"text/plain"})})]).then(function(){ say(done); }, function(){ selCopy(h, done); }); return; } }catch(e){} selCopy(h, done); }
  function selCopy(h, done){ var d = document.createElement("div"); d.contentEditable = "true"; d.innerHTML = h; d.style.cssText = "position:fixed;left:-9999px;top:0"; document.body.appendChild(d);
    var r = document.createRange(); r.selectNodeContents(d); var s = getSelection(); s.removeAllRanges(); s.addRange(r); var ok = false; try{ ok = document.execCommand("copy"); }catch(e){} s.removeAllRanges(); d.remove(); say(ok ? done : "Couldn't copy here. Use Download picture instead."); }
  document.getElementById("cpo").onclick = function(){ put(html(DATA), "Copied for Outlook. Paste it into your email."); };
  document.getElementById("cp").onclick = function(){ put(html(HOST), "Banner copied. Paste it into your email."); };
  document.getElementById("code").onclick = function(){ var t = html(HOST).trim();
    if(navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(function(){ say("HTML code copied."); }, function(){ fb(t); }); else fb(t); };
  function fb(t){ var a = document.createElement("textarea"); a.value = t; document.body.appendChild(a); a.select(); try{ document.execCommand("copy"); say("HTML code copied."); }catch(e){ say("Press Ctrl+C to copy."); } a.remove(); }
})();
</script></body></html>""".replace("@@BLOCK@@", BLOCK).replace("@@DATA@@", "data:image/jpeg;base64," + __import__("base64").b64encode(open("share/fpln-reveal.jpg","rb").read()).decode())
readme = """FPLN KIT  (Flight Plan %s)
=================================
Everything for FPLN in one place.

1 Install FPLN\\
   Install FPLN.cmd ............ opens the install page in Edge; click Install FPLN
   FPLN keep awake.cmd ......... stops Windows sleeping while plugged in (for overnight alarms); asks Y/N first
   FPLN undo keep awake.cmd .... puts your sleep settings back
   FPLN (web link) ............. opens FPLN in your browser

2 Share\\
   FPLN-reveal.jpg ............. the flight-deck reveal poster (what the email banner shows)
   banner.png .................. the FPLN picture to text or post
   email-picture.png ........... the picture used in the email banner
   badge.png, badge-gold.png ... install badges
   link-preview.png ............ what a pasted link looks like in chats
   Email banner.html ........... open it, click Copy banner, paste into any email (stays clickable)
   Email tour.html ............. a clickable tour of FPLN for email: six features, each opens FPLN on it
   Teams\\ ..................... open Teams.html: a paste-in post, announcement headers, and an
                                 interactive Teams card (card.json + how to post it)
   message.txt ................. ready-made text to send people

3 Links\\
   FPLN app, Install page, Share page, Download machine
   (edit the install page from your private FPLN Command Center)

4 Screenshots\\
   FPLN on a laptop, on a phone, and the Flight plan

Install link to give people:  %sget
Keep CUI out of FPLN. Your data stays on your own device.
""" % (VER.get("version", "beta 1"), BASE)
files = []
for f in ["Install FPLN.cmd", "FPLN keep awake.cmd", "FPLN undo keep awake.cmd", "FPLN (web link).url", "README.txt", "FPLN.ico"]:
    with zipfile.ZipFile("download/FPLN-beta.zip") as z: files.append(("1 Install FPLN/" + f, z.read("FPLN/" + f)))
for src, dst in [("share/fpln-reveal.jpg","FPLN-reveal.jpg"),("share/banner.png","banner.png"),("share/banner-email.png","email-picture.png"),("share/badge.png","badge.png"),("share/badge-gold.png","badge-gold.png"),("share/og.png","link-preview.png")]:
    files.append(("2 Share/" + dst, open(src, "rb").read()))
files.append(("2 Share/Email banner.html", email.encode()))
files.append(("2 Share/Email tour.html", open("share/tour.html", "rb").read()))
files.append(("2 Share/Teams/Teams.html", open("share/teams.html", "rb").read()))
for f in ["header-wide.png", "header-2x1.png", "card-preview.png"]:
    files.append(("2 Share/Teams/teams/" + f, open("share/teams/" + f, "rb").read()))
files.append(("2 Share/Teams/FPLN Teams card.json", open("share/teams/card.json", "rb").read()))
files.append(("2 Share/Teams/How to post the Teams card.txt", open("share/teams/how-to-post-the-card.txt", encoding="utf-8").read().replace("\n", "\r\n").encode("utf-8-sig")))
files.append(("2 Share/message.txt", msg.replace("\n", "\r\n").encode("utf-8-sig")))
for name, u in [("FPLN app", ""), ("Install page", "get"), ("Share page", "share/"), ("Download machine", "kit/")]:
    files.append(("3 Links/%s.url" % name, url(name, BASE + u)))
for src, dst in [("download/shot-desktop.png", "FPLN on a laptop.png"), ("download/shot-phone.png", "FPLN on a phone.png"), ("download/shot-brief.png", "FPLN flight plan.png")]:
    files.append(("4 Screenshots/" + dst, open(src, "rb").read()))
files.insert(0, ("README.txt", readme.replace("\n", "\r\n").encode()))
os.makedirs("kit", exist_ok=True)
with zipfile.ZipFile(ZIP, "w", zipfile.ZIP_DEFLATED) as z:
    for n, b in files:
        zi = zipfile.ZipInfo("FPLN kit/" + n, STAMP); zi.compress_type = zipfile.ZIP_DEFLATED; z.writestr(zi, b)
size = os.path.getsize(ZIP)
json.dump({"bytes": size, "version": VER.get("version", ""), "files": [n for n, _ in files]}, open("kit/kit.json", "w"), indent=1)
print("built", ZIP, size, "bytes,", len(files), "files")
