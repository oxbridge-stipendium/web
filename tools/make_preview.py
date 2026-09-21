#!/usr/bin/env python3
"""Vytvoří kopii webu s cestami přepsanými na podsložku (náhled na GitHub Pages).

Produkční web v kořeni repozitáře používá absolutní cesty od kořene domény
(např. /css/site.css). GitHub Pages ale servíruje tento repozitář v podsložce
https://oxbridge-stipendium.github.io/web/, takže by se takové cesty rozbily.

Skript proto vyrobí druhou kopii webu, ve které je před každou absolutní cestu
doplněna předpona (výchozí /web/). Kořen repozitáře zůstane beze změny.

Použití:
    python3 tools/make_preview.py --out ../preview-build --prefix /web/

Skript nic nemaže v repozitáři a nic nikam neodesílá.
"""
from __future__ import annotations

import argparse
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

# Co se do náhledu nekopíruje: verzovací data, data z Lambdy, nástroje, dokumentace.
SKIP_TOP = {".git", ".github", "data", "tools", "README.md"}

# Textové soubory, ve kterých se cesty přepisují.
HTML_SUFFIXES = {".html"}
TEXT_SUFFIXES = {".html", ".css", ".js", ".json"}

# Atributy, které mohou nést jednu adresu.
URL_ATTRS = ("href", "src", "content", "action", "poster", "data-src")


def prefix_url(value: str, prefix: str) -> str:
    """Doplní předponu k absolutní cestě. Nechá být plné URL a kotvy."""
    if not value.startswith("/"):
        return value
    if value.startswith("//"):  # protokolově relativní URL (//example.com)
        return value
    if value.startswith(prefix):  # už přepsáno
        return value
    return prefix.rstrip("/") + value


def rewrite_srcset(value: str, prefix: str) -> str:
    """Přepíše seznam adres v atributu srcset ('/a.jpg 1x, /b.jpg 2x')."""
    parts = []
    for item in value.split(","):
        stripped = item.strip()
        if not stripped:
            continue
        bits = stripped.split(None, 1)
        url = prefix_url(bits[0], prefix)
        parts.append(url if len(bits) == 1 else url + " " + bits[1])
    return ", ".join(parts)


def rewrite_html(text: str, prefix: str) -> str:
    for attr in URL_ATTRS:
        pattern = re.compile(r'(\b' + re.escape(attr) + r'=")(/[^"]*)(")')
        text = re.sub(pattern, lambda m: m.group(1) + prefix_url(m.group(2), prefix) + m.group(3), text)
    text = re.sub(r'(\bsrcset=")([^"]*)(")',
                  lambda m: m.group(1) + rewrite_srcset(m.group(2), prefix) + m.group(3), text)
    # Cesty uvnitř url(...) v případných vložených stylech.
    text = rewrite_css(text, prefix)
    return text


def rewrite_css(text: str, prefix: str) -> str:
    return re.sub(
        r'url\(\s*(["\']?)(/[^)"\']*)\1\s*\)',
        lambda m: "url(" + m.group(1) + prefix_url(m.group(2), prefix) + m.group(1) + ")",
        text,
    )


def rewrite_js(text: str, prefix: str) -> str:
    # Pouze řetězce, které ukazují na skutečné složky webu.
    return re.sub(
        r'(["\'])(/(?:assets|css|js)/[^"\']*)\1',
        lambda m: m.group(1) + prefix_url(m.group(2), prefix) + m.group(1),
        text,
    )


def rewrite(path: Path, text: str, prefix: str) -> str:
    if path.suffix in HTML_SUFFIXES:
        return rewrite_html(text, prefix)
    if path.suffix == ".css":
        return rewrite_css(text, prefix)
    if path.suffix == ".js":
        return rewrite_js(text, prefix)
    if path.suffix == ".json":
        return rewrite_js(text, prefix)
    return text


def main() -> int:
    parser = argparse.ArgumentParser(description="Vyrobí náhledovou kopii webu s předponou cest.")
    parser.add_argument("--out", required=True, help="Cílová složka (bude přepsána).")
    parser.add_argument("--prefix", default="/web/", help="Předpona cest, výchozí /web/.")
    args = parser.parse_args()

    prefix = "/" + args.prefix.strip("/") + "/"
    out = Path(args.out).resolve()
    if out == ROOT or ROOT in out.parents:
        print("Cílová složka musí ležet mimo repozitář.", file=sys.stderr)
        return 1
    if out.exists():
        shutil.rmtree(out)
    out.mkdir(parents=True)

    copied = changed = 0
    for source in sorted(ROOT.rglob("*")):
        relative = source.relative_to(ROOT)
        if relative.parts[0] in SKIP_TOP:
            continue
        target = out / relative
        if source.is_dir():
            target.mkdir(parents=True, exist_ok=True)
            continue
        target.parent.mkdir(parents=True, exist_ok=True)
        if source.suffix in TEXT_SUFFIXES:
            original = source.read_text(encoding="utf-8")
            updated = rewrite(source, original, prefix)
            target.write_text(updated, encoding="utf-8")
            if updated != original:
                changed += 1
        else:
            shutil.copyfile(source, target)
        copied += 1

    if not (out / "index.html").is_file():
        print("Chyba: v náhledu chybí index.html.", file=sys.stderr)
        return 1
    print(f"Náhled hotov v {out} — {copied} souborů, přepsáno cest v {changed} souborech, předpona {prefix}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
