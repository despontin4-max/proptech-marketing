/**
 * ============================================================================
 * AUTOHOGAR - ENTERPRISE CLIENT APPLICATION SCRIPT
 * Sistema Aker Editorial - Arquitectura Modular de Alta Resiliencia
 * Dominio Oficial: autohogar.com.ar
 * ============================================================================
 */

(function () {
  'use strict';

  // --------------------------------------------------------------------------
  // 1. CONFIGURACIÓN CENTRALIZADA (Inmutable / Single Source of Truth)
  // --------------------------------------------------------------------------
  const CONFIG = Object.freeze({
    WHATSAPP: {
      PRIMARY_PHONE: '5492643171848',
      SECONDARY_PHONE: '5492646032870',
      BASE_URL: 'https://wa.me/'
    },
    DOMAINS: {
      OFFICIAL: 'autohogar.com.ar'
    },
    RATE_LIMIT_MS: 30000, // 30 segundos entre envíos de prospectos
    STORAGE_KEYS: {
      LAST_LEAD: 'autohogar_last_lead_ts',
      LAST_CRO_LEAD: 'autohogar_last_cro_ts',
      HEATMAP_DATA: 'autohogar_heatmap_telemetry',
      ADMIN_HEATMAP: 'autohogar_admin_heatmap'
    },
    PROVINCES: {
      ACTIVE_DIRECT: Object.freeze([
        'prov-sanjuan',
        'prov-mendoza',
        'prov-sanluis',
        'prov-larioja',
        'prov-cordoba',
        'prov-catamarca',
        'prov-neuquen',
        'prov-rionegro'
      ])
    }
  });

  // --------------------------------------------------------------------------
  // 2. UTILIDADES TRANSVERSALES Y SEGURIDAD (Utils)
  // --------------------------------------------------------------------------
  const Utils = {
    /**
     * Sanitiza cadenas de texto para prevenir XSS e inyecciones de código.
     */
    sanitizeText(str, maxLength = 120) {
      if (typeof str !== 'string') return '';
      return str
        .replace(/[<>'"/\\;{}[\]]/g, '')
        .trim()
        .slice(0, maxLength);
    },

    /**
     * Limpia y valida formato básico de número telefónico.
     */
    sanitizePhone(str, maxLength = 30) {
      if (typeof str !== 'string') return '';
      return str.replace(/[^0-9+\s-]/g, '').trim().slice(0, maxLength);
    },

    /**
     * Verifica y actualiza el Rate Limiting local por clave de almacenamiento.
     */
    isRateLimited(storageKey, windowMs = CONFIG.RATE_LIMIT_MS) {
      try {
        const lastTs = localStorage.getItem(storageKey);
        const now = Date.now();
        if (lastTs && (now - parseInt(lastTs, 10)) < windowMs) {
          return true;
        }
        localStorage.setItem(storageKey, now.toString());
        return false;
      } catch {
        return false;
      }
    },

    /**
     * Construye URLs estructuradas y seguras para el API de WhatsApp.
     */
    buildWhatsAppUrl(phone, text) {
      const sanitizedPhone = (phone || CONFIG.WHATSAPP.PRIMARY_PHONE).replace(/\D/g, '');
      return `${CONFIG.WHATSAPP.BASE_URL}${sanitizedPhone}?text=${encodeURIComponent(text.trim())}`;
    },

    /**
     * Registro seguro de eventos en Microsoft Clarity si está disponible.
     */
    trackClarity(eventName, metadata) {
      if (typeof window.clarity === 'function') {
        try {
          window.clarity('event', eventName, metadata);
        } catch {
          // Ignorar de forma segura si hay bloqueador de analítica
        }
      }
    },

    /**
     * Muestra notificaciones no invasivas en el DOM sin recurrir a window.alert() bloqueante.
     */
    notify(message, type = 'warning', parentElem = document.body) {
      const existingToast = document.querySelector('.autohogar-toast');
      if (existingToast) existingToast.remove();

      const toast = document.createElement('div');
      toast.className = `autohogar-toast toast-${type}`;
      toast.setAttribute('role', 'alert');
      toast.style.cssText = `
        position: fixed;
        bottom: 84px;
        right: 24px;
        z-index: 9999;
        background: #1c1c1c;
        color: #ffffff;
        border: 1px solid ${type === 'error' ? '#8d4f4f' : '#537179'};
        border-left: 4px solid ${type === 'error' ? '#c54949' : '#537179'};
        padding: 14px 20px;
        border-radius: 4px;
        font-family: var(--font-primary, sans-serif);
        font-size: 13.5px;
        line-height: 1.4;
        box-shadow: 0 12px 32px rgba(0,0,0,0.5);
        max-width: 360px;
        animation: fadeInToast 0.25s ease forwards;
      `;
      toast.textContent = message;

      parentElem.appendChild(toast);
      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        setTimeout(() => toast.remove(), 300);
      }, 4000);
    }
  };

  // --------------------------------------------------------------------------
  // 3. COMPONENTE: NAVEGACIÓN Y HEADER SCROLL OPTIMIZADO
  // --------------------------------------------------------------------------
  const NavigationComponent = {
    init() {
      const header = document.querySelector('.site-header');
      const mobileToggle = document.querySelector('.mobile-toggle');
      const navMenu = document.querySelector('.nav-menu');

      // Scroll con requestAnimationFrame para 60fps constantes
      if (header) {
        let isScrolled = false;
        let ticking = false;

        const updateScrollState = () => {
          const shouldScroll = window.scrollY > 30;
          if (shouldScroll !== isScrolled) {
            isScrolled = shouldScroll;
            header.classList.toggle('scrolled', isScrolled);
          }
          ticking = false;
        };

        window.addEventListener('scroll', () => {
          if (!ticking) {
            window.requestAnimationFrame(updateScrollState);
            ticking = true;
          }
        }, { passive: true });
      }

      // Mobile Menu
      if (mobileToggle && navMenu) {
        mobileToggle.addEventListener('click', (e) => {
          e.stopPropagation();
          const isExpanded = navMenu.classList.toggle('active');
          mobileToggle.setAttribute('aria-expanded', isExpanded.toString());
        });

        // Cerrar al clickear cualquier link
        navMenu.querySelectorAll('.nav-link').forEach(link => {
          link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            mobileToggle.setAttribute('aria-expanded', 'false');
          });
        });

        // Cerrar al clickear fuera
        document.addEventListener('click', (e) => {
          if (!navMenu.contains(e.target) && !mobileToggle.contains(e.target)) {
            navMenu.classList.remove('active');
            mobileToggle.setAttribute('aria-expanded', 'false');
          }
        });
      }

      // Smooth scroll para enlaces internos
      document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
          const targetId = this.getAttribute('href');
          if (targetId && targetId !== '#') {
            const targetElem = document.querySelector(targetId);
            if (targetElem) {
              e.preventDefault();
              targetElem.scrollIntoView({ behavior: 'smooth', block: 'start' });
              if (navMenu) navMenu.classList.remove('active');
            }
          }
        });
      });
    }
  };

  // --------------------------------------------------------------------------
  // 4. COMPONENTE: CALCULADORA RÁPIDA DEL HERO
  // --------------------------------------------------------------------------
  const CalculatorComponent = {
    init() {
      const heroCalcBtn = document.getElementById('hero-calc-btn');
      if (!heroCalcBtn) return;

      heroCalcBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const planSelect = document.getElementById('hero-calc-plan');
        const plan = planSelect ? Utils.sanitizeText(planSelect.value) : 'Vivienda Modular';
        const message = `Hola Autohogar, estuve viendo la web autohogar.com.ar y quiero consultar por un Plan de ${plan}. ¿Podrían asesorarme con las cuotas y requisitos?`;
        window.open(Utils.buildWhatsAppUrl(CONFIG.WHATSAPP.PRIMARY_PHONE, message), '_blank');
      });
    }
  };

  // --------------------------------------------------------------------------
  // 5. COMPONENTE: MAPA INTERACTIVO DE ARGENTINA (Componente 3 Aker)
  // --------------------------------------------------------------------------
  const MapComponent = {
    init() {
      const mapPaths = document.querySelectorAll('.prov-path');
      const mapCard = document.getElementById('map-card');
      const mapCardTitle = document.getElementById('map-card-title');
      const mapCardDesc = document.getElementById('map-card-desc');
      const mapCardBadge = mapCard?.querySelector('.map-card-badge');
      const mapCardLink = mapCard?.querySelector('.map-card-link');
      const pillFilters = document.querySelectorAll('.pill-filter');

      if (mapPaths.length === 0) return;

      mapPaths.forEach((path) => {
        path.addEventListener('mouseenter', () => {
          const name = path.getAttribute('data-name') || 'Provincia';
          const status = path.getAttribute('data-status') || 'Cobertura Nacional';
          const isHq = path.getAttribute('data-hq') === 'true';
          const pathId = path.getAttribute('id');
          const isDirect = CONFIG.PROVINCES.ACTIVE_DIRECT.includes(pathId);

          if (mapCardTitle) mapCardTitle.textContent = name;
          if (mapCardDesc) mapCardDesc.textContent = status;
          if (mapCardBadge) {
            mapCardBadge.textContent = isHq ? 'Sede Central Matriz' : (isDirect ? 'Zona Activa Directa' : 'Logística Nacional');
          }
          if (mapCardLink) {
            const message = `Hola Autohogar, consulto por cobertura y entrega en la provincia de ${name}.`;
            mapCardLink.href = Utils.buildWhatsAppUrl(CONFIG.WHATSAPP.PRIMARY_PHONE, message);
          }

          mapPaths.forEach(p => p.classList.remove('prov-hovered'));
          path.classList.add('prov-hovered');
        });

        path.addEventListener('click', () => {
          const name = path.getAttribute('data-name') || 'mi provincia';
          const message = `Hola Autohogar, me interesa saber cómo acceder a un plan desde ${name}.`;
          window.open(Utils.buildWhatsAppUrl(CONFIG.WHATSAPP.PRIMARY_PHONE, message), '_blank');
        });
      });

      // Filtros de Región Cuyo/Activa vs Todo el País
      pillFilters.forEach((pill) => {
        pill.addEventListener('click', () => {
          pillFilters.forEach(p => p.classList.remove('active'));
          pill.classList.add('active');

          const region = pill.getAttribute('data-region');
          const isCuyo = region === 'cuyo';

          mapPaths.forEach((path) => {
            const isDirect = CONFIG.PROVINCES.ACTIVE_DIRECT.includes(path.getAttribute('id'));
            if (isCuyo) {
              if (isDirect) {
                path.classList.add('prov-active');
                path.style.opacity = '1';
              } else {
                path.classList.remove('prov-active');
                path.style.opacity = '0.35';
              }
            } else {
              path.classList.add('prov-active');
              path.style.opacity = '1';
            }
          });

          if (mapCardTitle) {
            mapCardTitle.textContent = isCuyo ? 'Zona Activa Directa' : 'Entrega Nacional';
          }
          if (mapCardDesc) {
            mapCardDesc.textContent = isCuyo
              ? 'Sede matriz en San Juan y cobertura activa directa en Cuyo (Mendoza, San Luis, La Rioja), Centro (Córdoba), Noroeste (Catamarca) y Patagonia (Neuquén y Río Negro).'
              : 'Transportamos casas modulares e instalamos en cualquier punto de la República Argentina.';
          }
          if (mapCardBadge) {
            mapCardBadge.textContent = isCuyo ? 'Red Regional' : 'Todo el País';
          }
        });
      });
    }
  };

  // --------------------------------------------------------------------------
  // 6. COMPONENTE: VISOR MULTIMEDIA DE FÁBRICA (Componente 4 Aker)
  // --------------------------------------------------------------------------
  const MediaShowcaseComponent = {
    init() {
      const tabButtons = document.querySelectorAll('.tab-btn');
      const mediaPanels = document.querySelectorAll('.media-panel');

      if (tabButtons.length === 0) return;

      tabButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
          const targetId = btn.getAttribute('data-target');

          tabButtons.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');

          // Pausar videos inactivos
          mediaPanels.forEach((panel) => {
            const video = panel.querySelector('video');
            if (video && !video.paused) {
              video.pause();
            }
            panel.classList.remove('active');
          });

          const targetPanel = document.getElementById(targetId);
          if (targetPanel) {
            targetPanel.classList.add('active');
            const activeVideo = targetPanel.querySelector('video');
            if (activeVideo) {
              activeVideo.currentTime = 0;
            }
          }
        });
      });
    }
  };

  // --------------------------------------------------------------------------
  // 7. COMPONENTE: MÉTRICAS MONUMENTALES Y CONTADOR (Componente 6 Aker)
  // --------------------------------------------------------------------------
  const MetricsComponent = {
    init() {
      const metricElements = document.querySelectorAll('.metric-giant-number[data-count]');
      const metricsSection = document.querySelector('.section-monumental-metrics');

      if (metricElements.length === 0 || !metricsSection) return;

      let hasAnimated = false;
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            hasAnimated = true;
            metricElements.forEach((el) => {
              const target = parseInt(el.getAttribute('data-count'), 10);
              const duration = 1600;
              const startTime = performance.now();

              const updateNumber = (now) => {
                const elapsed = now - startTime;
                const progress = Math.min(elapsed / duration, 1);
                // Curva de desaceleración cuartica suave
                const ease = 1 - Math.pow(1 - progress, 4);
                const current = Math.floor(ease * target);

                el.textContent = target >= 1000
                  ? `+${current.toLocaleString('es-AR')}`
                  : `+${current}`;

                if (progress < 1) {
                  requestAnimationFrame(updateNumber);
                }
              };

              requestAnimationFrame(updateNumber);
            });
          }
        });
      }, { threshold: 0.3 });

      observer.observe(metricsSection);
    }
  };

  // --------------------------------------------------------------------------
  // 8. COMPONENTE: ACORDEÓN DE PREGUNTAS FRECUENTES (Componente 7 Aker)
  // --------------------------------------------------------------------------
  const AccordionComponent = {
    init() {
      const accordionItems = document.querySelectorAll('.aker-accordion-item');
      if (accordionItems.length === 0) return;

      accordionItems.forEach((item) => {
        const headerBtn = item.querySelector('.aker-accordion-header');
        const body = item.querySelector('.aker-accordion-body');
        const icon = item.querySelector('.accordion-toggle-icon');

        if (!headerBtn || !body) return;

        if (item.classList.contains('active')) {
          body.style.maxHeight = `${body.scrollHeight}px`;
          if (icon) icon.innerHTML = '&minus;';
        }

        headerBtn.addEventListener('click', () => {
          const isActive = item.classList.contains('active');

          accordionItems.forEach((other) => {
            other.classList.remove('active');
            const otherBody = other.querySelector('.aker-accordion-body');
            const otherIcon = other.querySelector('.accordion-toggle-icon');
            if (otherBody) otherBody.style.maxHeight = null;
            if (otherIcon) otherIcon.innerHTML = '&#43;';
          });

          if (!isActive) {
            item.classList.add('active');
            body.style.maxHeight = `${body.scrollHeight}px`;
            if (icon) icon.innerHTML = '&minus;';
          }
        });
      });
    }
  };

  // --------------------------------------------------------------------------
  // 9. COMPONENTE: SELECTOR DE VISTAS (Render vs Plano de Tipologías)
  // --------------------------------------------------------------------------
  const TipologiasComponent = {
    init() {
      const viewSwitchButtons = document.querySelectorAll('.view-switch-btn');
      if (viewSwitchButtons.length === 0) return;

      viewSwitchButtons.forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const targetId = btn.getAttribute('data-target');
          const cardMedia = btn.closest('.tipologia-media-box');
          if (!cardMedia) return;

          cardMedia.querySelectorAll('.view-switch-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');

          cardMedia.querySelectorAll('.tipologia-img').forEach(img => img.classList.remove('active'));
          const targetImg = document.getElementById(targetId);
          if (targetImg) {
            targetImg.classList.add('active');
          }
        });
      });
    }
  };

  // --------------------------------------------------------------------------
  // 10. COMPONENTE: FORMULARIO BÁSICO DE CONTACTO
  // --------------------------------------------------------------------------
  const LeadFormComponent = {
    init() {
      const leadForm = document.getElementById('meta-lead-form');
      const formSuccess = document.getElementById('form-success-msg');
      if (!leadForm) return;

      leadForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const nameInput = document.getElementById('lead-name');
        const phoneInput = document.getElementById('lead-phone');
        const provinceInput = document.getElementById('lead-province');
        const interestInput = document.getElementById('lead-interest');

        const name = Utils.sanitizeText(nameInput?.value);
        const phone = Utils.sanitizePhone(phoneInput?.value);
        const province = Utils.sanitizeText(provinceInput?.value) || 'San Juan';
        const interest = Utils.sanitizeText(interestInput?.value) || 'Vivienda Modular';

        if (!name || name.length < 2) {
          Utils.notify('Por favor ingresá tu nombre completo.', 'error', leadForm);
          nameInput?.focus();
          return;
        }

        if (!phone || phone.length < 6) {
          Utils.notify('Por favor ingresá un número de WhatsApp válido.', 'error', leadForm);
          phoneInput?.focus();
          return;
        }

        if (Utils.isRateLimited(CONFIG.STORAGE_KEYS.LAST_LEAD)) {
          Utils.notify('Ya recibimos una solicitud reciente. En instantes un asesor te contactará.', 'warning', leadForm);
          return;
        }

        Utils.trackClarity('lead_form_submitted');

        leadForm.style.display = 'none';
        if (formSuccess) formSuccess.style.display = 'block';

        const directWaBtn = document.getElementById('direct-wa-after-form');
        if (directWaBtn) {
          const message = `Hola Autohogar, mi nombre es ${name} (de ${province}). Dejé mis datos en la web solicitando información sobre ${interest}. Me gustaría recibir una propuesta personalizada.`;
          directWaBtn.href = Utils.buildWhatsAppUrl(CONFIG.WHATSAPP.PRIMARY_PHONE, message);
        }
      });
    }
  };

  // --------------------------------------------------------------------------
  // 11. COMPONENTE: CRO NEUROMARKETING & HEATMAP TRACKER
  // --------------------------------------------------------------------------
  const CroModule = {
    init() {
      const croCard = document.getElementById('modulo-captacion-tipologias');
      const croForm = document.getElementById('cro-interactive-lead-form');
      const croSuccess = document.getElementById('cro-form-success');
      const croDirectWaBtn = document.getElementById('cro-direct-wa-btn');
      const btnToggleHeatmap = document.getElementById('btn-toggle-heatmap');
      const heatmapAuditPanel = document.getElementById('heatmap-audit-panel');
      const heatmapSummaryContent = document.getElementById('heatmap-summary-content');
      const adminControl = document.getElementById('admin-heatmap-control');

      if (!croCard || !croForm) return;

      // Estado base de telemetría de calor
      const defaultHeatmap = {
        totalInteractions: 142,
        tipologia: { principiante: 35, hogar: 68, master: 26, modular: 13 },
        cuota: { cuota_accesible: 57, cuota_media: 64, cuota_alta: 21 },
        terreno: { con_terreno: 88, sin_terreno: 54 },
        dwellTimes: { tipologia: 0, cuota: 0, terreno: 0, contacto: 0 }
      };

      let heatmapData = defaultHeatmap;
      try {
        const stored = localStorage.getItem(CONFIG.STORAGE_KEYS.HEATMAP_DATA);
        if (stored) {
          heatmapData = Object.assign({}, defaultHeatmap, JSON.parse(stored));
        }
      } catch {
        // Fallback a defaultHeatmap
      }

      // Renderizado visual de porcentajes de demanda
      const updateHeatVisuals = () => {
        // Tipología
        const totalTip = Object.values(heatmapData.tipologia).reduce((a, b) => a + b, 0) || 1;
        document.querySelectorAll('#selector-tipologia .cro-pill-option').forEach(opt => {
          const val = opt.getAttribute('data-heat-value');
          const count = heatmapData.tipologia[val] || 0;
          const pct = Math.round((count / totalTip) * 100);
          const fill = opt.querySelector('.heat-fill');
          const text = opt.querySelector('.heat-pct');
          if (fill) fill.style.width = `${pct}%`;
          if (text) text.textContent = `${pct}%`;
        });

        // Cuota
        const totalCuota = Object.values(heatmapData.cuota).reduce((a, b) => a + b, 0) || 1;
        document.querySelectorAll('#selector-cuota .cro-pill-option').forEach(opt => {
          const val = opt.getAttribute('data-heat-value');
          const count = heatmapData.cuota[val] || 0;
          const pct = Math.round((count / totalCuota) * 100);
          const fill = opt.querySelector('.heat-fill');
          const text = opt.querySelector('.heat-pct');
          if (fill) fill.style.width = `${pct}%`;
          if (text) text.textContent = `${pct}%`;
        });

        // Terreno
        const totalTerreno = Object.values(heatmapData.terreno).reduce((a, b) => a + b, 0) || 1;
        document.querySelectorAll('#selector-terreno .cro-pill-option').forEach(opt => {
          const val = opt.getAttribute('data-heat-value');
          const count = heatmapData.terreno[val] || 0;
          const pct = Math.round((count / totalTerreno) * 100);
          const fill = opt.querySelector('.heat-fill');
          const text = opt.querySelector('.heat-pct');
          if (fill) fill.style.width = `${pct}%`;
          if (text) text.textContent = `${pct}%`;
        });

        // Panel de Auditoría para el Equipo Comercial
        if (heatmapSummaryContent) {
          const topTipologia = Object.entries(heatmapData.tipologia).sort((a, b) => b[1] - a[1])[0][0];
          const tipNames = { principiante: 'Principiante 1D', hogar: 'Hogar 2D', master: 'Master 3D', modular: 'Modular 90D' };
          const topCuota = Object.entries(heatmapData.cuota).sort((a, b) => b[1] - a[1])[0][0];
          const cuotaNames = { cuota_accesible: 'Hasta $180k', cuota_media: '$180k a $280k', cuota_alta: 'Más de $280k' };
          const pctConTerreno = Math.round((heatmapData.terreno.con_terreno / totalTerreno) * 100);

          // Construcción segura con createElement (VULN-005 fix: sin innerHTML dinámico)
          heatmapSummaryContent.innerHTML = '';
          const stats = [
            {
              title: 'Modelo con Mayor Demanda',
              val: tipNames[topTipologia] || topTipologia,
              sub: `${Math.round((heatmapData.tipologia[topTipologia] / totalTip) * 100)}% de los clics`
            },
            {
              title: 'Rango de Cuota Preferido',
              val: cuotaNames[topCuota] || topCuota,
              sub: `${Math.round((heatmapData.cuota[topCuota] / totalCuota) * 100)}% busca este rango`
            },
            {
              title: 'Disponibilidad de Lote',
              val: `${pctConTerreno}% con terreno`,
              sub: `${100 - pctConTerreno}% busca con lote incluido`
            }
          ];
          stats.forEach(stat => {
            const box = document.createElement('div');
            box.className = 'heat-stat-box';
            const t = document.createElement('div'); t.className = 'heat-stat-title'; t.textContent = stat.title;
            const v = document.createElement('div'); v.className = 'heat-stat-val';   v.textContent = stat.val;
            const s = document.createElement('div'); s.className = 'heat-stat-sub';   s.textContent = stat.sub;
            box.append(t, v, s);
            heatmapSummaryContent.appendChild(box);
          });
        }

        try {
          localStorage.setItem(CONFIG.STORAGE_KEYS.HEATMAP_DATA, JSON.stringify(heatmapData));
        } catch {
          // Ignorar almacenamiento lleno
        }
      };

      // Telemetría de Selección
      croForm.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', () => {
          const group = radio.closest('.cro-step-group')?.getAttribute('data-heat-field');
          const opt = radio.closest('.cro-pill-option');
          const val = opt?.getAttribute('data-heat-value');

          if (group && val && heatmapData[group] && typeof heatmapData[group][val] === 'number') {
            heatmapData[group][val]++;
            heatmapData.totalInteractions++;
            updateHeatVisuals();
            Utils.trackClarity(`heat_${group}_${val}`);
          }
        });
      });

      // Dwell Time por campo
      let currentField = null;
      let fieldStartTime = null;

      croCard.querySelectorAll('[data-heat-field]').forEach(elem => {
        elem.addEventListener('mouseenter', () => {
          currentField = elem.getAttribute('data-heat-field');
          fieldStartTime = Date.now();
        });
        elem.addEventListener('mouseleave', () => {
          if (currentField && fieldStartTime) {
            const elapsedSeconds = Math.round((Date.now() - fieldStartTime) / 1000);
            if (heatmapData.dwellTimes && heatmapData.dwellTimes[currentField] !== undefined) {
              heatmapData.dwellTimes[currentField] += elapsedSeconds;
            }
          }
          currentField = null;
          fieldStartTime = null;
        });
      });

      // Administración del Mapa de Calor (solo acceso por atajo de teclado Ctrl+Shift+H)
      // VULN-007 fix: eliminado acceso por query string ?admin=heatmap
      const isAdminMode = localStorage.getItem(CONFIG.STORAGE_KEYS.ADMIN_HEATMAP) === 'true';

      const toggleAdminUI = (show) => {
        if (adminControl) adminControl.style.display = show ? 'block' : 'none';
        const isActive = show ? croCard.classList.toggle('heatmap-active') : croCard.classList.remove('heatmap-active');
        if (btnToggleHeatmap) btnToggleHeatmap.classList.toggle('active', isActive);
        if (heatmapAuditPanel) heatmapAuditPanel.style.display = isActive ? 'block' : 'none';
        updateHeatVisuals();
      };

      if (isAdminMode && adminControl) {
        adminControl.style.display = 'block';
      }

      // Atajo de Teclado Administrador: Ctrl + Shift + H
      window.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && (e.key === 'H' || e.key === 'h')) {
          e.preventDefault();
          const currentlyVisible = adminControl && adminControl.style.display !== 'none';
          if (currentlyVisible) {
            toggleAdminUI(false);
            localStorage.removeItem(CONFIG.STORAGE_KEYS.ADMIN_HEATMAP);
          } else {
            toggleAdminUI(true);
            localStorage.setItem(CONFIG.STORAGE_KEYS.ADMIN_HEATMAP, 'true');
          }
        }
      });

      // Botón de alternancia visual en el panel
      if (btnToggleHeatmap) {
        btnToggleHeatmap.addEventListener('click', () => {
          const isActive = croCard.classList.toggle('heatmap-active');
          btnToggleHeatmap.classList.toggle('active', isActive);
          if (heatmapAuditPanel) heatmapAuditPanel.style.display = isActive ? 'block' : 'none';
          const textSpan = btnToggleHeatmap.querySelector('.heatmap-btn-text');
          if (textSpan) {
            textSpan.textContent = isActive ? 'Ocultar Mapa de Calor' : 'Ver Mapa de Calor';
          }
          updateHeatVisuals();
        });
      }

      // API Global Controlada para Admin
      window.AutohogarHeatmap = Object.freeze({
        show: () => {
          toggleAdminUI(true);
          localStorage.setItem(CONFIG.STORAGE_KEYS.ADMIN_HEATMAP, 'true');
        },
        hide: () => {
          toggleAdminUI(false);
          localStorage.removeItem(CONFIG.STORAGE_KEYS.ADMIN_HEATMAP);
        },
        toggle: () => {
          toggleAdminUI(!croCard.classList.contains('heatmap-active'));
        },
        getData: () => JSON.parse(JSON.stringify(heatmapData))
      });

      // Render inicial
      updateHeatVisuals();

      // Envío del Formulario CRO de Captación
      croForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const nameInput = document.getElementById('cro-lead-name');
        const phoneInput = document.getElementById('cro-lead-phone');

        const name = Utils.sanitizeText(nameInput?.value);
        const phone = Utils.sanitizePhone(phoneInput?.value);
        const tipologia = croForm.querySelector('input[name="cro_tipologia"]:checked')?.value || 'Vivienda Tradicional';
        const cuota = croForm.querySelector('input[name="cro_cuota"]:checked')?.value || 'Cuota a convenir';
        const terreno = croForm.querySelector('input[name="cro_terreno"]:checked')?.value || 'A definir';

        if (!name || name.length < 2) {
          Utils.notify('Por favor ingresá tu nombre y apellido.', 'error', croForm);
          nameInput?.focus();
          return;
        }

        if (!phone || phone.length < 6) {
          Utils.notify('Por favor ingresá tu WhatsApp con código de área.', 'error', croForm);
          phoneInput?.focus();
          return;
        }

        if (Utils.isRateLimited(CONFIG.STORAGE_KEYS.LAST_CRO_LEAD)) {
          Utils.notify('Ya recibimos tu consulta. En breve un asesor te contactará.', 'warning', croForm);
          return;
        }

        Utils.trackClarity('cro_lead_submitted');

        // Ocultar formulario y mostrar éxito
        croForm.querySelectorAll('.cro-step-group, .cro-form-row, .cro-contact-row, .cro-footer-trust').forEach(el => {
          el.style.display = 'none';
        });
        if (croSuccess) croSuccess.style.display = 'block';

        // Redirección a WhatsApp con datos precompletados
        const message = `Hola Autohogar, mi nombre es ${name}. Estuve configurando mi plan en autohogar.com.ar:\n- Modelo de interés: ${tipologia}\n- Presupuesto mensual estimado: ${cuota}\n- Situación de terreno: ${terreno}\n\nMe gustaría recibir la propuesta en cuotas fijas y verificar la disponibilidad de cupo.`;
        const waUrl = Utils.buildWhatsAppUrl(CONFIG.WHATSAPP.PRIMARY_PHONE, message);

        if (croDirectWaBtn) {
          croDirectWaBtn.href = waUrl;
        }

        setTimeout(() => {
          window.open(waUrl, '_blank');
        }, 1200);
      });
    }
  };

  // --------------------------------------------------------------------------
  // 12. BOOTSTRAP RESILIENTE (Safe Runner)
  // --------------------------------------------------------------------------
  function bootstrap() {
    const components = [
      ['Navegación', NavigationComponent],
      ['Calculadora', CalculatorComponent],
      ['Mapa Argentina', MapComponent],
      ['Showcase Multimedia', MediaShowcaseComponent],
      ['Métricas Monumentales', MetricsComponent],
      ['Acordeón FAQ', AccordionComponent],
      ['Tipologías', TipologiasComponent],
      ['Formulario Lead', LeadFormComponent],
      ['Módulo CRO', CroModule]
    ];

    components.forEach(([name, comp]) => {
      try {
        comp.init();
      } catch (err) {
        console.warn(`[Autohogar] Advertencia al inicializar componente "${name}":`, err);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }
})();
