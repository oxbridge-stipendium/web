#!/usr/bin/env python3
"""Napojí formulář „Chci se zapojit jako dárce" na Brevo.

Původní formulář z Wixu odesílal přes mailto (návštěvník musel sám odeslat
připravený e-mail). Tenhle skript v něm nechá vzhled i strukturu a přepíše
jen to, co je potřeba: cíl odeslání, názvy polí a popisky.

Spouští se jednorázově z kořene repa: python3 tools/wire_brevo_form.py
"""

import pathlib
import re
import sys

BREVO_ACTION = (
    "https://6e5b9a69.sibforms.com/serve/MUIFAH6ocRUaguGiVRQJ6g-3hjDS5QsOG6-"
    "YWePKNdIUG1KMnlHbfa7udKn4CIgFwWWdUBDGl4UtilvRB0M1eJ5vXvcrvQM6eFzPxuTKR4fugvz"
    "CKOGzQVV_SNYnmLF2iPv3R-cV6PhcPyPIAb0uY8t9Dp92LFRV2VTBUFGI50w-4Y5MOQ__BUUVsVFXAwyUe9KQuI3L5t2vSkz2Dw=="
)

# Skryté pole email_address_check je past na roboty: Brevo zahodí odeslání,
# ve kterém je vyplněné. Člověk ho nevidí, robot ho vyplní.
HIDDEN = (
    '<input type="text" name="email_address_check" value="" tabindex="-1"'
    ' autocomplete="off" aria-hidden="true" class="brevo-honeypot">'
    '<input type="hidden" name="locale" value="{locale}">'
    '<input type="hidden" name="html_type" value="simple">'
)

# Pole se jmenují v každé jazykové verzi jinak, cílové názvy jsou ale společné.
FIELDS_CS_EN = {"first-name": "FIRSTNAME", "last-name": "LASTNAME", "email": "EMAIL"}
FIELDS_SK = {"krstné-meno": "FIRSTNAME", "priezvisko": "LASTNAME", "email": "EMAIL"}

LABELS_CS = {
    ">First name</label>": ">Jméno</label>",
    ">Last name</label>": ">Příjmení</label>",
    'placeholder="First name"': 'placeholder="Jméno"',
    'placeholder="Last name"': 'placeholder="Příjmení"',
    ">Register</span>": ">Zaregistrovat se</span>",
    'aria-label="Register"': 'aria-label="Zaregistrovat se"',
    "Thanks for your support!": "Děkujeme, registraci máme. Potvrzení jsme poslali na váš e-mail.",
}

LABELS_EN = {
    "Thanks for your support!": "Thank you, you are registered. We have sent a confirmation to your e-mail.",
}

LABELS_SK = {
    ">Register</span>": ">Zaregistrovať sa</span>",
    'aria-label="Register"': 'aria-label="Zaregistrovať sa"',
    "Thanks for your support!": "Ďakujeme, registráciu máme. Potvrdenie sme poslali na váš e-mail.",
}

PAGES = {
    "index.html": {"locale": "cs", "fields": FIELDS_CS_EN, "labels": LABELS_CS},
    "donors/index.html": {"locale": "cs", "fields": FIELDS_CS_EN, "labels": LABELS_CS},
    "scholarship-seekers/index.html": {"locale": "cs", "fields": FIELDS_CS_EN, "labels": LABELS_CS},
    "en/index.html": {"locale": "en", "fields": FIELDS_CS_EN, "labels": LABELS_EN},
    "en/donors/index.html": {"locale": "en", "fields": FIELDS_CS_EN, "labels": LABELS_EN},
    "en/scholarship-seekers/index.html": {"locale": "en", "fields": FIELDS_CS_EN, "labels": LABELS_EN},
    "sk/index.html": {"locale": "sk", "fields": FIELDS_SK, "labels": LABELS_SK},
    "sk/donors/index.html": {"locale": "sk", "fields": FIELDS_SK, "labels": LABELS_SK},
    "sk/scholarship-seekers/index.html": {"locale": "sk", "fields": FIELDS_SK, "labels": LABELS_SK},
}


def wire(path: str, cfg: dict) -> None:
    f = pathlib.Path(path)
    html = f.read_text(encoding="utf-8")
    before = html

    # 1. Cíl odeslání: místo mailto jde formulář do Brevo.
    #    target míří na skrytý rámeček, aby návštěvník zůstal na stránce.
    html = html.replace(
        'action="mailto:stipendium@oxbridgestipendium.org"', f'action="{BREVO_ACTION}"'
    )
    html = html.replace('method="get"', 'method="post"')
    html = html.replace(
        'data-donor-form=""',
        'data-brevo-form="" target="brevo-sink" accept-charset="utf-8"',
    )

    # 2. Názvy polí musí odpovídat atributům kontaktu v Brevu.
    for old, new in cfg["fields"].items():
        html = html.replace(f'name="{old}"', f'name="{new}"')

    # 3. Skrytá pole před koncem každého formuláře.
    #    Jen jednou — skript se může pustit znovu, až přibude další stránka.
    if "email_address_check" not in html:
        html = html.replace("</form>", HIDDEN.format(locale=cfg["locale"]) + "</form>")

    # 4. Popisky v jazyce stránky.
    for old, new in cfg["labels"].items():
        html = html.replace(old, new)

    if html == before:
        print(f"{path}: už napojeno, přeskočeno")
        return

    f.write_text(html, encoding="utf-8")

    forms = len(re.findall(r"<form\b", html))
    print(f"{path}: formulářů {forms}, "
          f"brevo action {html.count(BREVO_ACTION)}x, "
          f"skrytá pole {html.count('email_address_check')}x, "
          f"zbylé mailto v action: {html.count('action=\"mailto')}")


for page, config in PAGES.items():
    wire(page, config)
