document.addEventListener('DOMContentLoaded', function () {
  // ========== Hero Scene — crossfade de cenas completas ==========
  var heroScene = document.querySelector('.hero-scene');
  if (heroScene) {
    var legacyScene = document.getElementById('legacy-iso-scene');
    if (legacyScene) legacyScene.remove();
    var sceneCourses = [
      { name: 'Transporte Escolar', image: 'assets/img/IMAGENS-VEICULOS-INICIO/TRANSPORTE-ESCOLAR.webp', position: '52% center', positionMobile: '66% center' },
      { name: 'Transporte MOPP', image: 'assets/img/IMAGENS-VEICULOS-INICIO/CURSO-MOPP.webp', position: '50% center', positionMobile: '64% center' },
      { name: 'Veículos de Emergência', image: 'assets/img/IMAGENS-VEICULOS-INICIO/CONDUTOR-EMERGENCIA.webp', position: '51% center', positionMobile: '65% center' },
      { name: 'Transporte Coletivo', image: 'assets/img/IMAGENS-VEICULOS-INICIO/TRANSPORTE-COLETIVO.webp', position: '51% center', positionMobile: '65% center' },
      { name: 'Cargas Indivisíveis', image: 'assets/img/IMAGENS-VEICULOS-INICIO/CARGAS-INDIVISIVEIS.webp', position: '49% center', positionMobile: '63% center' }
    ];
    // O crop mobile (aspect-ratio 4/3) é mais agressivo que o desktop (3/2) e
    // corta a sinalização à direita das fotos com a posição usada no desktop.
    function scenePosition(course) {
      return window.innerWidth <= 560 ? course.positionMobile : course.position;
    }
    var currentIndex = 0, sceneTimer = null, isTransitioning = false, sceneVisible = true, sceneReady = false, sceneAssets = [];
    var sceneReduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    var currentImage = heroScene.querySelector('.hero-scene-current');
    var nextImage = heroScene.querySelector('.hero-scene-next');
    var sceneName = heroScene.querySelector('.hero-scene-name');
    var sceneDots = heroScene.querySelectorAll('.hero-scene-progress button');
    var inspectedSlide = Number(new URLSearchParams(window.location.search).get('heroSlide'));
    if (Number.isInteger(inspectedSlide) && inspectedSlide >= 0 && inspectedSlide < sceneCourses.length) {
      currentIndex = inspectedSlide;
      currentImage.src = sceneCourses[currentIndex].image;
      currentImage.style.objectPosition = scenePosition(sceneCourses[currentIndex]);
      nextImage.src = sceneCourses[(currentIndex + 1) % sceneCourses.length].image;
    }
    var scenePreloads = sceneCourses.map(function (course) {
      return new Promise(function (resolve, reject) {
        var image = new Image();
        image.onload = function () { image.naturalWidth > 0 ? resolve(image) : reject(new Error('Imagem inválida')); };
        image.onerror = reject;
        image.src = course.image;
      });
    });

    function updateSceneUI(index) {
      sceneName.textContent = sceneCourses[index].name;
      sceneDots.forEach(function (dot, i) { dot.classList.toggle('is-active', i === index); });
    }
    function commitScene(nextIndex) {
      var course = sceneCourses[nextIndex];
      // CURRENT está invisível neste ponto. Atualizamos seu src por baixo da
      // camada NEXT opaca e fazemos o commit sem transição em um único frame.
      heroScene.classList.add('is-committing');
      currentImage.src = course.image;
      currentImage.style.objectPosition = scenePosition(course);
      heroScene.classList.remove('is-transitioning');
      updateSceneUI(nextIndex);
      sceneName.classList.remove('is-changing');
      currentIndex = nextIndex;
      void heroScene.offsetWidth;
      requestAnimationFrame(function () {
        heroScene.classList.remove('is-committing');
        isTransitioning = false;
        scheduleNextScene();
      });
    }
    function crossfadeScene(index) {
      if (isTransitioning || !sceneReady || index === currentIndex) return;
      var asset = sceneAssets[index];
      if (!asset || !asset.complete || asset.naturalWidth <= 0) return;
      window.clearTimeout(sceneTimer);
      isTransitioning = true;
      var course = sceneCourses[index];
      nextImage.src = course.image;
      nextImage.style.objectPosition = scenePosition(course);
      sceneName.classList.add('is-changing');
      if (sceneReduced.matches) { commitScene(index); return; }
      nextImage.addEventListener('transitionend', function onSceneTransition(event) {
        if (event.propertyName !== 'opacity') return;
        nextImage.removeEventListener('transitionend', onSceneTransition);
        commitScene(index);
      });
      requestAnimationFrame(function () { requestAnimationFrame(function () { heroScene.classList.add('is-transitioning'); }); });
    }
    function scheduleNextScene() {
      window.clearTimeout(sceneTimer);
      if (sceneReady && sceneVisible && !sceneReduced.matches && !isTransitioning) {
        sceneTimer = window.setTimeout(function () { crossfadeScene((currentIndex + 1) % sceneCourses.length); }, 3000);
      }
    }
    sceneDots.forEach(function (dot) { dot.addEventListener('click', function () { crossfadeScene(Number(dot.getAttribute('data-course'))); }); });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (entries) { entries.forEach(function (entry) { sceneVisible = entry.isIntersecting; if (sceneVisible) scheduleNextScene(); else window.clearTimeout(sceneTimer); }); }, { threshold: 0.08 }).observe(heroScene);
    Promise.all(scenePreloads).then(function (images) { sceneAssets = images; sceneReady = true; scheduleNextScene(); }).catch(function () { /* mantém a primeira cena estática se algum asset falhar */ });
    updateSceneUI(currentIndex);
  }
  // ========== Isometric Scene — revelação (roda primeiro e isolada, para
  // nunca ficar invisível caso algum outro trecho do script falhe) ==========
  try {
    var isoSceneEl = document.querySelector('.iso-scene');
    if (isoSceneEl) {
      var isoPrefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (isoPrefersReduced) {
        isoSceneEl.classList.add('iso-active');
      } else {
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            isoSceneEl.classList.add('iso-active');
          });
        });
      }
    }
  } catch (e) { /* nunca deixa a cena travar o resto do script */ }

  // Páginas internas usam exatamente o footer institucional da home.
  // Isso evita manter cópias divergentes em cursos, blog e políticas.
  var legacyFooter = document.querySelector('.site-footer');
  if (legacyFooter && !legacyFooter.querySelector('.footer-signature')) {
    var footerPrefix = /\/(cursos|blog)\//.test(window.location.pathname) ? '../' : '';
    var footerHomeUrl = new URL(footerPrefix + 'index.html', window.location.href);
    fetch(footerHomeUrl.href).then(function (response) {
      if (!response.ok) throw new Error('Footer compartilhado indisponível');
      return response.text();
    }).then(function (html) {
      var parsedHome = new DOMParser().parseFromString(html, 'text/html');
      var sharedFooter = parsedHome.querySelector('.site-footer');
      if (!sharedFooter) return;
      sharedFooter.querySelectorAll('[href]').forEach(function (element) {
        var value = element.getAttribute('href');
        if (value && !/^(https?:|mailto:|tel:)/.test(value)) element.href = new URL(value, footerHomeUrl).href;
      });
      sharedFooter.querySelectorAll('[src]').forEach(function (element) {
        element.src = new URL(element.getAttribute('src'), footerHomeUrl).href;
      });
      sharedFooter.querySelectorAll('[srcset]').forEach(function (element) {
        element.srcset = new URL(element.getAttribute('srcset'), footerHomeUrl).href;
      });
      legacyFooter.replaceWith(sharedFooter);

      var sharedCnpj = sharedFooter.querySelector('#cnpj-line');
      if (sharedCnpj && window.VIADUCA && window.VIADUCA.cnpj) {
        sharedCnpj.textContent = 'CNPJ: ' + window.VIADUCA.cnpj;
        sharedCnpj.hidden = false;
      }
      var sharedMobile = window.matchMedia('(max-width: 700px)');
      var sharedToggles = sharedFooter.querySelectorAll('.footer-group-toggle');
      function syncSharedFooter() {
        sharedToggles.forEach(function (button) {
          var panel = sharedFooter.querySelector('#' + button.getAttribute('aria-controls'));
          if (!panel) return;
          button.setAttribute('aria-expanded', sharedMobile.matches ? 'false' : 'true');
          panel.hidden = sharedMobile.matches;
        });
      }
      sharedToggles.forEach(function (button) {
        button.addEventListener('click', function () {
          if (!sharedMobile.matches) return;
          var panel = sharedFooter.querySelector('#' + button.getAttribute('aria-controls'));
          var open = button.getAttribute('aria-expanded') === 'true';
          button.setAttribute('aria-expanded', open ? 'false' : 'true');
          panel.hidden = open;
        });
      });
      if (sharedMobile.addEventListener) sharedMobile.addEventListener('change', syncSharedFooter);
      else sharedMobile.addListener(syncSharedFooter);
      syncSharedFooter();
    }).catch(function () { /* mantém o footer local como fallback */ });
  }

  // ========== CNPJ (footer) — só exibe quando preenchido em config.js ==========
  var cnpjEl = document.getElementById('cnpj-line');
  if (cnpjEl && window.VIADUCA && window.VIADUCA.cnpj) {
    cnpjEl.textContent = 'CNPJ: ' + window.VIADUCA.cnpj;
    cnpjEl.hidden = false;
  }

  // ========== Footer accordions (mobile) ==========
  var footerToggles = document.querySelectorAll('.site-footer .footer-group-toggle');
  var footerMobile = window.matchMedia('(max-width: 700px)');
  function syncFooterAccordions() {
    footerToggles.forEach(function (button) {
      var panel = document.getElementById(button.getAttribute('aria-controls'));
      if (!panel) return;
      if (footerMobile.matches) {
        button.setAttribute('aria-expanded', 'false');
        panel.hidden = true;
      } else {
        button.setAttribute('aria-expanded', 'true');
        panel.hidden = false;
      }
    });
  }
  footerToggles.forEach(function (button) {
    button.addEventListener('click', function () {
      if (!footerMobile.matches) return;
      var panel = document.getElementById(button.getAttribute('aria-controls'));
      var open = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', open ? 'false' : 'true');
      panel.hidden = open;
    });
  });
  if (footerMobile.addEventListener) footerMobile.addEventListener('change', syncFooterAccordions);
  else footerMobile.addListener(syncFooterAccordions);
  syncFooterAccordions();

  // ========== Global Courses Mini Mega-Menu + Mobile Nav ==========
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.main-nav');
  if (toggle && nav) {
    var navMobile = window.matchMedia('(max-width: 1120px)');
    var courseDropdown = nav.querySelector('.nav-dropdown');
    var legacyCourseToggle = courseDropdown ? courseDropdown.querySelector('.nav-drop-toggle') : null;
    var courseMenu = courseDropdown ? courseDropdown.querySelector('.nav-dropdown-menu') : null;
    var courseToggle = null;
    var courseCloseTimer = null;

    if (courseDropdown && legacyCourseToggle && courseMenu) {
      var nestedPage = /\/(?:blog|cursos)\//.test(window.location.pathname.replace(/\\/g, '/'));
      var rootPrefix = nestedPage ? '../' : '';
      var coursesHref = nestedPage ? '../index.html#cursos' : '#cursos';
      var trainingHref = nestedPage ? '../index.html#capacitacoes' : '#capacitacoes';
      var menuId = 'courses-mega-menu';
      var triggerId = 'courses-menu-trigger';

      courseToggle = document.createElement('button');
      courseToggle.type = 'button';
      courseToggle.className = 'nav-drop-toggle';
      courseToggle.id = triggerId;
      courseToggle.setAttribute('aria-expanded', 'false');
      courseToggle.setAttribute('aria-controls', menuId);
      courseToggle.setAttribute('aria-haspopup', 'true');
      courseToggle.innerHTML = 'Cursos <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>';
      legacyCourseToggle.replaceWith(courseToggle);

      courseMenu.id = menuId;
      courseMenu.setAttribute('aria-labelledby', triggerId);
      courseMenu.innerHTML = [
        '<div class="nav-mega-heading">Cursos para motoristas</div>',
        '<div class="nav-mega-list nav-mega-courses">',
          '<a class="nav-mega-item" href="' + rootPrefix + 'cursos/mopp.html"><span class="nav-mega-icon" aria-hidden="true"><img src="' + rootPrefix + 'assets/img/icon-mopp.png" alt=""></span><span class="nav-mega-copy"><strong>MOPP</strong><small>Transporte de produtos perigosos.</small></span><span class="nav-mega-arrow" aria-hidden="true">&rarr;</span></a>',
          '<a class="nav-mega-item" href="' + rootPrefix + 'cursos/transporte-escolar.html"><span class="nav-mega-icon" aria-hidden="true"><img src="' + rootPrefix + 'assets/img/icon-escolar.png" alt=""></span><span class="nav-mega-copy"><strong>Transporte Escolar</strong><small>Transporte seguro de estudantes.</small></span><span class="nav-mega-arrow" aria-hidden="true">&rarr;</span></a>',
          '<a class="nav-mega-item" href="' + rootPrefix + 'cursos/transporte-coletivo.html"><span class="nav-mega-icon" aria-hidden="true"><img src="' + rootPrefix + 'assets/img/icon-passageiros.png" alt=""></span><span class="nav-mega-copy"><strong>Transporte Coletivo</strong><small>Transporte profissional de passageiros.</small></span><span class="nav-mega-arrow" aria-hidden="true">&rarr;</span></a>',
          '<a class="nav-mega-item" href="' + rootPrefix + 'cursos/transporte-emergencia.html"><span class="nav-mega-icon" aria-hidden="true"><img src="' + rootPrefix + 'assets/img/icon-emergencia.png" alt=""></span><span class="nav-mega-copy"><strong>Transporte de Emergência</strong><small>Condução de veículos de emergência.</small></span><span class="nav-mega-arrow" aria-hidden="true">&rarr;</span></a>',
          '<a class="nav-mega-item" href="' + rootPrefix + 'cursos/carga-indivisivel.html"><span class="nav-mega-icon" aria-hidden="true"><img src="' + rootPrefix + 'assets/img/icon-indivisivel.png" alt=""></span><span class="nav-mega-copy"><strong>Carga Indivisível</strong><small>Transporte de cargas especiais.</small></span><span class="nav-mega-arrow" aria-hidden="true">&rarr;</span></a>',
        '</div>',
        '<div class="nav-mega-divider" aria-hidden="true"></div>',
        '<div class="nav-mega-list nav-mega-secondary">',
          '<a class="nav-mega-item" href="' + trainingHref + '"><span class="nav-mega-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/><path d="M9 7h7M9 11h5"/></svg></span><span class="nav-mega-copy"><strong>Capacitações Complementares</strong><small>Cursos e qualificações complementares para sua carreira.</small></span><span class="nav-mega-arrow" aria-hidden="true">&rarr;</span></a>',
          '<a class="nav-mega-item" href="' + trainingHref + '"><span class="nav-mega-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 2.5 4 5.8v5.7c0 4.7 3.2 8.4 8 9.8 4.8-1.4 8-5.1 8-9.8V5.8L12 2.5Z"/><path d="M9 12h6M12 9v6"/></svg></span><span class="nav-mega-copy"><strong>Normas Regulamentadoras (NRs)</strong><small>Capacitações relacionadas às principais normas de segurança do trabalho.</small></span><span class="nav-mega-arrow" aria-hidden="true">&rarr;</span></a>',
        '</div>',
        '<div class="nav-mega-divider" aria-hidden="true"></div>',
        '<a class="nav-mega-item nav-mega-catalog" href="' + coursesHref + '"><span class="nav-mega-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M3 5.5A3.5 3.5 0 0 1 6.5 2H11v18H6.5A3.5 3.5 0 0 0 3 23V5.5Z"/><path d="M21 5.5A3.5 3.5 0 0 0 17.5 2H13v18h4.5A3.5 3.5 0 0 1 21 23V5.5Z"/></svg></span><span class="nav-mega-copy"><strong>Ver todos os cursos</strong><small>Acesse todos os cursos disponíveis na VIADUCA.</small></span><span class="nav-mega-arrow" aria-hidden="true">&rarr;</span></a>'
      ].join('');
    }

    function clearCourseCloseTimer() {
      if (!courseCloseTimer) return;
      window.clearTimeout(courseCloseTimer);
      courseCloseTimer = null;
    }

    function setCourseMenuOpen(open) {
      if (!courseDropdown || !courseToggle) return;
      clearCourseCloseTimer();
      courseDropdown.classList.toggle('is-open', open);
      courseToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    function closeCourseAccordion() {
      setCourseMenuOpen(false);
    }

    function closeMobileNav() {
      nav.classList.remove('open');
      document.body.classList.remove('nav-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Abrir menu');
      toggle.textContent = '☰';
      closeCourseAccordion();
    }

    if (courseToggle && courseMenu) {
      courseToggle.addEventListener('click', function () {
        setCourseMenuOpen(!courseDropdown.classList.contains('is-open'));
      });
      courseDropdown.addEventListener('mouseenter', function () {
        if (!navMobile.matches) setCourseMenuOpen(true);
      });
      courseDropdown.addEventListener('mouseleave', function () {
        if (navMobile.matches) return;
        clearCourseCloseTimer();
        courseCloseTimer = window.setTimeout(function () { setCourseMenuOpen(false); }, 190);
      });
      courseDropdown.addEventListener('focusout', function () {
        window.setTimeout(function () {
          if (!courseDropdown.contains(document.activeElement) && !courseDropdown.matches(':hover')) setCourseMenuOpen(false);
        }, 0);
      });
      document.addEventListener('click', function (event) {
        if (!courseDropdown.contains(event.target)) setCourseMenuOpen(false);
      });
    }

    toggle.addEventListener('click', function () {
      var isOpen = nav.classList.toggle('open');
      document.body.classList.toggle('nav-open', isOpen);
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      toggle.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
      toggle.textContent = isOpen ? '✕' : '☰';
      if (!isOpen) closeCourseAccordion();
    });
    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () { closeMobileNav(); });
    });
    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape') return;
      if (courseDropdown && courseDropdown.classList.contains('is-open')) {
        setCourseMenuOpen(false);
        courseToggle.focus();
        return;
      }
      if (nav.classList.contains('open')) {
        closeMobileNav();
        toggle.focus();
      }
    });
    function syncMobileNav() {
      closeCourseAccordion();
      if (!navMobile.matches) closeMobileNav();
    }
    if (navMobile.addEventListener) navMobile.addEventListener('change', syncMobileNav);
    else navMobile.addListener(syncMobileNav);
  }

  // ========== FAQ Accordion with ARIA ==========
  document.querySelectorAll('.faq-item').forEach(function (item) {
    var q = item.querySelector('.faq-q');
    if (!q) return;
    q.addEventListener('click', function () {
      var wasOpen = item.classList.contains('open');
      var list = item.closest('.faq-list');
      if (list) {
        list.querySelectorAll('.faq-item').forEach(function (i) {
          i.classList.remove('open');
          var btn = i.querySelector('.faq-q');
          var panel = i.querySelector('.faq-a');
          if (btn) btn.setAttribute('aria-expanded', 'false');
          if (panel) panel.setAttribute('aria-hidden', 'true');
        });
      }
      if (!wasOpen) {
        item.classList.add('open');
        q.setAttribute('aria-expanded', 'true');
        var activePanel = item.querySelector('.faq-a');
        if (activePanel) activePanel.setAttribute('aria-hidden', 'false');
      }
    });
  });

  // ========== Header Scroll Effect ==========
  var header = document.querySelector('.site-header');
  // WhatsApp flutuante: só aparece depois que o hero sai da tela, para nunca
  // cobrir os badges/CTAs do hero logo no carregamento da página.
  var waFloat = document.querySelector('.wa-float');
  var heroEl = document.querySelector('.hero, .page-hero');
  if (waFloat) waFloat.classList.add('js-managed');

  if (header || waFloat) {
    var scrollThreshold = 60;
    var ticking = false;
    var waRevealAt = heroEl ? Math.max(heroEl.offsetHeight - 120, 200) : 400;

    function updateHeader() {
      var scrollY = window.scrollY || window.pageYOffset;
      if (header) {
        if (scrollY > scrollThreshold) {
          header.classList.add('scrolled');
        } else {
          header.classList.remove('scrolled');
        }
      }
      if (waFloat) {
        waFloat.classList.toggle('visible', scrollY > waRevealAt);
      }
      ticking = false;
    }

    updateHeader();

    window.addEventListener('scroll', function () {
      if (!ticking) {
        requestAnimationFrame(updateHeader);
        ticking = true;
      }
    }, { passive: true });
  }

  // ========== Scroll Reveal (Intersection Observer) ==========
  var revealElements = document.querySelectorAll('.reveal');
  if (revealElements.length > 0 && 'IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px'
    });

    revealElements.forEach(function (el) {
      revealObserver.observe(el);
    });
  } else {
    // Fallback: show everything if no IntersectionObserver
    revealElements.forEach(function (el) {
      el.classList.add('visible');
    });
  }

  // ========== Counter Animation ==========
  var statNums = document.querySelectorAll('.stat-num[data-count]');
  if (statNums.length > 0 && 'IntersectionObserver' in window) {
    var counterObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    statNums.forEach(function (el) {
      counterObserver.observe(el);
    });
  }

  function animateCounter(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    if (isNaN(target)) return;

    var duration = 1500;
    var start = performance.now();

    function step(now) {
      var progress = Math.min((now - start) / duration, 1);
      // Ease-out cubic
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target);
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = target;
      }
    }

    requestAnimationFrame(step);
  }

  // ========== Smooth Scroll with Header Offset ==========
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var targetId = this.getAttribute('href');
      if (targetId === '#' || targetId.length < 2) return;

      var targetEl = document.querySelector(targetId);
      if (!targetEl) return;

      e.preventDefault();
      var headerHeight = header ? header.offsetHeight : 0;
      var targetPos = targetEl.getBoundingClientRect().top + window.pageYOffset - headerHeight - 16;

      window.scrollTo({
        top: targetPos,
        behavior: 'smooth'
      });

      // Update URL without jumping
      history.pushState(null, null, targetId);
    });
  });

  // ========== Isometric Scene — Entry + Parallax ==========
  var isoScene = document.querySelector('.iso-scene');
  if (isoScene) {
    var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)');

    // Trigger entry animations after first paint
    if (!prefersReduced.matches) {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          isoScene.classList.add('iso-active');
        });
      });
    } else {
      // prefers-reduced-motion: show everything immediately
      isoScene.classList.add('iso-active');
    }

    // Mouse parallax — desktop only, subtle depth effect
    var isDesktop = window.matchMedia('(min-width: 901px)');
    if (isDesktop.matches && !prefersReduced.matches) {
      var heroSection = isoScene.closest('.hero');
      var parallaxLayers = isoScene.querySelectorAll('[data-parallax]');
      var parallaxTicking = false;

      if (heroSection && parallaxLayers.length > 0) {
        heroSection.addEventListener('mousemove', function (e) {
          if (parallaxTicking) return;
          parallaxTicking = true;

          requestAnimationFrame(function () {
            var rect = heroSection.getBoundingClientRect();
            var x = (e.clientX - rect.left) / rect.width - 0.5;
            var y = (e.clientY - rect.top) / rect.height - 0.5;

            for (var i = 0; i < parallaxLayers.length; i++) {
              var depth = parseFloat(parallaxLayers[i].getAttribute('data-parallax')) || 0;
              var moveX = x * depth;
              var moveY = y * depth;
              parallaxLayers[i].style.transform = 'translate(' + moveX + 'px,' + moveY + 'px)';
            }
            parallaxTicking = false;
          });
        }, { passive: true });

        heroSection.addEventListener('mouseleave', function () {
          for (var i = 0; i < parallaxLayers.length; i++) {
            parallaxLayers[i].style.transform = '';
          }
        });
      }
    }
  }

  // ========== Nossos Cursos — Automotive Showroom Carousel ==========
  var courseShowroom = document.querySelector('.course-showroom');
  if (courseShowroom) {
    var courseSlides = Array.prototype.slice.call(courseShowroom.querySelectorAll('[data-course-slide]'));
    var courseDots = Array.prototype.slice.call(courseShowroom.querySelectorAll('[data-course-dot]'));
    var courseTabs = Array.prototype.slice.call(courseShowroom.querySelectorAll('[data-course-tab]'));
    var courseStage = courseShowroom.querySelector('.course-showroom-stage');
    var coursePrev = courseShowroom.querySelector('.showroom-prev');
    var courseNext = courseShowroom.querySelector('.showroom-next');
    var courseCount = courseShowroom.querySelector('.showroom-count');
    var courseReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var courseActiveIndex = 0;
    var courseIsTransitioning = false;
    var courseIsVisible = false;
    var courseIsHovered = false;
    var courseHasFocus = false;
    var courseIsDragging = false;
    var coursePointerStart = 0;
    var coursePointerDelta = 0;
    var courseTimer = null;
    var courseResumeAt = 0;
    var courseTransitionTimer = null;
    var courseAutoplayDelay = 4600;
    var courseInteractionDelay = 6500;

    function courseModulo(value) {
      return (value + courseSlides.length) % courseSlides.length;
    }

    function preloadCourseSlide(index) {
      var image = courseSlides[courseModulo(index)].querySelector('img');
      if (image && !image.complete) {
        var preload = new Image();
        preload.src = image.currentSrc || image.src;
      }
    }

    function renderCourseShowroom() {
      courseSlides.forEach(function (slide, index) {
        var distance = courseModulo(index - courseActiveIndex);
        var isActive = distance === 0;
        slide.classList.remove('is-active', 'is-prev', 'is-next');
        if (isActive) slide.classList.add('is-active');
        else if (distance === 1) slide.classList.add('is-next');
        else if (distance === courseSlides.length - 1) slide.classList.add('is-prev');
        slide.setAttribute('aria-hidden', isActive ? 'false' : 'true');
        slide.inert = !isActive;
      });

      courseDots.forEach(function (dot, index) {
        var active = index === courseActiveIndex;
        dot.classList.toggle('is-active', active);
        if (active) dot.setAttribute('aria-current', 'true');
        else dot.removeAttribute('aria-current');
      });

      courseTabs.forEach(function (tab, index) {
        var active = index === courseActiveIndex;
        tab.classList.toggle('is-active', active);
        if (active) {
          tab.setAttribute('aria-current', 'true');
          if (courseIsVisible && tab.parentElement.scrollWidth > tab.parentElement.clientWidth) {
            tab.parentElement.scrollTo({
              left: tab.offsetLeft - (tab.parentElement.clientWidth - tab.offsetWidth) / 2,
              behavior: courseReducedMotion ? 'auto' : 'smooth'
            });
          }
        } else {
          tab.removeAttribute('aria-current');
        }
      });

      courseCount.textContent = String(courseActiveIndex + 1).padStart(2, '0') + ' / ' + String(courseSlides.length).padStart(2, '0');
      preloadCourseSlide(courseActiveIndex + 1);
    }

    function clearCourseTimer() {
      window.clearTimeout(courseTimer);
      courseTimer = null;
    }

    function courseCanAutoplay() {
      return !courseReducedMotion && courseIsVisible && !document.hidden && !courseIsHovered && !courseHasFocus && !courseIsDragging && !courseIsTransitioning;
    }

    function scheduleCourseAutoplay() {
      clearCourseTimer();
      if (!courseCanAutoplay()) return;
      var wait = Math.max(courseAutoplayDelay, courseResumeAt - Date.now());
      courseTimer = window.setTimeout(function () {
        if (Date.now() < courseResumeAt) {
          scheduleCourseAutoplay();
          return;
        }
        moveCourseShowroom(courseActiveIndex + 1, false);
      }, wait);
    }

    function pauseCourseAfterInteraction() {
      courseResumeAt = Date.now() + courseInteractionDelay;
      clearCourseTimer();
    }

    function moveCourseShowroom(targetIndex, interacted) {
      var nextIndex = courseModulo(targetIndex);
      if (interacted) pauseCourseAfterInteraction();
      if (nextIndex === courseActiveIndex || courseIsTransitioning) {
        scheduleCourseAutoplay();
        return;
      }
      clearCourseTimer();
      courseIsTransitioning = true;
      courseActiveIndex = nextIndex;
      renderCourseShowroom();
      window.clearTimeout(courseTransitionTimer);
      courseTransitionTimer = window.setTimeout(function () {
        courseIsTransitioning = false;
        scheduleCourseAutoplay();
      }, courseReducedMotion ? 220 : 850);
    }

    coursePrev.addEventListener('click', function () { moveCourseShowroom(courseActiveIndex - 1, true); });
    courseNext.addEventListener('click', function () { moveCourseShowroom(courseActiveIndex + 1, true); });
    courseDots.forEach(function (dot, index) { dot.addEventListener('click', function () { moveCourseShowroom(index, true); }); });
    courseTabs.forEach(function (tab, index) { tab.addEventListener('click', function () { moveCourseShowroom(index, true); }); });

    courseShowroom.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowLeft') { event.preventDefault(); moveCourseShowroom(courseActiveIndex - 1, true); }
      if (event.key === 'ArrowRight') { event.preventDefault(); moveCourseShowroom(courseActiveIndex + 1, true); }
    });
    courseShowroom.addEventListener('mouseenter', function () { courseIsHovered = true; clearCourseTimer(); });
    courseShowroom.addEventListener('mouseleave', function () { courseIsHovered = false; scheduleCourseAutoplay(); });
    courseShowroom.addEventListener('focusin', function () { courseHasFocus = true; clearCourseTimer(); });
    courseShowroom.addEventListener('focusout', function () {
      window.setTimeout(function () {
        courseHasFocus = courseShowroom.contains(document.activeElement);
        if (!courseHasFocus) scheduleCourseAutoplay();
      }, 0);
    });

    courseStage.addEventListener('pointerdown', function (event) {
      if (event.button !== undefined && event.button !== 0) return;
      if (event.target.closest('button, a')) return;
      courseIsDragging = true;
      coursePointerStart = event.clientX;
      coursePointerDelta = 0;
      courseStage.classList.add('is-dragging');
      pauseCourseAfterInteraction();
      if (courseStage.setPointerCapture) courseStage.setPointerCapture(event.pointerId);
    });
    courseStage.addEventListener('pointermove', function (event) {
      if (!courseIsDragging) return;
      coursePointerDelta = event.clientX - coursePointerStart;
    });
    var courseSuppressClick = false;
    function finishCourseDrag(event) {
      if (!courseIsDragging) return;
      courseIsDragging = false;
      courseStage.classList.remove('is-dragging');
      if (courseStage.releasePointerCapture && courseStage.hasPointerCapture && courseStage.hasPointerCapture(event.pointerId)) courseStage.releasePointerCapture(event.pointerId);
      if (Math.abs(coursePointerDelta) >= 45) {
        courseSuppressClick = true;
        moveCourseShowroom(courseActiveIndex + (coursePointerDelta < 0 ? 1 : -1), true);
        window.setTimeout(function () { courseSuppressClick = false; }, 0);
      }
      else scheduleCourseAutoplay();
      coursePointerDelta = 0;
    }
    courseStage.addEventListener('pointerup', finishCourseDrag);
    courseStage.addEventListener('pointercancel', finishCourseDrag);
    courseStage.addEventListener('click', function (event) {
      if (courseSuppressClick) { event.preventDefault(); event.stopPropagation(); }
    }, true);

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        courseIsVisible = entries[0].isIntersecting;
        if (courseIsVisible) scheduleCourseAutoplay();
        else clearCourseTimer();
      }, { threshold: .18 }).observe(courseShowroom);
    } else {
      courseIsVisible = true;
    }
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) clearCourseTimer();
      else scheduleCourseAutoplay();
    });

    renderCourseShowroom();
    scheduleCourseAutoplay();
  }
});
