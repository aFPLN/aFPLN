"""Builds kit/FPLN-kit.zip: everything for FPLN in one download. Run from the repo root."""
import io, os, re, zipfile, html, json
R = "."
ZIP = "kit/FPLN-kit.zip"
BASE = "https://afpln.github.io/aFPLN/"
STAMP = (2026, 11, 8, 0, 0, 0)
def url(name, target): return ("[InternetShortcut]\r\nURL=%s\r\nIconIndex=0\r\n" % target).encode()
share = open("share/index.html", encoding="utf-8").read()
msg = html.unescape(re.search(r'id="msgT">(.*?)</pre>', share, re.S).group(1)).strip()
def box(i):
    m = re.search(r'id="%s"[^>]*>(.*?)</div>\s*<div class="row">' % i, share, re.S); return m.group(1).strip()
email = """<!doctype html><html lang="en"><head><meta charset="utf-8"><title>FPLN email banners</title>
<style>body{margin:0;padding:32px 20px;background:#eef2f6;font:15px/1.5 Segoe UI,Arial,sans-serif;color:#1d2433}h1{font-size:20px;margin:0 0 6px}p{margin:0 0 18px;max-width:640px}.b{background:#fff;border-radius:14px;padding:18px;margin:0 0 26px;max-width:640px;box-shadow:0 2px 8px rgba(0,0,0,.08)}h2{font-size:15px;margin:0 0 10px}</style></head><body>
<h1>FPLN email banners</h1><p>Drag across a banner to select it (or click just before it and Shift+click just after), press <b>Ctrl+C</b>, then paste into your email with <b>Ctrl+V</b>. The pasted banner stays clickable. The Share page's <b>Copy banner</b> button does the same in one click.</p>
<div class="b"><h2>Picture banner</h2>%s</div><div class="b"><h2>Text banner (works when pictures are blocked)</h2>%s</div></body></html>""" % (box("boxPic"), box("boxTxt"))
readme = """FPLN KIT  (Flight Plan, beta 1)
=================================
Everything for FPLN in one place.

1 Install FPLN\\
   Install FPLN.cmd ............ opens the install page in Edge; click Install FPLN
   FPLN keep awake.cmd ......... stops Windows sleeping while plugged in (for overnight alarms); asks Y/N first
   FPLN undo keep awake.cmd .... puts your sleep settings back
   FPLN (web link) ............. opens FPLN in your browser

2 Share\\
   banner.png .................. the big FPLN banner
   badge.png, badge-gold.png ... install badges
   qr-code.png ................. scan to install (phones)
   link-preview.png ............ what a pasted link looks like in chats
   email-banners.html .......... open it, copy a banner, paste into an email (stays clickable)
   message.txt ................. ready-made text to send people

3 Links\\
   FPLN app, Install page, Share page, Download machine
   (edit the install page from your private FPLN Command Center)

4 Screenshots\\
   FPLN on a laptop and on a phone

Install link to give people:  %sget
Keep CUI out of FPLN. Your data stays on your own device.
""" % BASE
files = []
for f in ["Install FPLN.cmd", "FPLN keep awake.cmd", "FPLN undo keep awake.cmd", "FPLN (web link).url", "README.txt", "FPLN.ico"]:
    with zipfile.ZipFile("download/FPLN-beta.zip") as z: files.append(("1 Install FPLN/" + f, z.read("FPLN/" + f)))
for src, dst in [("share/banner.png","banner.png"),("share/badge.png","badge.png"),("share/badge-gold.png","badge-gold.png"),("share/qr.png","qr-code.png"),("share/og.png","link-preview.png")]:
    files.append(("2 Share/" + dst, open(src, "rb").read()))
files.append(("2 Share/email-banners.html", email.encode()))
files.append(("2 Share/message.txt", msg.replace("\n", "\r\n").encode("utf-8-sig")))
for name, u in [("FPLN app", ""), ("Install page", "get"), ("Share page", "share/"), ("Download machine", "kit/")]:
    files.append(("3 Links/%s.url" % name, url(name, BASE + u)))
for src, dst in [("download/shot-desktop.png", "FPLN on a laptop.png"), ("download/shot-phone.png", "FPLN on a phone.png")]:
    files.append(("4 Screenshots/" + dst, open(src, "rb").read()))
files.insert(0, ("README.txt", readme.replace("\n", "\r\n").encode()))
os.makedirs("kit", exist_ok=True)
with zipfile.ZipFile(ZIP, "w", zipfile.ZIP_DEFLATED) as z:
    for n, b in files:
        zi = zipfile.ZipInfo("FPLN kit/" + n, STAMP); zi.compress_type = zipfile.ZIP_DEFLATED; z.writestr(zi, b)
size = os.path.getsize(ZIP)
json.dump({"bytes": size, "files": [n for n, _ in files]}, open("kit/kit.json", "w"), indent=1)
print("built", ZIP, size, "bytes,", len(files), "files")
