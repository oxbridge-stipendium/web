#!/usr/bin/env python3
"""Nahradi wixovskou vatu na strance zasad ochrany osobnich udaju skutecnym textem.

Misto, kde chybi fakta, je oznacene [DOPLNIT: ...]. Text neprosel pravni kontrolou.
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MAIL = "stipendium@oxbridgestipendium.org"

CS = f"""<h2>Tato stránka je rozpracovaná</h2>
<p><strong>Části označené [DOPLNIT] čekají na doplnění údajů a na právní kontrolu.</strong> Do té doby text neberte jako závazný dokument. Seznam chybějících údajů je v repozitáři webu v souboru <code>CHYBI-KONFIGURACE.md</code>.</p>
<h2>Kdo údaje spravuje</h2>
<p>Správcem osobních údajů je [DOPLNIT: přesný název právnické osoby], se sídlem [DOPLNIT: adresa], IČO [DOPLNIT]. Ve všem, co se týká vašich údajů, nám můžete napsat na <a href="mailto:{MAIL}">{MAIL}</a>.</p>
<h2>Jaké údaje sbíráme</h2>
<p>Registrační formulář na úvodní stránce, na stránce pro dárce a u uchazečů o stipendium sbírá <strong>jméno, příjmení a e-mailovou adresu</strong>. Vyplnění je dobrovolné a slouží k tomu, abychom se vám mohli ozvat ohledně projektu a možností podpory.</p>
<p>Při každém otevření stránky se zpracovává vaše <strong>IP adresa a technické údaje o prohlížeči</strong>. Bez toho by se stránka nedala doručit; děje se to u každého webu.</p>
<h2>Měření návštěvnosti</h2>
<p>Používáme <strong>Umami Cloud</strong>. Měří bez cookies a bez profilování jednotlivých lidí, proto na webu nenajdete cookie lištu. Zajímá nás, které stránky lidé čtou a odkud přišli, ne kdo konkrétně jste. Region zpracování: [DOPLNIT: EU nebo US].</p>
<h2>Odesílání e-mailů z formulářů</h2>
<p>Odeslání formuláře zajišťuje služba <strong>EmailJS</strong> [DOPLNIT: potvrdit, zda EmailJS plně nahrazuje dosavadní Brevo, nebo zda registrace dál chodí do Brevo]. Předávají se jí údaje, které ve formuláři vyplníte.</p>
<h2>Výběr jazyka při první návštěvě</h2>
<p>Při první návštěvě zjišťujeme zemi podle IP adresy přes službu <strong>ipwho.is</strong>, abychom vás přepnuli na češtinu, slovenštinu nebo angličtinu. Vaše IP adresa se tím dostane k provozovateli této služby. Zvolený jazyk se pak uloží ve vašem prohlížeči a dotaz se už neopakuje.</p>
<h2>Komu údaje předáváme</h2>
<p>Pracujeme s těmito zpracovateli: EmailJS (odeslání formulářů), Umami Cloud (měření návštěvnosti), ipwho.is (určení země), [DOPLNIT: poskytovatel hostingu]. Údaje neprodáváme a nepoužíváme je k reklamnímu cílení.</p>
<h2>Jak dlouho údaje držíme</h2>
<p>[DOPLNIT: doba uchování e-mailů z formulářů a kritérium pro smazání.]</p>
<h2>Vaše práva</h2>
<p>Máte právo na přístup ke svým údajům, jejich opravu nebo výmaz, na omezení zpracování, na přenositelnost a právo vznést námitku. Souhlas s oslovováním můžete kdykoli odvolat — napište na <a href="mailto:{MAIL}">{MAIL}</a> a vyřešíme to.</p>
<p>Pokud nebudete s našim postupem spokojeni, můžete se obrátit na Úřad pro ochranu osobních údajů v České republice nebo na Úrad na ochranu osobných údajov ve Slovenské republice.</p>
<h2>Nezletilí</h2>
<p>Projekt je určen studentům s nabídkou studia na Oxfordu nebo Cambridgi, tedy zpravidla lidem starším 18 let. Údaje dětí cíleně nesbíráme.</p>
<p>Naposledy upraveno 23. 10. 2026.</p>"""

SK = f"""<h2>Táto stránka je rozpracovaná</h2>
<p><strong>Časti označené [DOPLNIT] čakajú na doplnenie údajov a na právnu kontrolu.</strong> Dovtedy text neberte ako záväzný dokument. Zoznam chýbajúcich údajov je v repozitári webu v súbore <code>CHYBI-KONFIGURACE.md</code>.</p>
<h2>Kto údaje spravuje</h2>
<p>Správcom osobných údajov je [DOPLNIT: presný názov právnickej osoby], so sídlom [DOPLNIT: adresa], IČO [DOPLNIT]. Vo všetkom, čo sa týka vašich údajov, nám môžete napísať na <a href="mailto:{MAIL}">{MAIL}</a>.</p>
<h2>Aké údaje zbierame</h2>
<p>Registračný formulár na úvodnej stránke, na stránke pre darcov a u uchádzačov o štipendium zbiera <strong>meno, priezvisko a e-mailovú adresu</strong>. Vyplnenie je dobrovoľné a slúži na to, aby sme sa vám mohli ozvať ohľadom projektu a možností podpory.</p>
<p>Pri každom otvorení stránky sa spracúva vaša <strong>IP adresa a technické údaje o prehliadači</strong>. Bez toho by sa stránka nedala doručiť; deje sa to pri každom webe.</p>
<h2>Meranie návštevnosti</h2>
<p>Používame <strong>Umami Cloud</strong>. Meria bez cookies a bez profilovania jednotlivých ľudí, preto na webe nenájdete cookie lištu. Zaujíma nás, ktoré stránky ľudia čítajú a odkiaľ prišli, nie kto konkrétne ste. Región spracovania: [DOPLNIT: EU alebo US].</p>
<h2>Odosielanie e-mailov z formulárov</h2>
<p>Odoslanie formulára zabezpečuje služba <strong>EmailJS</strong> [DOPLNIT: potvrdiť, či EmailJS plne nahrádza doterajšie Brevo, alebo či registrácie ďalej chodia do Brevo]. Predávajú sa jej údaje, ktoré vo formulári vyplníte.</p>
<h2>Výber jazyka pri prvej návšteve</h2>
<p>Pri prvej návšteve zisťujeme zem podľa IP adresy cez službu <strong>ipwho.is</strong>, aby sme vás prepli na češtinu, slovenčinu alebo angličtinu. Vaša IP adresa sa tým dostane k prevádzkovateľovi tejto služby. Zvolený jazyk sa potom uloží vo vašom prehliadači a dotaz sa už neopakuje.</p>
<h2>Komu údaje predávame</h2>
<p>Pracujeme s týmito spracovateľmi: EmailJS (odoslanie formulárov), Umami Cloud (meranie návštevnosti), ipwho.is (určenie zeme), [DOPLNIT: poskytovateľ hostingu]. Údaje nepredávame a nepoužívame ich na reklamné cielenie.</p>
<h2>Ako dlho údaje držíme</h2>
<p>[DOPLNIT: doba uchovania e-mailov z formulárov a kritérium pre zmazanie.]</p>
<h2>Vaše práva</h2>
<p>Máte právo na prístup k svojim údajom, ich opravu alebo vymazanie, na obmedzenie spracovania, na prenositeľnosť a právo vzniesť námietku. Súhlas s oslovovaním môžete kedykoľvek odvolať — napíšte na <a href="mailto:{MAIL}">{MAIL}</a> a vyriešime to.</p>
<p>Ak nebudete s našim postupom spokojní, môžete sa obrátiť na Úrad na ochranu osobných údajov v Slovenskej republike alebo na Úřad pro ochranu osobních údajů v Českej republike.</p>
<h2>Neplnoletí</h2>
<p>Projekt je určený študentom s nabídkou štúdia na Oxforde alebo Cambridgei, teda zvyčajne ľuďom starším ako 18 rokov. Údaje detí cielene nezbierame.</p>
<p>Naposledy upravené 23. 10. 2026.</p>"""

EN = f"""<h2>This page is a work in progress</h2>
<p><strong>Sections marked [DOPLNIT] are waiting for missing details and for a legal review.</strong> Until then, do not treat this text as a binding document. The list of missing details lives in the website repository in <code>CHYBI-KONFIGURACE.md</code>.</p>
<h2>Who controls your data</h2>
<p>The data controller is [DOPLNIT: exact legal entity name], registered at [DOPLNIT: address], company number [DOPLNIT]. For anything concerning your data, write to <a href="mailto:{MAIL}">{MAIL}</a>.</p>
<h2>What we collect</h2>
<p>The sign-up form on the home page, the donors page and the scholarship seekers page collects your <strong>first name, last name and e-mail address</strong>. Filling it in is voluntary and lets us get back to you about the project and ways to support a student.</p>
<p>Every page view processes your <strong>IP address and basic browser information</strong>. Without it the page could not be delivered at all; this happens on every website.</p>
<h2>Analytics</h2>
<p>We use <strong>Umami Cloud</strong>. It measures without cookies and without profiling individuals, which is why you will not see a cookie banner here. We care about which pages people read and where they came from, not who you are. Processing region: [DOPLNIT: EU or US].</p>
<h2>Sending form e-mails</h2>
<p>Form submissions are delivered by <strong>EmailJS</strong> [DOPLNIT: confirm whether EmailJS fully replaces Brevo, or whether sign-ups still go to Brevo]. The details you type into the form are passed to that service.</p>
<h2>Language choice on your first visit</h2>
<p>On your first visit we look up your country from your IP address through <strong>ipwho.is</strong> so we can switch you to Czech, Slovak or English. Your IP address reaches that provider as part of the lookup. Your language is then stored in your browser and the lookup is not repeated.</p>
<h2>Who we share data with</h2>
<p>Our processors are: EmailJS (form delivery), Umami Cloud (analytics), ipwho.is (country lookup), [DOPLNIT: hosting provider]. We do not sell your data and do not use it for advertising.</p>
<h2>How long we keep it</h2>
<p>[DOPLNIT: retention period for form e-mails and the deletion criterion.]</p>
<h2>Your rights</h2>
<p>You have the right to access your data, correct or erase it, restrict processing, port it elsewhere, and object to processing. You can withdraw your consent to being contacted at any time — write to <a href="mailto:{MAIL}">{MAIL}</a> and we will sort it out.</p>
<p>If you are unhappy with how we handle it, you can contact the Czech Office for Personal Data Protection or the Slovak Office for Personal Data Protection.</p>
<h2>Minors</h2>
<p>The project is for students holding an offer from Oxford or Cambridge, so normally people over 18. We do not deliberately collect children's data.</p>
<p>Last updated 23 October 2026.</p>"""

TEXTS = {"blank/index.html": CS, "sk/blank/index.html": SK, "en/blank/index.html": EN}

for relative, body in TEXTS.items():
    path = ROOT / relative
    text = path.read_text(encoding="utf-8")
    new, count = re.subn(
        r'(<article class="prose legal-copy">)(.*?)(</article>)',
        lambda m: m.group(1) + "\n" + body + "\n" + m.group(3),
        text,
        flags=re.S,
    )
    if count != 1:
        print("POZOR: nenalezeno v", relative, "(nahrazeni:", count, ")")
        continue
    path.write_text(new, encoding="utf-8")
    print("prepsano:", relative, "| znaku textu:", len(body))
