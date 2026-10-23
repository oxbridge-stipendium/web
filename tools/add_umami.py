#!/usr/bin/env python3
"""Vlozi (nebo odebere) merici skript Umami na vsechny stranky. Idempotentni.

Pouziti:
    python3 tools/add_umami.py --src https://cloud.umami.is/script.js --website-id <UUID>
    python3 tools/add_umami.py --src ... --website-id ... --domains www.oxbridgestipendium.org
    python3 tools/add_umami.py --remove

--domains doporucuju vyplnit: Umami pak sbira jen provoz z produkcni domeny,
takze nahled na github.io statistiky neznecisti.
"""
import argparse, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MARK = "<!-- umami -->"


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--src")
    p.add_argument("--website-id")
    p.add_argument("--domains")
    p.add_argument("--remove", action="store_true")
    p.add_argument("--root", default=str(ROOT))
    a = p.parse_args()
    root = Path(a.root).resolve()

    if not a.remove and not (a.src and a.website_id):
        print("Chybi --src a --website-id (nebo pouzij --remove).", file=sys.stderr)
        return 1

    if a.remove:
        tag = None
    else:
        extra = ' data-domains="%s"' % a.domains if a.domains else ""
        tag = '%s<script defer src="%s" data-website-id="%s"%s></script>' % (MARK, a.src, a.website_id, extra)

    changed = 0
    for path in sorted(root.rglob("*.html")):
        original = path.read_text(encoding="utf-8")
        text = re.sub(re.escape(MARK) + r'<script[^>]*></script>\n?', "", original)
        if tag:
            if "</head>" not in text:
                continue
            text = text.replace("</head>", tag + "\n</head>", 1)
        if text != original:
            path.write_text(text, encoding="utf-8")
            changed += 1
    print(("odebrano z" if a.remove else "vlozeno na"), changed, "stranek")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
