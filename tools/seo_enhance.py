#!/usr/bin/env python3
"""Doplni SEO veci, ktere v nove verzi chybely (2026-10-23). Idempotentni."""
import html, json, re
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
BASE = "https://www.oxbridgestipendium.org"
LOGO = "/assets/images/737480c0b38f09-69a08a_7dffe376e7b048a6a82c1aab750e70e0-mv2.png"
LANGS = {"en": "en", "sk": "sk"}
DESC = {
 "cs": "Propojujeme studenty z Ceska a Slovenska prijate na Oxford a Cambridge s darci, kteri jim pomahaji zaplatit skolne.",
 "sk": "Spajame studentov z Ceska a Slovenska prijatych na Oxford a Cambridge s darcami, ktori im pomahaju zaplatit skolne.",
 "en": "We connect students from Czechia and Slovakia admitted to Oxford and Cambridge with donors who help them cover tuition.",
}
stats = {"abs":0,"desc":0,"ld":0,"dims":0,"webp":0}

def plain(x):
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", x))).strip()

def describe(body, title=""):
    # Projdeme vsechny odstavce a vezmeme prvni dost dlouhy; kratke popisky
    # typu eyebrow nebo datum preskocime.
    candidates = []
    lead = re.search(r'<p class="lead">(.*?)</p>', body, re.S)
    if lead:
        candidates.append(lead.group(1))
    candidates += re.findall(r"<p[^>]*>(.*?)</p>", body, re.S)
    candidates += re.findall(r"<li[^>]*>(.*?)</li>", body, re.S)
    for raw in candidates:
        t = plain(raw)
        if len(t) < 60:
            continue
        return t if len(t) <= 158 else t[:158].rsplit(" ", 1)[0].rstrip(" ,;:") + "\u2026"
    # Nic pouzitelneho: slozime popisek z nazvu stranky a poslani organizace.
    if title:
        return (title + " \u2013 " + DESC["cs"])[:158]
    return ""


conv = {}
for png in sorted((ROOT/"assets/images").glob("*.png")):
    if png.stat().st_size < 400000: continue
    webp = png.with_suffix(".webp")
    if not webp.exists():
        with Image.open(png) as im:
            im.convert("RGBA" if im.mode in ("RGBA","LA","P") else "RGB").save(webp,"WEBP",quality=82,method=6)
    conv["/assets/images/"+png.name] = "/assets/images/"+webp.name
    stats["webp"] += 1

sizes = {}
def dims(src):
    if src in sizes: return sizes[src]
    p = ROOT / src.lstrip("/")
    if p.suffix.lower() not in (".png",".jpg",".jpeg",".webp") or not p.is_file():
        sizes[src] = None; return None
    with Image.open(p) as im: sizes[src] = im.size
    return sizes[src]

def addsize(m):
    tag = m.group(0)
    if "width=" in tag or "height=" in tag: return tag
    s = re.search(r'src="([^"]+)"', tag)
    if not s: return tag
    d = dims(s.group(1))
    if not d: return tag
    stats["dims"] += 1
    return tag[:-1].rstrip() + ' width="%d" height="%d">' % d

for path in sorted(ROOT.rglob("*.html")):
    rel = path.relative_to(ROOT)
    orig = path.read_text(encoding="utf-8")
    text = orig
    for a, b in conv.items(): text = text.replace(a, b)
    cut = text.find("</head>")
    if cut == -1: continue
    head, body = text[:cut+7], text[cut+7:]

    def fix(m):
        stats["abs"] += 1
        return m.group(1) + BASE + m.group(2) + m.group(3)
    head = re.sub(r'(<meta content=")(/[^"]*)(" property="og:image"/>)', fix, head)
    head = re.sub(r'(<meta content=")(/[^"]*)(" name="twitter:image"/>)', fix, head)

    tm = re.search(r"<title>(.*?)</title>", head, re.S)
    d = describe(body, plain(tm.group(1)).split(" | ")[0] if tm else "")
    if d:
        esc = html.escape(d, quote=True)
        for probe, tag in (('name="description"', '<meta content="%s" name="description"/>' % esc),
                           ('property="og:description"', '<meta content="%s" property="og:description"/>' % esc),
                           ('name="twitter:description"', '<meta content="%s" name="twitter:description"/>' % esc)):
            if probe not in head:
                head = head.replace("</head>", tag + "\n</head>", 1); stats["desc"] += 1

    lang = LANGS.get(rel.parts[0] if rel.parts else "", "cs")
    cm = re.search(r'<link href="([^"]+)" rel="canonical"/>', head)
    folder = str(rel.parent).strip(".").strip("/")
    url = cm.group(1) if cm else BASE + "/" + (folder + "/" if folder else "")
    blocks = []
    if rel.as_posix() in ("index.html","en/index.html","sk/index.html"):
        blocks = [
          {"@context":"https://schema.org","@type":"NGO","name":"Oxbridge Stipendium","url":url,"logo":BASE+LOGO,
           "description":DESC[lang],"knowsLanguage":["cs","sk","en"],
           "areaServed":[{"@type":"Country","name":"Czechia"},{"@type":"Country","name":"Slovakia"}]},
          {"@context":"https://schema.org","@type":"WebSite","name":"Oxbridge Stipendium","url":url,"inLanguage":lang,
           "publisher":{"@type":"NGO","name":"Oxbridge Stipendium","url":BASE}},
        ]
    elif "post" in rel.parts:
        t = re.search(r"<title>(.*?)</title>", head, re.S)
        if t:
            art = {"@context":"https://schema.org","@type":"Article","headline":plain(t.group(1)).split(" | ")[0],
                   "url":url,"inLanguage":lang,
                   "publisher":{"@type":"NGO","name":"Oxbridge Stipendium","url":BASE}}
            dt = re.search(r'<time[^>]*datetime="([^"]+)"', body)
            if dt: art["datePublished"] = dt.group(1)
            im = re.search(r'<meta content="([^"]+)" property="og:image"/>', head)
            if im: art["image"] = im.group(1) if im.group(1).startswith("http") else BASE + im.group(1)
            blocks = [art]
    if blocks and "application/ld+json" not in head:
        payload = "\n".join('<script type="application/ld+json">' + json.dumps(b, ensure_ascii=False, separators=(",",":")) + "</script>" for b in blocks)
        head = head.replace("</head>", payload + "\n</head>", 1); stats["ld"] += len(blocks)

    body = re.sub(r"<img\b[^>]*>", addsize, body)
    text = head + body
    if text != orig: path.write_text(text, encoding="utf-8")

lines = ["# Oxbridge Stipendium","","> "+DESC["cs"],"> "+DESC["en"],"",
 "Nejsme grantova agentura. Jsme duveryhodny prostrednik: studenta s oficialni nabidkou Oxfordu",
 "nebo Cambridge spojime s darcem a zajistime administrativu vcetne platby skolneho.",
 "Vyber prijemcu ani podminky podpory neurcujeme, to delaji darci.","","## Stranky","",
 "- [Uvod]("+BASE+"/): kdo jsme a jak to funguje",
 "- [O nas]("+BASE+"/about/): vznik, tym, kontext po brexitu",
 "- [Pro darce]("+BASE+"/donors/): jak podporit studenta",
 "- [Pro studenty]("+BASE+"/students/): podminky a postup",
 "- [Uchazeci o stipendium]("+BASE+"/scholarship-seekers/): profily studentu, kteri hledaji podporu",
 "- [Clanky]("+BASE+"/blog/)","","## Jazyky","",
 "- cestina: "+BASE+"/","- slovenstina: "+BASE+"/sk/","- anglictina: "+BASE+"/en/","","## Poznamky","",
 "- Castku potrebne podpory deklaruje student cestnym prohlasenim, organizace ji neoveruje.",
 "- Profily uchazecu se na uvodce i na jejich strance zobrazuji v nahodnem poradi.",""]
(ROOT/"llms.txt").write_text("\n".join(lines), encoding="utf-8")

rp = ROOT/"robots.txt"
rc = rp.read_text(encoding="utf-8").rstrip()
if "GPTBot" not in rc:
    extra = ["","# Modelum a jejich vyhledavacum obsah povolujeme (2026-10-23)."]
    for c in ("GPTBot","OAI-SearchBot","ChatGPT-User","ClaudeBot","Claude-User","PerplexityBot","Google-Extended"):
        extra += ["User-agent: "+c,"Allow: /",""]
    extra += ["# Prehled pro modely: "+BASE+"/llms.txt"]
    rp.write_text(rc+"\n"+"\n".join(extra)+"\n", encoding="utf-8")

print("absolutni og/twitter obrazky:", stats["abs"])
print("doplnene description tagy:", stats["desc"])
print("JSON-LD bloku:", stats["ld"])
print("doplnene rozmery obrazku:", stats["dims"])
print("PNG prevedeno do webp:", stats["webp"])
