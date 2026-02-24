/* ═══════════════════════════════════════════════════════════
   LANDING PAGE — CASA LA GRANJA — INTERACTIVITY
   ═══════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  // ── Navbar scroll effect ──
  const navbar = document.getElementById('navbar');
  const onScroll = () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ── Mobile menu toggle ──
  const menuToggle = document.getElementById('menu-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      navLinks.classList.toggle('open');
      menuToggle.classList.toggle('active');
    });
    // Close menu on link click
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        menuToggle.classList.remove('active');
      });
    });
  }

  // ── Scroll reveal ──
  const revealElements = document.querySelectorAll(
    '.section-intro, .pain-card, .benefit-block, .feature-card, .lifestyle-card, ' +
    '.trust-badge, .loc-card, .summary-grid, .section-cta .container'
  );

  revealElements.forEach(el => el.classList.add('reveal'));

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  revealElements.forEach(el => revealObserver.observe(el));

  // ── Smooth scroll for anchor links ──
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (targetId === '#') return;
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        const offset = 80;
        const y = target.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    });
  });

  // ── Stagger animation for grid cards ──
  const staggerGroups = [
    '.pain-cards .pain-card',
    '.feature-grid .feature-card',
    '.trust-badges .trust-badge',
    '.location-highlights .loc-card'
  ];

  staggerGroups.forEach(selector => {
    const cards = document.querySelectorAll(selector);
    const observer = new IntersectionObserver((entries) => {
      let delayIndex = 0;
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.transitionDelay = `${delayIndex * 0.1}s`;
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
          delayIndex++;
        }
      });
    }, { threshold: 0.1 });

    cards.forEach(card => observer.observe(card));
  });

  // ── Lightbox ──
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCounter = document.getElementById('lightbox-counter');
  const galleryItems = document.querySelectorAll('.gallery-item');
  let currentIndex = 0;

  function openLightbox(index) {
    currentIndex = index;
    updateLightbox();
    lightbox.classList.add('active');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('active');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function updateLightbox() {
    const img = galleryItems[currentIndex].querySelector('img');
    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt;
    lightboxCounter.textContent = `${currentIndex + 1} / ${galleryItems.length}`;
  }

  function nextImage() {
    currentIndex = (currentIndex + 1) % galleryItems.length;
    updateLightbox();
  }

  function prevImage() {
    currentIndex = (currentIndex - 1 + galleryItems.length) % galleryItems.length;
    updateLightbox();
  }

  // Click handlers
  galleryItems.forEach((item) => {
    item.addEventListener('click', () => {
      openLightbox(parseInt(item.dataset.index));
    });
  });

  lightbox.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
  lightbox.querySelector('.lightbox-backdrop').addEventListener('click', closeLightbox);
  lightbox.querySelector('.lightbox-next').addEventListener('click', nextImage);
  lightbox.querySelector('.lightbox-prev').addEventListener('click', prevImage);

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') nextImage();
    if (e.key === 'ArrowLeft') prevImage();
  });
});
