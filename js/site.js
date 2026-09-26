/* Standalone site interactions: navigation, slideshow, articles, events, and donor forms. */
(() => {
  'use strict';

  // Enable the scripted layout immediately while waiting for DOM and stylesheet readiness.
  document.documentElement.dataset.scriptState = 'enabled';

  const MOBILE_MEDIA_QUERY = '(max-width: 767px)';
  const MOBILE_LAYOUT_WIDTH = 320;
  const SLIDESHOW_TRANSITION_MS = 800;
  const SLIDESHOW_INTERVAL_MS = 4000;
  const SLIDESHOW_SCROLL_SETTLE_MS = 150;

  function initializeResponsiveLayout() {
    const isMobileLayout = window.matchMedia(MOBILE_MEDIA_QUERY).matches;
    const mobileTemplate = document.getElementById('mobile-layout');
    if (isMobileLayout && mobileTemplate) {
      document
        .getElementById('static-layout')
        .replaceChildren(mobileTemplate.content.cloneNode(true));
      document.body.classList.add('device-mobile-optimized');
      // Scale the original 320px mobile layout to the device width.
      document.body.style.zoom = String(window.innerWidth / MOBILE_LAYOUT_WIDTH);
    }
    mobileTemplate?.remove();
    const startedWithMobileLayout = isMobileLayout;
    window.addEventListener('resize', () => {
      const isMobileViewport = window.matchMedia(MOBILE_MEDIA_QUERY).matches;
      if (isMobileViewport !== startedWithMobileLayout) window.location.reload();
      else if (isMobileViewport)
        document.body.style.zoom = String(window.innerWidth / MOBILE_LAYOUT_WIDTH);
    });
  }

  function initializeBiographies() {
    document.querySelectorAll('[data-expand-biography]').forEach((button) => {
      button.addEventListener('click', () => {
        const isExpanded = button.getAttribute('aria-expanded') !== 'true';
        button.setAttribute('aria-expanded', String(isExpanded));
        button.textContent = isExpanded ? 'Read less' : 'Read more';
        button.closest('.collapsible-text').classList.toggle('static-expanded', isExpanded);
      });
    });
  }

  function initializeMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    const menuToggle = document.getElementById('mobile-menu-toggle');
    if (menu && menuToggle) {
      menu.hidden = true;
      menu.removeAttribute('data-menu-uninitialized');
      menuToggle.setAttribute('aria-controls', menu.id);
      menuToggle.setAttribute('aria-expanded', 'false');
      const closeButton = document.createElement('button');
      closeButton.type = 'button';
      closeButton.className = 'static-menu-close';
      closeButton.textContent = '×';
      closeButton.setAttribute('aria-label', 'Close menu / Zavřít menu');
      menu.append(closeButton);
      const setMenuOpen = (isOpen) => {
        menu.hidden = !isOpen;
        menu.classList.toggle('static-menu-open', isOpen);
        document.body.classList.toggle('static-menu-is-open', isOpen);
        menuToggle.setAttribute('aria-expanded', String(isOpen));
        (isOpen ? closeButton : menuToggle).focus();
      };
      menuToggle.addEventListener('click', () => setMenuOpen(menu.hidden));
      menuToggle.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          setMenuOpen(menu.hidden);
        }
      });
      closeButton.addEventListener('click', () => setMenuOpen(false));
      document
        .getElementById('mobile-menu-overlay')
        ?.addEventListener('click', () => setMenuOpen(false));
      menu.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') setMenuOpen(false);
        if (event.key === 'Tab') {
          const focusableElements = [...menu.querySelectorAll('a[href],button')];
          const firstFocusable = focusableElements[0],
            lastFocusable = focusableElements.at(-1);
          if (event.shiftKey && document.activeElement === firstFocusable) {
            event.preventDefault();
            lastFocusable.focus();
          } else if (!event.shiftKey && document.activeElement === lastFocusable) {
            event.preventDefault();
            firstFocusable.focus();
          }
        }
      });
    }
  }

  function initializeBackToTop() {
    document
      .getElementById('back-to-top')
      ?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  function initializePressSlideshows() {
    document.querySelectorAll('.gallery-horizontal-scroll').forEach(initializePressSlideshow);
  }

  function initializePressSlideshow(viewport) {
    const slideItems = [...viewport.querySelectorAll('.gallery-item-container')];
    const slideTrack = viewport.querySelector('.gallery-horizontal-scroll-inner');
    if (slideItems.length < 2 || !slideTrack) return;
    const slideWidth = viewport.clientWidth;
    const slideGroups = slideItems.map((item) => item.closest('.gallery-slide-group'));
    viewport.dataset.autoplay = 'true';
    viewport.dataset.sliding = 'false';
    // Own the 800ms animation: native smooth scrolling can become an instant
    // jump in the preview, and the saved snap targets interrupt each frame.
    viewport.style.scrollSnapType = 'none';
    viewport.style.scrollBehavior = 'auto';
    slideTrack.style.width = `${(slideItems.length + 2) * slideWidth}px`;
    slideTrack.style.height = `${viewport.clientHeight}px`;
    const positionSlide = (slideGroup, position) => {
      slideGroup.style.setProperty('--group-left', `${position * slideWidth}px`);
      slideGroup.querySelector('.gallery-item-container').style.left = `${position * slideWidth}px`;
      slideGroup.querySelectorAll('img').forEach((image) => {
        image.loading = 'eager';
      });
    };
    const createBoundarySlide = (sourceSlide, position) => {
      const boundarySlide = sourceSlide.cloneNode(true);
      boundarySlide.setAttribute('aria-hidden', 'true');
      boundarySlide.setAttribute('inert', '');
      boundarySlide.dataset.slideClone = 'true';
      boundarySlide.querySelectorAll('[id]').forEach((element) => element.removeAttribute('id'));
      boundarySlide.querySelectorAll('a, [tabindex]').forEach((element) => {
        element.tabIndex = -1;
      });
      boundarySlide.querySelector('.gallery-item-container').setAttribute('aria-hidden', 'true');
      positionSlide(boundarySlide, position);
      return boundarySlide;
    };
    // Identical edge copies make both directions loop without reversing or
    // flashing back across the other articles.
    slideTrack.prepend(createBoundarySlide(slideGroups[slideGroups.length - 1], 0));
    slideTrack.append(createBoundarySlide(slideGroups[0], slideItems.length + 1));
    slideGroups.forEach((slideGroup, index) => positionSlide(slideGroup, index + 1));
    let currentSlideIndex = 0,
      isAnimating = false,
      scrollSettleTimer;
    const setActiveSlide = (nextSlideIndex, moveFocus = false) => {
      currentSlideIndex = nextSlideIndex;
      slideItems.forEach((item, index) => {
        const isHidden = index !== nextSlideIndex;
        slideGroups[index].setAttribute('aria-hidden', String(isHidden));
        item.setAttribute('aria-hidden', String(isHidden));
        item.closest('a').tabIndex = isHidden ? -1 : 0;
        item.querySelector('[role=link]')?.setAttribute('tabindex', '-1');
      });
      if (moveFocus) slideItems[nextSlideIndex].closest('a').focus({ preventScroll: true });
    };
    const finishSlide = (position, moveFocus) => {
      const nextSlideIndex = (position - 1 + slideItems.length) % slideItems.length;
      if (position === 0 || position === slideItems.length + 1)
        viewport.scrollLeft = (nextSlideIndex + 1) * slideWidth;
      const hasFocusedArticle = slideItems.some((item) =>
        item.closest('a').contains(document.activeElement),
      );
      setActiveSlide(nextSlideIndex, moveFocus || hasFocusedArticle);
      isAnimating = false;
      viewport.dataset.sliding = 'false';
    };
    const animateToPosition = (position, moveFocus = false) => {
      if (isAnimating) return;
      clearTimeout(scrollSettleTimer);
      isAnimating = true;
      viewport.dataset.sliding = 'true';
      const startOffset = viewport.scrollLeft,
        targetOffset = position * slideWidth;
      const animationStartTime = performance.now();
      const animateFrame = (frameTime) => {
        const progress = Math.min(1, (frameTime - animationStartTime) / SLIDESHOW_TRANSITION_MS);
        const easedProgress = (1 - Math.cos(Math.PI * progress)) / 2;
        viewport.scrollLeft = startOffset + (targetOffset - startOffset) * easedProgress;
        if (progress < 1) requestAnimationFrame(animateFrame);
        else finishSlide(position, moveFocus);
      };
      requestAnimationFrame(animateFrame);
    };
    viewport.scrollLeft = slideWidth;
    setActiveSlide(0);
    viewport.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault();
        animateToPosition(currentSlideIndex + 1 + (event.key === 'ArrowRight' ? 1 : -1), true);
      }
    });
    // Keep the selected article in sync after a touch or trackpad swipe.
    viewport.addEventListener('scroll', () => {
      clearTimeout(scrollSettleTimer);
      if (isAnimating) return;
      scrollSettleTimer = setTimeout(() => {
        const position = Math.max(
          0,
          Math.min(slideItems.length + 1, Math.round(viewport.scrollLeft / slideWidth)),
        );
        if (Math.abs(viewport.scrollLeft - position * slideWidth) > 1) animateToPosition(position);
        else finishSlide(position, false);
      }, SLIDESHOW_SCROLL_SETTLE_MS);
    });
    window.setInterval(() => {
      if (
        !document.hidden &&
        !viewport.matches(':hover') &&
        !viewport.contains(document.activeElement)
      ) {
        animateToPosition(currentSlideIndex + 2);
      }
    }, SLIDESHOW_INTERVAL_MS);
  }

  function createDialog(title) {
    const dialog = document.createElement('dialog');
    dialog.className = 'static-dialog';
    const heading = document.createElement('h2');
    heading.textContent = title;
    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.textContent = '×';
    closeButton.className = 'static-dialog-close';
    closeButton.setAttribute('aria-label', 'Close');
    closeButton.addEventListener('click', () => dialog.close());
    dialog.append(closeButton, heading);
    dialog.addEventListener('close', () => dialog.remove());
    document.body.append(dialog);
    return dialog;
  }

  function getPostUrl(button) {
    if (window.location.pathname.includes('/post/')) return window.location.href.split('?')[0];
    let container = button.parentElement;
    while (container && container.tagName !== 'MAIN') {
      const postLink = container.querySelector('a[href*="/post/"]');
      if (postLink) return new URL(postLink.getAttribute('href'), window.location.origin).href;
      container = container.parentElement;
    }
    return window.location.href.split('?')[0];
  }

  function openSocialShare(network, url) {
    const encodedUrl = encodeURIComponent(url);
    const shareUrls = {
      facebook: 'https://www.facebook.com/sharer/sharer.php?u=' + encodedUrl,
      twitter: 'https://twitter.com/intent/tweet?url=' + encodedUrl,
      'linked-in': 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodedUrl,
    };
    if (shareUrls[network]) window.open(shareUrls[network], '_blank', 'noopener,noreferrer');
  }

  function openShareDialog(url) {
    const dialog = createDialog('Share post');
    const linkInput = document.createElement('input');
    linkInput.readOnly = true;
    linkInput.value = url;
    linkInput.setAttribute('aria-label', 'Post link');
    const copyButton = document.createElement('button');
    copyButton.type = 'button';
    copyButton.textContent = 'Copy link';
    copyButton.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(url);
        copyButton.textContent = 'Copied';
      } catch {
        linkInput.focus();
        linkInput.select();
        copyButton.textContent = 'Select and copy the link';
      }
    });
    dialog.append(linkInput, copyButton);
    ['facebook', 'twitter', 'linked-in'].forEach((network) => {
      const shareButton = document.createElement('button');
      shareButton.type = 'button';
      shareButton.textContent = { facebook: 'Facebook', twitter: 'X', 'linked-in': 'LinkedIn' }[
        network
      ];
      shareButton.addEventListener('click', () => openSocialShare(network, url));
      dialog.append(shareButton);
    });
    dialog.showModal();
  }

  function initializePostSharing() {
    document.querySelectorAll('[data-share-platform]').forEach((button) => {
      button.addEventListener('click', () => {
        const platform = button.dataset.sharePlatform;
        if (platform === 'print') window.print();
        else if (platform === 'link') openShareDialog(window.location.href.split('?')[0]);
        else openSocialShare(platform, window.location.href.split('?')[0]);
      });
    });
    document
      .querySelectorAll('.post-share-button')
      .forEach((button) =>
        button.addEventListener('click', () => openShareDialog(getPostUrl(button))),
      );
  }

  function initializeImageExpansion() {
    document.querySelectorAll('.image-expand-action').forEach((button) => {
      button.addEventListener('click', () => {
        let imageContainer = button.parentElement;
        while (imageContainer && !imageContainer.querySelector('img'))
          imageContainer = imageContainer.parentElement;
        const sourceImage = imageContainer?.querySelector('img');
        if (!sourceImage) return;
        const dialog = createDialog(sourceImage.alt || '');
        dialog.classList.add('static-image-dialog');
        const enlargedImage = document.createElement('img');
        enlargedImage.src = sourceImage.currentSrc || sourceImage.src;
        enlargedImage.alt = sourceImage.alt;
        dialog.append(enlargedImage);
        dialog.showModal();
      });
    });
  }

  function initializeEventDescriptions() {
    document.querySelectorAll('.event-description-toggle').forEach((button) => {
      const descriptionContent = document.querySelector('.event-description-content');
      if (!descriptionContent) return;
      button.setAttribute('aria-expanded', 'false');
      button.addEventListener('click', () => {
        const isExpanded = button.getAttribute('aria-expanded') !== 'true';
        button.setAttribute('aria-expanded', String(isExpanded));
        button.textContent = isExpanded ? 'Show Less' : 'Show More';
        descriptionContent.classList.toggle('static-event-expanded', isExpanded);
      });
    });
  }

  function initializeEventAccordions() {
    document
      .querySelectorAll('.event-details-accordion > [role=button][aria-expanded]')
      .forEach((button) => {
        const details = button.parentElement.querySelector('.event-details-accordion-content');
        if (!details) return;
        details.hidden = true;
        button.tabIndex = 0;
        const toggleDetails = () => {
          details.hidden = !details.hidden;
          button.setAttribute('aria-expanded', String(!details.hidden));
        };
        button.addEventListener('click', toggleDetails);
        button.addEventListener('keydown', (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            toggleDetails();
          }
        });
      });
  }

  async function openSearchDialog(initialQuery) {
    const dialog = createDialog('Search');
    const searchInput = document.createElement('input');
    searchInput.type = 'search';
    searchInput.placeholder = 'Search';
    searchInput.value = initialQuery || '';
    searchInput.setAttribute('aria-label', 'Search posts');
    const resultsContainer = document.createElement('div');
    resultsContainer.className = 'static-search-results';
    resultsContainer.setAttribute('aria-live', 'polite');
    dialog.append(searchInput, resultsContainer);
    dialog.showModal();
    searchInput.focus();
    try {
      const response = await fetch('/web/assets/search.json');
      if (!response.ok) throw new Error('Search unavailable');
      const posts = await response.json();
      const updateResults = () => {
        const query = searchInput.value.trim().toLocaleLowerCase();
        resultsContainer.replaceChildren();
        const matches = posts.filter((post) =>
          (post.title + ' ' + post.text).toLocaleLowerCase().includes(query),
        );
        matches.forEach((post) => {
          const resultLink = document.createElement('a');
          resultLink.href = post.url;
          resultLink.textContent = post.title;
          resultsContainer.append(resultLink);
        });
        if (!matches.length) resultsContainer.textContent = 'No posts found.';
      };
      searchInput.addEventListener('input', updateResults);
      updateResults();
    } catch {
      resultsContainer.textContent = 'Search is unavailable. Please visit the blog.';
    }
  }

  function initializePostSearch() {
    document
      .querySelectorAll('.search-input [role=button], [aria-label="Search"][role=button]')
      .forEach((button) => {
        button.tabIndex = 0;
        button.addEventListener('click', () => openSearchDialog(''));
        button.addEventListener('keydown', (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openSearchDialog('');
          }
        });
      });
    document.querySelectorAll('input[placeholder=Search]').forEach((input) =>
      input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          openSearchDialog(input.value);
        }
      }),
    );
  }

  function initializeProfileActions() {
    document
      .querySelectorAll('.profile-follow-action, .profile-actions-menu button')
      .forEach((button) =>
        button.addEventListener('click', () => {
          const dialog = createDialog('Follow Oxbridge Stipendium');
          const message = document.createElement('p');
          message.textContent =
            'Member accounts are currently unavailable. For updates, contact stipendium@oxbridgestipendium.org or follow our social media channels.';
          dialog.append(message);
          dialog.showModal();
        }),
      );
  }

  // Formulář dárců odesílá do Brevo. Aby návštěvník nezůstal na cizí
  // děkovací stránce, míří odeslání do skrytého rámečku a poděkování
  // ukážeme přímo pod formulářem. Bez JavaScriptu se formulář odešle
  // normálně a potvrzení zobrazí Brevo — funguje to tak jako tak.
  function initializeDonorForms() {
    const forms = document.querySelectorAll('[data-brevo-form]');
    if (!forms.length) return;

    let sink = document.getElementById('brevo-sink');
    if (!sink) {
      sink = document.createElement('iframe');
      sink.id = 'brevo-sink';
      sink.name = 'brevo-sink';
      sink.title = 'Odeslání formuláře';
      sink.setAttribute('aria-hidden', 'true');
      sink.hidden = true;
      document.body.append(sink);
    }

    const language = document.documentElement.lang;
    const thanksText =
      language === 'en'
        ? 'Thank you, you are registered. We have sent a confirmation to your e-mail.'
        : language === 'sk'
          ? 'Ďakujeme, registráciu máme. Potvrdenie sme poslali na váš e-mail.'
          : 'Děkujeme, registraci máme. Potvrzení jsme poslali na váš e-mail.';

    forms.forEach((form) => {
      // Část stránek má poděkování už v HTML (zůstalo z Wixu), zbytku ho doplníme.
      let thanks = form.querySelector('[id*="thanks-for-your-support"]');
      if (!thanks) {
        thanks = document.createElement('p');
        thanks.className = 'static-form-status';
        thanks.textContent = thanksText;
        form.append(thanks);
      }
      thanks.hidden = true;
      thanks.removeAttribute('aria-hidden');
      thanks.setAttribute('role', 'status');

      form.addEventListener('submit', () => {
        // Neplatná pole zastaví prohlížeč sám, sem se pak vůbec nedostaneme.
        const button = form.querySelector('button[type="submit"]');
        if (button) button.disabled = true;

        sink.addEventListener(
          'load',
          () => {
            if (thanks) thanks.hidden = false;
            form.reset();
            if (button) button.disabled = false;
          },
          { once: true },
        );
      });
    });
  }

  // Select the layout before binding its controls; the original order is intentional.
  function initializeSite() {
    initializeResponsiveLayout();
    initializeBiographies();
    initializeMobileMenu();
    initializeBackToTop();
    initializePressSlideshows();
    initializePostSharing();
    initializeImageExpansion();
    initializeEventDescriptions();
    initializeEventAccordions();
    initializePostSearch();
    initializeProfileActions();
    initializeDonorForms();
  }

  // Slide dimensions are available only after the shared stylesheet has loaded.
  function initializeAfterStyles() {
    const stylesheet = document.getElementById('site-styles');
    if (!stylesheet || stylesheet.sheet) initializeSite();
    else stylesheet.addEventListener('load', initializeSite, { once: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAfterStyles, { once: true });
  } else {
    initializeAfterStyles();
  }
})();
