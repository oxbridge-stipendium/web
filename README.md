# Web Oxbridge Stipendium

Zdrojové soubory webu **oxbridgestipendium.org**. Je to obyčejný statický web — HTML, jeden soubor se styly, jeden se skripty a složka s obrázky. Žádný Wix, žádná databáze, žádný systém pro správu obsahu. Kdo umí upravit text v HTML, může upravit tenhle web.

Obsah byl převzat z veřejného webu 9. 9. 2026 při přechodu pryč z Wixu.

## Jak to celé funguje

Web má dvě prostředí:

| Prostředí | Adresa | Co ukazuje | Kdo to spouští |
|---|---|---|---|
| Náhled | `oxbridge-stipendium.github.io/web/` | větev `gh-pages`, data jsou vymyšlená | aktualizuje se sám po pushnutí |
| Produkce | `oxbridgestipendium.org` (Cloudflare) | větev `main` se skutečnými daty | ruční spuštění deploy funkce |

Důležité: **push do `main` sám o sobě nic nezveřejní na ostrém webu.** Produkční nasazení je vždy samostatný, vědomý krok.

## Mapa složek

```text
index.html     česká úvodní stránka
about/         a další složky = jednotlivé stránky, každá má svůj index.html
en/            celá anglická verze
sk/            celá slovenská verze
css/site.css   všechny styly webu v jednom souboru
js/site.js     všechny interakce (menu, rozbalování životopisů, karusel)
assets/        obrázky, fonty, PDF ke stažení
data/          data ze studentské tabulky (needitovat, viz níže)
tools/         pomocný skript pro vytvoření náhledové kopie
404.html       stránka pro neexistující adresu
_headers       nastavení cache a bezpečnostních hlaviček
robots.txt     pokyny pro vyhledávače
sitemap.xml    seznam stránek pro vyhledávače
```

Každá stránka leží přesně na té adrese, na které se zobrazuje. Stránka `/donors/` je soubor `donors/index.html`. Žádné přesměrování ani mapování adres se neřeší.

## Kde co upravit

**Text na stránce** — najdi složku podle adresy a otevři v ní `index.html`. Text je v běžných HTML značkách, hledej ho vyhledáváním v souboru.

**Stejná změna ve všech jazycích** — každá jazyková verze je samostatný soubor. Změna v `donors/index.html` se do `en/donors/index.html` a `sk/donors/index.html` nepropíše sama.

**Obrázek** — nahraj nový do `assets/images/` a přepiš cestu v HTML. Názvy souborů jsou z Wixu, takže vypadají jako náhodné znaky; je to v pořádku, jen je nepřejmenovávej bez úpravy odkazů.

**Barvy, odsazení, velikost písma** — `css/site.css`. Třídy mají popisné názvy.

**Profily studentů** — jsou na stránkách `/students/` a `/scholarship-seekers/` přímo v HTML.

**PDF ke stažení** — `assets/documents/`.

## Složka `data/`

Obsahuje `students.csv` (řádky tabulky) a `students.txt` (popis sloupců).

**Do téhle složky nic neukládej a nic v ní neměň.** Přepisuje ji automaticky funkce na serveru, která čte skutečnou Google tabulku. Cokoli tam ručně dopíšeš, se při dalším běhu ztratí.

V náhledu jsou v `students.csv` vymyšlená data — mají správný tvar, ale nesmyslný obsah. Skutečné údaje studentů se doplňují až při nasazení na produkci a do tohoto repozitáře se nikdy nedostanou. Je to tak schválně, kvůli ochraně osobních údajů.

## Jak si web pustit u sebe

V kořeni repozitáře spusť:

```sh
python3 -m http.server 4173
```

Otevři `http://127.0.0.1:4173/`. Nic se nemusí instalovat. Po uložení souboru stačí obnovit stránku.

## Seznam všech stránek

Pět stránek v každém jazyce, celkem 15 veřejných adres.

| Česky | Anglicky | Slovensky | Obsah |
|---|---|---|---|
| `/` | `/en/` | `/sk/` | úvodní stránka |
| `/about/` | `/en/about/` | `/sk/about/` | o nás |
| `/donors/` | `/en/donors/` | `/sk/donors/` | pro dárce |
| `/students/` | `/en/students/` | `/sk/students/` | studenti |
| `/scholarship-seekers/` | `/en/scholarship-seekers/` | `/sk/scholarship-seekers/` | žadatelé o stipendium |

Soubor každé stránky leží na její adrese: `/donors/` je `donors/index.html`, `/en/donors/` je `en/donors/index.html`.

### Co bylo smazáno

21. 9. 2026 se na pokyn týmu odstranilo 42 stránek: blog a články, přehled a detaily proběhlých akcí, rezervace, poptávka služeb, poděkování po daru, profily autora a čtyři právní stránky (ochrana osobních údajů, přístupnost, obchodní podmínky, vrácení peněz).

Všechny zůstávají v historii Gitu a dají se vrátit. Před nasazením na ostrý web stojí za zvážení, jestli nemá web mít zásady ochrany osobních údajů — vyžaduje je GDPR u webu, který sbírá kontakty, a formulář pro dárce kontakty sbírá.

## Co na webu nefunguje jako dřív

**Registrace dárce** — formulář na Wixu odesílal data na jejich server, což statický web neumí. Formulář teď zkontroluje vyplnění a nabídne odkaz, který připraví e-mail na `stipendium@oxbridgestipendium.org`. Návštěvník ho musí odeslat sám. Formulář nikde nic neukládá a netvrdí, že zprávu odeslal. Pokud bude potřeba automatické odesílání, napojí se v `js/site.js`.

**Přihlášky studentů** — odkazy vedou na samostatnou doménu a Google formulář, stejně jako dřív. Tato část se nepřeváděla.

## Čeho se nedotýkat

- Složka `data/` — přepisuje ji automat.
- Názvy složek stránek — určují veřejné adresy, které jsou zaindexované a rozeslané.
- `_headers`, `robots.txt`, `sitemap.xml` — nastavení pro server a vyhledávače.
- Struktura `main` — musí zůstat rovnou publikovatelná, protože deploy funkce neumí web sestavovat.

## Poznámka k velikosti

Web pochází z Wixu a nese si po něm zátěž: úvodní stránka má 223 kB HTML a styly 2,8 MB. Pro statický web je to hodně. Část nepoužívaných stylů už byla odstraněna (z 3,2 MB). Další zmenšení by znamenalo přepisovat strukturu stránek, což by mohlo změnit vzhled — proto se do toho zatím nešlo.
