# Nach jeder Änderung an der App einmal ausführen:  python einzeldatei-erstellen.py
#
# 1. Erzeugt "Sachkunde-34a-Lerntrainer.html" – die ganze App in einer Datei (zum Weitergeben).
# 2. Trägt in sw.js die Dateiliste und eine neue Versionsnummer ein, damit installierte
#    Web-Apps die Änderung beim nächsten Start mit Internet bemerken.
import hashlib, io, json, os, re

root = os.path.dirname(os.path.abspath(__file__))
read = lambda p: io.open(os.path.join(root, p), encoding="utf-8").read()

# ---- 1. Einzeldatei ----
html = read("index.html")
html = html.replace('<link rel="stylesheet" href="styles.css">', "<style>\n" + read("styles.css") + "\n</style>")

def inline(m):
    code = read(m.group(1)).replace("</script", "<\\/script")
    return "<script>\n" + code + "\n</script>"

html, n = re.subn(r'<script src="([^"]+)"></script>', inline, html)
html = re.sub(r'\n<link rel="(manifest|apple-touch-icon)"[^>]*>', "", html)   # Einzeldatei hat keine Nebendateien
out = os.path.join(root, "Sachkunde-34a-Lerntrainer.html")
io.open(out, "w", encoding="utf-8", newline="\n").write(html)
print("%d Skripte eingebettet -> %s (%d KB)" % (n, os.path.basename(out), os.path.getsize(out) // 1024))

# ---- 2. Offline-Speicher der Web-App ----
files = ["index.html", "styles.css", "app.js", "manifest.webmanifest"]
files += sorted("daten/" + f for f in os.listdir(os.path.join(root, "daten")) if f.endswith(".js"))
files += sorted("icons/" + f for f in os.listdir(os.path.join(root, "icons")) if f.endswith(".png"))
h = hashlib.sha1()
for f in files:
    h.update(open(os.path.join(root, f), "rb").read())
version = h.hexdigest()[:10]
sw = read("sw.js")
sw = re.sub(r'const VERSION = "[^"]*";', 'const VERSION = "%s";' % version, sw)
sw = re.sub(r"const FILES = \[[^\]]*\];", "const FILES = " + json.dumps(["./"] + files, ensure_ascii=False) + ";", sw)
io.open(os.path.join(root, "sw.js"), "w", encoding="utf-8", newline="\n").write(sw)
print("sw.js: Version %s, %d Dateien im Offline-Speicher" % (version, len(files) + 1))
