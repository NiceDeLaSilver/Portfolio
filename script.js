/* ============================================================
   Renan — Portfolio interactions
   - Cinematic loader exit
   - Scroll reveal via IntersectionObserver
   - Sticky nav state on scroll
   - Scroll progress bar
   - Custom cursor glow + hot-state on interactive items
   - Magnetic primary buttons
   - 3D tilt + cursor spotlight on project cards
   - Hero stats count-up
   - Hero title word-by-word stagger
   - Project modal
   - Smooth anchor scrolling
   - Subtle parallax on ambient blobs
   ============================================================ */

(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = window.matchMedia('(pointer: coarse)').matches;

  /* -------- Loader -------- */
  const loader = $('#loader');
  const hideLoader = () => {
    if (!loader) return;
    setTimeout(() => loader.classList.add('is-hidden'), 700);
  };
  if (document.readyState === 'complete') hideLoader();
  else window.addEventListener('load', hideLoader);

  /* -------- Reveal on scroll -------- */
  const reveals = $$('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('is-visible'));
  }

  /* -------- Hero title: split words for stagger reveal -------- */
  const heroTitle = $('.hero__title');
  if (heroTitle && !reduced) {
    const splitWordsIn = (node) => {
      const out = document.createDocumentFragment();
      node.childNodes.forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const parts = child.textContent.split(/(\s+)/);
          parts.forEach((p) => {
            if (!p) return;
            if (/^\s+$/.test(p)) {
              out.appendChild(document.createTextNode(p));
            } else {
              const span = document.createElement('span');
              span.className = 'word';
              span.textContent = p;
              out.appendChild(span);
            }
          });
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          if (child.tagName === 'BR') {
            out.appendChild(child.cloneNode(true));
          } else if (child.classList && child.classList.contains('grad')) {
            // Keep .grad as one unit so background-clip:text keeps working
            const clone = child.cloneNode(true);
            clone.classList.add('word');
            out.appendChild(clone);
          } else {
            // Other inline wrappers (em, etc.): preserve and split inside
            const clone = child.cloneNode(false);
            clone.appendChild(splitWordsIn(child));
            out.appendChild(clone);
          }
        }
      });
      return out;
    };
    const fragment = splitWordsIn(heroTitle);
    heroTitle.innerHTML = '';
    heroTitle.appendChild(fragment);

    const words = $$('.word', heroTitle);
    words.forEach((w, i) => {
      w.style.transitionDelay = `${0.05 + i * 0.07}s`;
    });

    // Trigger words once the title is actually visible — keeps stagger sync'd
    const triggerWords = () => words.forEach((w) => w.classList.add('is-visible'));
    if ('IntersectionObserver' in window) {
      const wio = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            triggerWords();
            wio.unobserve(heroTitle);
          }
        });
      }, { threshold: 0.1 });
      wio.observe(heroTitle);
    } else {
      triggerWords();
    }

    // Disable the parent block-level reveal so it doesn't gate the word stagger
    heroTitle.classList.remove('reveal');
  }

  /* -------- Sticky nav state -------- */
  const nav = $('#nav');
  const progress = $('#scrollProgress');
  const onScroll = () => {
    const y = window.scrollY;
    if (nav) nav.classList.toggle('is-scrolled', y > 30);
    if (progress) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const pct = max > 0 ? (y / max) * 100 : 0;
      progress.style.width = pct + '%';
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* -------- Cursor glow + magnetic + parallax (skip on reduced motion / coarse pointer) -------- */
  if (!reduced && !coarse) {
    /* ---- Cursor glow follower ---- */
    const cursor = $('#cursor');
    let cx = window.innerWidth / 2;
    let cy = window.innerHeight / 2;
    let curX = cx, curY = cy;

    if (cursor) {
      window.addEventListener('mousemove', (e) => {
        cx = e.clientX;
        cy = e.clientY;
        if (!cursor.classList.contains('is-active')) {
          cursor.classList.add('is-active');
        }
      }, { passive: true });
      window.addEventListener('mouseleave', () => cursor.classList.remove('is-active'));
    }

    /* ---- Hot state on interactive elements ---- */
    const hotSelector = 'a, button, .project, .skill, .info';
    document.addEventListener('mouseover', (e) => {
      if (!cursor) return;
      if (e.target.closest(hotSelector)) cursor.classList.add('is-hot');
    });
    document.addEventListener('mouseout', (e) => {
      if (!cursor) return;
      if (e.target.closest(hotSelector)) cursor.classList.remove('is-hot');
    });

    /* ---- Ambient blobs parallax ---- */
    const blobs = $$('.blob');
    let mxN = 0, myN = 0, txN = 0, tyN = 0;
    window.addEventListener('mousemove', (e) => {
      const w = window.innerWidth / 2;
      const h = window.innerHeight / 2;
      mxN = (e.clientX - w) / w;
      myN = (e.clientY - h) / h;
    }, { passive: true });

    const tick = () => {
      // Cursor smoothing
      curX += (cx - curX) * 0.18;
      curY += (cy - curY) * 0.18;
      if (cursor) {
        cursor.style.transform = `translate3d(${curX}px, ${curY}px, 0) translate(-50%, -50%)`;
      }

      // Blob parallax
      txN += (mxN - txN) * 0.04;
      tyN += (myN - tyN) * 0.04;
      blobs.forEach((b, i) => {
        const depth = (i + 1) * 12;
        b.style.transform = `translate3d(${txN * depth}px, ${tyN * depth}px, 0)`;
      });

      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    /* ---- Magnetic effect on primary buttons ---- */
    $$('.btn--primary').forEach((btn) => {
      const strength = 18;
      btn.addEventListener('mousemove', (e) => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - (r.left + r.width / 2);
        const y = e.clientY - (r.top + r.height / 2);
        const tx = (x / r.width) * strength;
        const ty = (y / r.height) * strength;
        btn.style.transform = `translate(${tx}px, ${ty - 2}px)`;
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
      });
    });

    /* ---- 3D tilt + spotlight on project cards ---- */
    $$('.project').forEach((card) => {
      const max = 7;
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const x = e.clientX - r.left;
        const y = e.clientY - r.top;
        const rx = ((y / r.height) - 0.5) * -2 * max;
        const ry = ((x / r.width) - 0.5) * 2 * max;
        card.style.transform = `translateY(-6px) perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`;
        card.style.setProperty('--mx', x + 'px');
        card.style.setProperty('--my', y + 'px');
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  }

  /* -------- Hero stats count-up -------- */
  const animateNumber = (el, target, suffix = '', duration = 1400) => {
    const start = performance.now();
    const from = 0;
    const step = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const value = Math.round(from + (target - from) * eased);
      el.textContent = value + suffix;
      if (t < 1) requestAnimationFrame(step);
      else el.textContent = target + suffix;
    };
    requestAnimationFrame(step);
  };

  const heroStats = $$('.hero__meta strong');
  if (heroStats.length && 'IntersectionObserver' in window && !reduced) {
    const statIO = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target;
        const raw = el.textContent.trim();
        const match = raw.match(/^(\d+)(.*)$/);
        if (match) {
          const num = parseInt(match[1], 10);
          const rest = match[2] || '';
          el.textContent = '0' + rest;
          animateNumber(el, num, rest);
        }
        statIO.unobserve(el);
      });
    }, { threshold: 0.4 });
    heroStats.forEach((el) => statIO.observe(el));
  }

  /* -------- Project modal -------- */
  const modal = $('#modal');
  const modalContent = $('#modalContent');

  const projectsData = {
    acai: {
      title: 'Cardápio de Açaí',
      description: 'Cardápio digital pensado pra delivery: feito pra abrir bem no celular, com categorias (Açaís, Combos, Bebidas), destaques dos itens mais vendidos e fluxo simples de montar o pedido. Ideal pra açaiterias e lanchonetes que querem facilitar a vida do cliente.',
      tags: ['Site', 'Cardápio', 'Delivery', 'Celular'],
      images: ['assets/projeto1/print2.jpg', 'assets/projeto1/print1.jpg'],
      note: 'Projeto fictício criado para portfolio. Marca, produtos, preços e imagens são meramente ilustrativos — usados apenas para compor a apresentação visual do layout. O objetivo é demonstrar a criação de um cardápio digital responsivo, organização visual e fluxo de pedido.',
    },
    moda: {
      title: 'Loja de Moda Feminina',
      description: 'Catálogo digital com vitrine de produtos, filtros por categoria, carrinho de compras e finalização do pedido direto pelo WhatsApp. Inclui seções de prova social (depoimentos), apresentação da marca e chamadas pra contato. Visual feminino e colorido, pensado pra abrir bem no celular.',
      tags: ['Site', 'Catálogo', 'Carrinho', 'WhatsApp'],
      images: [
        'assets/projeto2/Print1.png',
        'assets/projeto2/Print2.png',
        'assets/projeto2/Print3.png',
        'assets/projeto2/Print4.png',
      ],
      note: 'Projeto fictício criado para portfolio. A marca, os produtos, depoimentos, preços, nomes de clientes e imagens usados no site são meramente ilustrativos. O objetivo é demonstrar habilidades de criação de landing page e e-commerce responsivo, organização visual, catálogo de produtos, seções de prova social e chamada para ação via WhatsApp.',
    },
  };

  const openModal = (key) => {
    const data = projectsData[key];
    if (!data || !modal || !modalContent) return;
    modalContent.innerHTML = `
      <h3>${data.title}</h3>
      <p>${data.description}</p>
      <div class="modal__chips">${data.tags.map((t) => `<span>${t}</span>`).join('')}</div>
      ${data.images.length > 1 ? `<p class="modal__hint"><span>←</span> arraste pro lado <span>→</span></p>` : ''}
      <div class="modal__gallery">
        ${data.images.map((src) => `<img src="${src}" alt="${data.title}" loading="lazy">`).join('')}
      </div>
      ${data.note ? `<div class="modal__note"><span class="modal__note-text">${data.note}</span></div>` : ''}
    `;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  $$('[data-project]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      openModal(el.dataset.project);
    });
  });
  $$('[data-modal-close]').forEach((el) => {
    el.addEventListener('click', closeModal);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  /* -------- Smooth anchor scroll with nav offset -------- */
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const target = $(id);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 24;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
})();
