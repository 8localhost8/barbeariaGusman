'use strict';

// EDITAR DEMONSTRAÇÃO: mude para false quando o site estiver pronto para atender.
const DEMO_MODE = true;
const DEMO_NOTICE = 'Este site é apenas uma demonstração. As funcionalidades de agendamento e contato serão implementadas após a compra do site.';
// EDITAR SERVIÇOS: preços em reais, conforme tabela fornecida.
const SERVICES = [
  { name: 'Corte', price: 40 },
  { name: 'Barba', price: 30 },
  { name: 'Sobrancelha', price: 10 },
  { name: 'Limpeza de pele', price: 30 }
];
const PRICE_FORMAT = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
// EDITAR CONTATO: mantenha o número internacional, sem pontuação.
const WHATSAPP_NUMBER = '5514996020913';
const ADDRESS = 'R. Pref. José Gonçalves de Oliveira Neto, 175 – Centro, Bocaina – SP, 17240-000';
const DEFAULT_MESSAGE = 'Olá! Quero marcar um horário na Barbearia Gusman.';

(() => {
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const whatsappUrl = message => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  const contactUrl = message => DEMO_MODE ? '#demonstracao' : whatsappUrl(message);

  $$('.whatsapp-link').forEach(link => {
    if (link.id !== 'booking-link') link.href = contactUrl(DEFAULT_MESSAGE);
  });

  // Apenas ações de contato abrem o aviso; galeria, mapa e navegação seguem ativos.
  $$('.whatsapp-link, #booking-link, [data-demo-action]').forEach(link => {
    if (DEMO_MODE) {
      link.href = '#demonstracao';
      link.setAttribute('data-demo-action', '');
      link.setAttribute('aria-haspopup', 'dialog');
      link.setAttribute('aria-controls', 'demo-dialog');
      link.removeAttribute('target');
    } else {
      if (link.dataset.liveHref) link.href = link.dataset.liveHref;
      link.removeAttribute('aria-haspopup');
      link.removeAttribute('aria-controls');
    }
  });

  const demoDialog = $('#demo-dialog');
  let demoTrigger;
  function openDemo(trigger) {
    demoTrigger = trigger;
    if (!demoDialog || typeof demoDialog.showModal !== 'function') {
      window.alert(DEMO_NOTICE);
      return;
    }
    if (!demoDialog.open) demoDialog.showModal();
    document.body.classList.add('demo-open');
    ($('#demo-close') || $('#demo-dismiss'))?.focus();
  }
  function closeDemo() {
    if (demoDialog?.open) demoDialog.close();
  }
  document.addEventListener('click', event => {
    if (!DEMO_MODE) return;
    const action = event.target.closest('[data-demo-action]');
    if (!action) return;
    event.preventDefault();
    openDemo(action);
  });
  $('#demo-close')?.addEventListener('click', closeDemo);
  $('#demo-dismiss')?.addEventListener('click', closeDemo);
  demoDialog?.addEventListener('click', event => {
    if (event.target === demoDialog) closeDemo();
  });
  demoDialog?.addEventListener('close', () => {
    document.body.classList.remove('demo-open');
    demoTrigger?.focus({ preventScroll: true });
  });

  // Atendimento somente com hora marcada; disponibilidade combinada no contato.

  const serviceOptions = $('#service-options');
  const daySelect = $('#day-select');
  const bookingLink = $('#booking-link');
  const messagePreview = $('#message-preview');
  let chosenService = SERVICES[0] || null;

  function updateMessage() {
    const day = daySelect?.value || '';
    const dayPhrase = day ? `, ${['sábado', 'domingo'].includes(day) ? 'no' : 'na'} ${day}` : '';
    const message = chosenService ? `Olá! Quero agendar: ${chosenService.name} (${PRICE_FORMAT.format(chosenService.price)})${dayPhrase}.` : DEFAULT_MESSAGE;
    if (messagePreview) messagePreview.textContent = message;
    if (bookingLink) bookingLink.href = contactUrl(message);
  }

  if (serviceOptions) {
    serviceOptions.replaceChildren(...SERVICES.map((service, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `service-chip${index === 0 ? ' is-selected' : ''}`;
      button.textContent = `${service.name} · ${PRICE_FORMAT.format(service.price)}`;
      button.setAttribute('aria-pressed', String(index === 0));
      button.addEventListener('click', () => {
        chosenService = service;
        $$('.service-chip', serviceOptions).forEach(chip => {
          const selected = chip === button;
          chip.classList.toggle('is-selected', selected);
          chip.setAttribute('aria-pressed', String(selected));
        });
        updateMessage();
      });
      return button;
    }));
  }
  daySelect?.addEventListener('change', updateMessage);
  updateMessage();

  const copyButton = $('#copy-address');
  let copyTimer;
  async function copyAddress() {
    try {
      let copied = false;
      if (navigator.clipboard?.writeText && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(ADDRESS);
          copied = true;
        } catch (_) { /* O navegador pode negar o clipboard em file://. */ }
      }
      if (!copied) {
        const input = document.createElement('textarea');
        input.value = ADDRESS;
        input.setAttribute('readonly', '');
        input.setAttribute('aria-label', 'Endereço para copiar');
        input.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
        document.body.append(input);
        input.focus();
        input.select();
        copied = document.execCommand('copy');
        input.remove();
        copyButton?.focus({ preventScroll: true });
      }
      if (!copied) throw new Error('Clipboard unavailable');
      const label = $('[data-copy-label]', copyButton) || copyButton;
      label.textContent = 'Copiado ✓';
      copyButton.dataset.copied = 'true';
      window.clearTimeout(copyTimer);
      copyTimer = window.setTimeout(() => {
        label.textContent = 'Copiar endereço';
        delete copyButton.dataset.copied;
      }, 2500);
    } catch (_) {
      const label = $('[data-copy-label]', copyButton) || copyButton;
      label.textContent = 'Selecione o endereço para copiar';
    }
  }
  copyButton?.addEventListener('click', copyAddress);

  const menuToggle = $('#menu-toggle');
  const mobileNav = $('#mobile-nav');
  function closeMenu(returnFocus = false) {
    if (!mobileNav || !menuToggle) return;
    mobileNav.hidden = true;
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Abrir menu');
    document.body.classList.remove('menu-open');
    if (returnFocus) menuToggle.focus();
  }
  menuToggle?.addEventListener('click', () => {
    const open = menuToggle.getAttribute('aria-expanded') !== 'true';
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    mobileNav.hidden = !open;
    document.body.classList.toggle('menu-open', open);
  });
  if (mobileNav) $$('a', mobileNav).forEach(link => link.addEventListener('click', () => closeMenu()));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menuToggle?.getAttribute('aria-expanded') === 'true') closeMenu(true);
  });
  document.addEventListener('click', event => {
    if (mobileNav && !mobileNav.contains(event.target) && !menuToggle?.contains(event.target)) closeMenu();
  });
  window.matchMedia('(min-width: 801px)').addEventListener('change', event => {
    if (event.matches) closeMenu();
  });

  const header = $('#site-header');
  const progress = $('#scroll-progress');
  const hero = $('#hero');
  const floatingWhatsapp = $('#floating-whatsapp');
  let previousScroll = window.scrollY;
  let scrollQueued = false;
  function updateScroll() {
    const current = Math.max(0, window.scrollY);
    const total = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.transform = `scaleX(${total > 0 ? Math.min(1, current / total) : 0})`;
    if (header) {
      header.classList.toggle('is-scrolled', current > 24);
      const menuOpen = menuToggle?.getAttribute('aria-expanded') === 'true';
      const hasFocus = header.contains(document.activeElement);
      if (current < 90 || menuOpen || hasFocus || previousScroll - current > 3) header.classList.remove('is-hidden');
      else if (current - previousScroll > 3) header.classList.add('is-hidden');
    }
    if (floatingWhatsapp && hero) {
      const visible = hero.getBoundingClientRect().bottom < 0;
      floatingWhatsapp.classList.toggle('is-visible', visible);
      floatingWhatsapp.setAttribute('aria-hidden', String(!visible));
      floatingWhatsapp.tabIndex = visible ? 0 : -1;
    }
    previousScroll = current;
    scrollQueued = false;
  }
  window.addEventListener('scroll', () => {
    if (!scrollQueued) {
      scrollQueued = true;
      window.requestAnimationFrame(updateScroll);
    }
  }, { passive: true });
  window.addEventListener('resize', updateScroll, { passive: true });
  header?.addEventListener('focusin', () => header.classList.remove('is-hidden'));
  updateScroll();

  const revealElements = $$('.reveal');
  if ('IntersectionObserver' in window && !motion.matches) {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -24px 0px' });
    revealElements.forEach(element => revealObserver.observe(element));
    motion.addEventListener('change', event => {
      if (event.matches) {
        revealElements.forEach(element => element.classList.add('is-visible'));
        revealObserver.disconnect();
      }
    });
  } else {
    revealElements.forEach(element => element.classList.add('is-visible'));
  }
  document.documentElement.classList.add('js-ready');

  $$('[data-magnetic]').forEach(button => {
    const label = $('.button-label', button);
    if (!label) return;
    button.addEventListener('pointermove', event => {
      if (motion.matches || !finePointer.matches || event.pointerType === 'touch') return;
      const bounds = button.getBoundingClientRect();
      label.style.transform = `translate(${(event.clientX - bounds.left - bounds.width / 2) * 0.07}px, ${(event.clientY - bounds.top - bounds.height / 2) * 0.12}px)`;
    });
    button.addEventListener('pointerleave', () => { label.style.transform = ''; });
    button.addEventListener('blur', () => { label.style.transform = ''; });
  });

  // Fotos: data-full aponta para o original; o <img> pode usar uma versão leve.
  const gallery = $('#gallery-track');
  const galleryItems = $$('.gallery-item');
  const dots = $$('#gallery-dots [data-slide]');
  let galleryQueued = false;
  function markGallerySlide(index) {
    dots.forEach((dot, dotIndex) => {
      const current = dotIndex === index;
      dot.classList.toggle('is-active', current);
      dot.setAttribute('aria-pressed', String(current));
      if (current) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });
  }
  function updateGalleryPosition() {
    if (gallery && gallery.scrollWidth > gallery.clientWidth + 8) {
      const bounds = gallery.getBoundingClientRect();
      const middle = bounds.left + bounds.width / 2;
      let nearestIndex = 0;
      let distance = Infinity;
      galleryItems.forEach((item, index) => {
        const rect = item.getBoundingClientRect();
        const itemDistance = Math.abs(rect.left + rect.width / 2 - middle);
        if (itemDistance < distance) { nearestIndex = index; distance = itemDistance; }
      });
      markGallerySlide(nearestIndex);
    }
    galleryQueued = false;
  }
  gallery?.addEventListener('scroll', () => {
    if (!galleryQueued) {
      galleryQueued = true;
      window.requestAnimationFrame(updateGalleryPosition);
    }
  }, { passive: true });
  dots.forEach(dot => dot.addEventListener('click', () => {
    const index = Number(dot.dataset.slide);
    const item = galleryItems[index];
    if (!item || !gallery) return;
    const itemBounds = item.getBoundingClientRect();
    const bounds = gallery.getBoundingClientRect();
    gallery.scrollTo({ left: gallery.scrollLeft + itemBounds.left - bounds.left - (gallery.clientWidth - itemBounds.width) / 2, behavior: motion.matches ? 'instant' : 'smooth' });
    markGallerySlide(index);
  }));
  markGallerySlide(0);

  const lightbox = $('#lightbox');
  const lightboxImage = $('#lightbox-image');
  const lightboxCaption = $('#lightbox-caption');
  const lightboxCounter = $('#lightbox-counter');
  let currentPhoto = 0;
  let triggerButton;
  function renderLightbox(index) {
    currentPhoto = (index + galleryItems.length) % galleryItems.length;
    const item = galleryItems[currentPhoto];
    const original = $('img', item);
    lightboxImage.parentElement.classList.remove('has-error');
    lightboxImage.hidden = false;
    lightboxImage.src = item.dataset.full || original.src;
    lightboxImage.alt = original?.alt || item.dataset.caption || 'Foto da barbearia';
    lightboxCaption.textContent = item.dataset.caption || original?.alt || '';
    if (lightboxCounter) lightboxCounter.textContent = `${currentPhoto + 1} / ${galleryItems.length}`;
  }
  if (lightbox && lightboxImage && lightboxCaption) {
    galleryItems.forEach((item, index) => item.addEventListener('click', () => {
      triggerButton = item;
      renderLightbox(index);
      if (typeof lightbox.showModal === 'function') lightbox.showModal();
      else lightbox.setAttribute('open', '');
      document.body.classList.add('lightbox-open');
      $('#lightbox-close')?.focus();
    }));
    function closeLightbox() {
      if (typeof lightbox.close === 'function') lightbox.close();
      else {
        lightbox.removeAttribute('open');
        document.body.classList.remove('lightbox-open');
        triggerButton?.focus({ preventScroll: true });
      }
    }
    $('#lightbox-close')?.addEventListener('click', closeLightbox);
    $('#lightbox-prev')?.addEventListener('click', () => renderLightbox(currentPhoto - 1));
    $('#lightbox-next')?.addEventListener('click', () => renderLightbox(currentPhoto + 1));
    lightbox.addEventListener('close', () => {
      document.body.classList.remove('lightbox-open');
      triggerButton?.focus({ preventScroll: true });
    });
    lightbox.addEventListener('click', event => {
      if (event.target === lightbox) closeLightbox();
    });
    lightbox.addEventListener('keydown', event => {
      if (event.key === 'ArrowLeft') { event.preventDefault(); renderLightbox(currentPhoto - 1); }
      if (event.key === 'ArrowRight') { event.preventDefault(); renderLightbox(currentPhoto + 1); }
      if (event.key === 'Escape' && typeof lightbox.close !== 'function') closeLightbox();
    });
    let touchStart;
    lightboxImage.addEventListener('touchstart', event => {
      const touch = event.changedTouches[0];
      touchStart = { x: touch.clientX, y: touch.clientY };
    }, { passive: true });
    lightboxImage.addEventListener('touchend', event => {
      if (!touchStart) return;
      const touch = event.changedTouches[0];
      const deltaX = touch.clientX - touchStart.x;
      const deltaY = touch.clientY - touchStart.y;
      if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY) * 1.4) renderLightbox(currentPhoto + (deltaX < 0 ? 1 : -1));
      touchStart = null;
    }, { passive: true });
  }

  // Se uma imagem for trocada/removida, a composição mantém o bloco de concreto.
  $$('img').forEach(image => {
    function showImageFallback() {
      image.hidden = true;
      image.parentElement.classList.add('image-fallback', 'has-error');
      image.parentElement.dataset.fallback = image.alt || 'Foto da barbearia';
    }
    image.addEventListener('error', showImageFallback);
    image.addEventListener('load', () => {
      image.hidden = false;
      image.parentElement.classList.remove('has-error');
    });
    if (image.complete && image.naturalWidth === 0 && image.getAttribute('src')) showImageFallback();
  });
})();
