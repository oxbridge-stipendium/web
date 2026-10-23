/* Shared enhancements. Content, navigation and biographies also work without JavaScript. */
(() => {
  'use strict';

  const language = document.documentElement.lang;
  const translate = (cs, sk, en) => ({ cs, sk, en }[language] || en);

  function updateLoanFootnote(grid) {
    const note = grid.closest('section').querySelector('[data-loan-note]');
    if (!note) return;

    const funding = grid.querySelectorAll(':scope > .student-card:not([hidden]) .funding');
    note.hidden = ![...funding].some(amount => amount.textContent.includes('**'));
  }

  // Rovnoměrné náhodné číslo 0..limit-1. Math.random() má v prohlížečích omezenou kvalitu
  // a modulo by navíc zvýhodnilo nižší čísla, proto bereme kryptografický zdroj
  // a zahazujeme hodnoty z neúplného posledního bloku (rejection sampling).
  function randomBelow(limit) {
    const source = globalThis.crypto;
    if (!source?.getRandomValues) return Math.floor(Math.random() * limit);
    const bound = Math.floor(4294967296 / limit) * limit;
    const buffer = new Uint32Array(1);
    let value;
    do {
      source.getRandomValues(buffer);
      value = buffer[0];
    } while (value >= bound);
    return value % limit;
  }

  async function randomizeFeaturedStudents() {
    const grid = document.querySelector('[data-featured-students]');
    if (!grid) return;

    const note = grid.closest('section').querySelector('[data-student-sample-note]');
    const profileLink = grid.querySelector('.text-link');
    const source = grid.dataset.studentSource;

    try {
      // Use the full applicant page as the single source for names, photos and funding.
      const response = await fetch(source);
      if (!response.ok) throw new Error('Applicant profiles unavailable');
      const page = new DOMParser().parseFromString(await response.text(), 'text/html');
      const students = [...page.querySelectorAll('.student-grid > .student-card[id]')];
      if (!students.length) return;

      // Partial Fisher–Yates: an equal chance for every applicant, without duplicates.
      const sampleSize = Math.min(3, students.length);
      for (let index = 0; index < sampleSize; index++) {
        const chosen = index + randomBelow(students.length - index);
        [students[index], students[chosen]] = [students[chosen], students[index]];
      }

      const sample = students.slice(0, sampleSize).map((student) => {
        const card = document.importNode(student, true);
        const link = profileLink.cloneNode(true);
        link.href = `${source}#${encodeURIComponent(card.id)}`;
        card.removeAttribute('id');
        card.querySelectorAll('.biography, .card-links').forEach((element) => element.remove());
        card.querySelector('.card-body').append(link);
        return card;
      });

      grid.replaceChildren(...sample);
      updateLoanFootnote(grid);
      note.textContent = translate(
        'Náhodný výběr uchazečů. Při každém načtení stránky vybíráme znovu.',
        'Náhodný výber uchádzačov. Pri každom načítaní stránky vyberáme znova.',
        'A random sample of applicants, selected again each time you load this page.'
      );
    } catch {
      // Keep the existing sample and its neutral label if the local page cannot load.
    }
  }

  document.querySelectorAll('.student-grid').forEach(updateLoanFootnote);
  function randomizeSeekerOrder() {
    const grid = document.querySelector('.student-grid:not([data-featured-students])');
    if (!grid) return;

    const cards = [...grid.children];
    if (cards.length < 2) return;

    // Příchod z odkazu na konkrétní profil (/scholarship-seekers/#student-3) necháváme být,
    // aby prohlížeč odroloval na kartu, na kterou člověk klikl.
    const anchored = decodeURIComponent(location.hash.slice(1));
    if (anchored && cards.some((card) => card.id === anchored)) return;

    // Fisher–Yates: každé pořadí má stejnou pravděpodobnost.
    for (let index = cards.length - 1; index > 0; index--) {
      const chosen = randomBelow(index + 1);
      [cards[index], cards[chosen]] = [cards[chosen], cards[index]];
    }

    grid.append(...cards);
  }

  // Zjistí preferovaný jazyk: nejdřív podle země (IP), při nedostupnosti podle prohlížeče.
  async function detectLanguage() {
    try {
      const response = await fetch('https://ipwho.is/', { signal: AbortSignal.timeout(2500) });
      if (response.ok) {
        const data = await response.json();
        const country = String(data.country_code || '').toUpperCase();
        if (country === 'SK') return 'sk';
        if (country === 'CZ') return 'cs';
        if (country) return 'en';
      }
    } catch {
      // Služba neodpověděla nebo ji blokuje rozšíření v prohlížeči — zkusíme jazyk prohlížeče.
    }
    for (const tag of navigator.languages || [navigator.language || '']) {
      const base = String(tag).toLowerCase().split('-')[0];
      if (base === 'cs' || base === 'sk' || base === 'en') return base;
    }
    return null;
  }

  // Jazyk vybereme jen při první návštěvě. Ruční přepnutí si pamatujeme a už ho nikdy nepřebíjíme.
  async function chooseInitialLanguage() {
    const nav = document.querySelector('.languages');
    if (!nav) return;

    const links = [...nav.querySelectorAll('a[hreflang]')];
    const current = links.find((link) => link.hasAttribute('aria-current'));
    if (!current) return;

    const remember = (value) => {
      try {
        localStorage.setItem('preferred-language', value);
      } catch {
        // Soukromý režim localStorage zakazuje; pak se jazyk vybírá při každé návštěvě.
      }
    };
    links.forEach((link) => link.addEventListener('click', () => remember(link.hreflang)));

    let stored = null;
    try {
      stored = localStorage.getItem('preferred-language');
    } catch {}
    if (stored) return;

    // Vyhledávačům a modelům necháváme stránku, na kterou přišly.
    if (/bot|crawl|spider|slurp|bingpreview|headlesschrome/i.test(navigator.userAgent)) return;

    const wanted = await detectLanguage();
    if (!wanted) return;

    remember(wanted);
    const target = links.find((link) => link.hreflang === wanted);
    if (target && wanted !== current.hreflang) location.replace(target.href);
  }

  // --- Mereni (Umami) ---------------------------------------------------
  // Merici skript se vklada az se skutecnym website-id (tools/add_umami.py).
  // Dokud tam neni, data atributy nic nedelaji a volani track() se zahodi.

  function track(name, data) {
    try {
      window.umami?.track(name, data);
    } catch {
      // Mereni nikdy nesmi shodit stranku.
    }
  }

  // Umami si pri kliknuti precte atribut data-umami-event, takze ho staci
  // doplnit za behu a nemusime sahat do vsech 58 stranek.
  function prepareAnalyticsEvents() {
    const label = (element, name) => {
      if (element && !element.dataset.umamiEvent) element.dataset.umamiEvent = name;
    };

    document.querySelectorAll('.hero-copy .actions .button').forEach((el) => label(el, 'cta-podporit-studenta'));
    document.querySelectorAll('.hero-copy .actions .text-link').forEach((el) => label(el, 'cta-jsem-student'));
    document.querySelectorAll('.callout .button, .contact-band .button, .section-action .button').forEach((el) => label(el, 'cta-sekce'));
    document.querySelectorAll('.student-card .text-link').forEach((el) => label(el, 'profil-uchazece'));
    document.querySelectorAll('.languages a[hreflang]').forEach((el) => label(el, 'prepnuti-jazyka-' + el.hreflang));
    document.querySelectorAll('.social-links a, .site-footer .icon-link').forEach((el) => label(el, 'socialni-site'));
    document.querySelectorAll('.press-logo-link').forEach((el) => label(el, 'media-logo'));
    document.querySelectorAll('.faq summary').forEach((el) => label(el, 'faq-rozbaleni'));
    document.querySelectorAll('.donor-form button[type="submit"], .donor-form .button').forEach((el) => label(el, 'formular-darce-odeslani'));

    // Vysledek odeslani formulare neni klik, posilame ho jako vlastni udalost.
    document.querySelectorAll('[data-donor-form]').forEach((form) => {
      form.addEventListener('submit', () => track('formular-darce-submit', { stranka: location.pathname }));
    });
  }

  randomizeFeaturedStudents();
  randomizeSeekerOrder();
  chooseInitialLanguage();
  prepareAnalyticsEvents();

  const menuButton = document.querySelector('.menu-toggle');
  const navigation = document.querySelector('.site-navigation');
  const menuViewport = window.matchMedia('(max-width: 1020px)');

  const homeIntro = document.querySelector('.home-intro');
  if (homeIntro) {
    const header = document.querySelector('.site-header');
    const updateHeaderHeight = () => {
      homeIntro.style.setProperty('--header-height', `${header.getBoundingClientRect().height}px`);
    };
    updateHeaderHeight();
    new ResizeObserver(updateHeaderHeight).observe(header);
  }

  function closeMenu(returnFocus = false) {
    navigation?.classList.remove('is-open');
    menuButton?.setAttribute('aria-expanded', 'false');
    if (returnFocus) menuButton.focus();
  }

  if (menuButton && navigation) {
    document.documentElement.classList.add('menu-enabled');
    menuButton.hidden = false;
    menuButton.addEventListener('click', () => {
      const open = menuButton.getAttribute('aria-expanded') !== 'true';
      menuButton.setAttribute('aria-expanded', String(open));
      navigation.classList.toggle('is-open', open);
    });
    document.addEventListener('click', (event) => {
      if (!event.target.closest('.site-header')) closeMenu();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') closeMenu(true);
    });
    navigation.addEventListener('click', (event) => {
      if (event.target.closest('a')) closeMenu();
    });
    document.querySelector('.site-header').addEventListener('focusout', (event) => {
      if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) closeMenu();
    });
    menuViewport.addEventListener('change', () => closeMenu());
  }

  document.querySelectorAll('[data-donor-form]').forEach((form) => {
    form.querySelector('button[type="submit"]').hidden = false;
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const fields = new FormData(form);
      const name = `${fields.get('first-name').trim()} ${fields.get('last-name').trim()}`;
      const email = fields.get('email').trim();
      const subject = translate('Zájem o podporu studentů', 'Záujem o podporu študentov', 'Interest in supporting students');
      const body = translate(
        `Dobrý den,\n\nmám zájem podpořit studenty prostřednictvím projektu Oxbridge Stipendium. Prosím, kontaktujte mě ohledně možností podpory.\n\nJméno: ${name}\nE-mail: ${email}\n\nDěkuji.`,
        `Dobrý deň,\n\nmám záujem podporiť študentov prostredníctvom projektu Oxbridge Stipendium. Prosím, kontaktujte ma ohľadom možností podpory.\n\nMeno: ${name}\nE-mail: ${email}\n\nĎakujem.`,
        `Hello,\n\nI would like to support students through Oxbridge Stipendium. Please contact me to discuss the options.\n\nName: ${name}\nEmail: ${email}\n\nThank you.`
      );
      const status = form.querySelector('.form-status');
      const note = document.createElement('p');
      note.textContent = translate('Zpráva je připravena. Otevřete ji ve svém e-mailu a odešlete.', 'Správa je pripravená. Otvorte ju vo svojom e-maile a odošlite.', 'Your message is ready. Open it in your email app and send it.');
      const openEmail = document.createElement('a');
      openEmail.className = 'icon-link';
      openEmail.href = `mailto:stipendium@oxbridgestipendium.org?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      const emailLabel = translate('Otevřít e-mail', 'Otvoriť e-mail', 'Open email');
      openEmail.setAttribute('aria-label', emailLabel);
      openEmail.title = emailLabel;
      const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      icon.classList.add('icon');
      icon.setAttribute('width', '22');
      icon.setAttribute('height', '22');
      icon.setAttribute('aria-hidden', 'true');
      icon.setAttribute('focusable', 'false');
      const symbol = document.createElementNS('http://www.w3.org/2000/svg', 'use');
      symbol.setAttribute('href', '/assets/icons.svg#mail');
      icon.append(symbol);
      openEmail.append(icon);
      status.replaceChildren(note, openEmail);
      openEmail.focus();
    });
  });

  const shareDialog = document.getElementById('share-dialog');
  const imageDialog = document.getElementById('image-dialog');
  document.querySelectorAll('[data-close-dialog]').forEach((button) => {
    button.addEventListener('click', () => button.closest('dialog').close());
  });
  document.querySelectorAll('dialog').forEach((dialog) => {
    dialog.addEventListener('click', (event) => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    });
  });
  document.querySelectorAll('[data-share]').forEach((button) => {
    button.hidden = false;
    button.addEventListener('click', () => {
      const pageUrl = new URL(location.href);
      pageUrl.hash = '';
      document.getElementById('share-url').value = pageUrl.href;
      document.getElementById('copy-status').textContent = '';
      const encoded = encodeURIComponent(pageUrl.href);
      const destinations = {
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encoded}`,
        x: `https://twitter.com/intent/tweet?url=${encoded}&text=${encodeURIComponent(document.title)}`
      };
      shareDialog.querySelectorAll('[data-social]').forEach((link) => {
        link.href = destinations[link.dataset.social];
      });
      shareDialog.showModal();
    });
  });
  document.querySelector('[data-copy-link]')?.addEventListener('click', async () => {
    const field = document.getElementById('share-url');
    const status = document.getElementById('copy-status');
    try {
      await navigator.clipboard.writeText(field.value);
      status.textContent = translate('Odkaz zkopírován.', 'Odkaz bol skopírovaný.', 'Link copied.');
    } catch {
      field.focus();
      field.select();
      status.textContent = translate('Zkopírujte označený odkaz pomocí Ctrl+C nebo ⌘C.', 'Skopírujte označený odkaz pomocou Ctrl+C alebo ⌘C.', 'Copy the selected link using Ctrl+C or ⌘C.');
    }
  });
  document.querySelectorAll('[data-expand-image]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      const original = button.querySelector('img');
      const expanded = imageDialog.querySelector('img');
      expanded.src = original.currentSrc;
      expanded.alt = original.alt;
      imageDialog.showModal();
    });
  });

  const searchForm = document.querySelector('[data-search-form]');
  if (searchForm) {
    const field = searchForm.querySelector('input');
    const status = document.querySelector('.search-status');
    const cards = [...document.querySelectorAll('[data-article-card]')];
    let articles = [];
    const normalize = (text) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    function search() {
      const query = normalize(field.value.trim());
      let count = 0;
      cards.forEach((card) => {
        const path = new URL(card.querySelector('a').href).pathname;
        const article = articles.find((entry) => entry.url === path);
        const searchableText = `${card.textContent} ${article ? `${article.title} ${article.text}` : ''}`;
        const matches = !query || normalize(searchableText).includes(query);
        card.hidden = !matches;
        if (matches) count++;
      });
      status.textContent = query ? translate(`Počet nalezených článků: ${count}`, `Počet nájdených článkov: ${count}`, `Articles found: ${count}`) : '';
    }
    searchForm.hidden = false;
    searchForm.addEventListener('submit', (event) => { event.preventDefault(); search(); });
    field.addEventListener('input', search);
    fetch('/assets/search.json').then((response) => {
      if (!response.ok) throw new Error('Search index unavailable');
      return response.json();
    }).then((data) => { articles = data; search(); }).catch(() => {
      // Titles and visible excerpts remain searchable if the full index is unavailable.
      search();
    });
  }
})();
