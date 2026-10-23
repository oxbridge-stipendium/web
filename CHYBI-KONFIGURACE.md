# Co nám chybí, abychom to mohli dodělat

Stav k 23. 10. 2026. Doplň hodnotu, napiš mi, a já to zapojím. Nic z toho si nevymýšlím ani neodhaduju.

## 1. Umami (měření návštěvnosti), cloudová verze

Potřebuju:

- **data-website-id** (UUID) z Umami Cloud -> Settings -> Websites. Veřejná hodnota, může jít do chatu.
- **region zpracování** (EU nebo US). Potřeba do zásad ochrany osobních údajů.

Hotové a čeká to jen na UUID:

- `tools/add_umami.py` vloží merací skript na všech 58 stránek, je idempotentní a má `--remove`
- v `js/site.js` jsou připravené události: `cta-podporit-studenta`, `cta-jsem-student`, `cta-sekce`,
  `profil-uchazece`, `prepnuti-jazyka-<cs|sk|en>`, `socialni-site`, `media-logo`, `faq-rozbaleni`,
  `formular-darce-odeslani` a vlastní událost `formular-darce-submit`
- helper `track(nazev, data)` pro další vlastní události

Příkaz, který to zapne:

    python3 tools/add_umami.py --src https://cloud.umami.is/script.js \\
      --website-id <UUID> --domains www.oxbridgestipendium.org

`--domains` doporučuju nechat: Umami pak ignoruje provoz z náhledu na github.io a statistiky
nejsou zašpiněné naším testováním.

## 2. EmailJS (odesílání e-mailů z formulářů)

Potřebuju:

- **Public key**, **Service ID**, **Template ID** (všechno veřejné hodnoty, jdou do HTML)
- **rozhodnutí:** nahrazuje EmailJS úplně Brevo, nebo běží vedle sebe?

**Private key mi neposílejte.** Do statického webu nepatří a k zapojení ho nepotřebuju.

Proč to rozhodnutí potřebuju: formuláře v téhle nové verzi nemají zapojené nic, chybí jim
`action` i jakýkoli handler. Stará verze v `main` posílá do Brevo (`tools/wire_brevo_form.py`).
Formulář je na devíti stránkách, ve třech jazycích.

## 3. Zásady ochrany osobních údajů

Text je napsaný v `blank/index.html` a v jazykových verzích `sk/blank/`, `en/blank/`.
Wixovská vata je pryč. Místa označená `[DOPLNIT]` čekají na tyhle údaje:

- přesný název právnické osoby, která je správcem údajů (sekce „Kdo údaje spravuje")
- sídlo a IČO (tamtéž)
- jak dlouho držíte e-maily z formulářů a kdy je mažete (sekce „Jak dlouho údaje držíme")
- region Umami Cloud, EU nebo US (sekce „Měření návštěvnosti")
- poskytovatel hostingu produkce, Cloudflare Pages? (sekce „Komu údaje předáváme")

**Text neprošel právní kontrolou.** Je napsaný podle toho, co web skutečně dělá, ale před
spuštěním na produkci by se na něj měl podívat někdo, kdo tomu rozumí.

Cookie lišta nebude potřeba: Umami měří bez cookies, ipwho.is ani EmailJS cookies nesází.
Kdyby se přidalo cokoli, co cookies používá, tohle rozhodnutí padá.

## 4. Co leží na rozhodnutí, ne na údaji

- **Výměna webu.** Tahle nová verze žije jen jako druhý náhled na
  https://oxbridge-stipendium.github.io/web/next/ a ve větvi `next`. Větev `main` je pořád
  ta zářijová wixovská. Výměnu nikdo nezadal, čeká to na Theodora.
- **Automatické přepínání jazyka podle IP.** Funguje, ale Google automatické přesměrování
  podle IP nedoporučuje. Crawlery filtruju podle user-agenta. Bezpečnější alternativa je
  nenápadný banner „Switch to English?" místo přesměrování.
- **Minifikace CSS/JS.** Neudělaná schválně: ušetří pár kB a přidá build krok, který deploy
  Lambda neumí spustit.
