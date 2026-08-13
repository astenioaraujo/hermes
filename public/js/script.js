// Astênio Araújo / Inovai — comportamentos de interface

(function () {
  'use strict';

  var nav = document.getElementById('nav');
  var toggle = document.getElementById('navToggle');
  var menu = document.getElementById('navMenu');

  /* Borda da barra aparece assim que a página sai do topo */
  var onScroll = function () {
    nav.classList.toggle('is-stuck', window.scrollY > 8);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Menu mobile */
  toggle.addEventListener('click', function () {
    var open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!open));
    toggle.setAttribute('aria-label', open ? 'Abrir menu' : 'Fechar menu');
    menu.hidden = open;
  });

  menu.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') {
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Abrir menu');
      menu.hidden = true;
    }
  });

  /* Entrada dos blocos conforme entram na tela */
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var items = document.querySelectorAll('.reveal');

  if (reduced || !('IntersectionObserver' in window)) {
    items.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        // escalonamento leve entre irmãos, no estilo das páginas de produto
        var siblings = Array.prototype.slice.call(entry.target.parentNode.children);
        var i = siblings.indexOf(entry.target);
        entry.target.style.transitionDelay = Math.min(i, 5) * 70 + 'ms';
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    items.forEach(function (el) { io.observe(el); });
  }

  document.getElementById('ano').textContent = new Date().getFullYear();

  /* ---------- Carrossel de produtos ---------- */

  var trilha = document.getElementById('carrosselTrilha');
  if (!trilha) return;

  var slides = trilha.children;
  var pontos = document.getElementById('carrosselPontos').children;
  var atual = 0;
  var total = slides.length;

  function mostrar(i) {
    atual = (i + total) % total;
    trilha.style.transform = 'translateX(' + (-atual * 100) + '%)';
    for (var p = 0; p < pontos.length; p++) {
      pontos[p].setAttribute('aria-selected', String(p === atual));
    }
    // Só o slide visível recebe foco na navegação por teclado
    for (var s = 0; s < total; s++) {
      slides[s].setAttribute('aria-hidden', String(s !== atual));
    }
  }

  document.getElementById('carrosselProximo')
    .addEventListener('click', function () { mostrar(atual + 1); parar(); });
  document.getElementById('carrosselAnterior')
    .addEventListener('click', function () { mostrar(atual - 1); parar(); });

  for (var i = 0; i < pontos.length; i++) {
    (function (indice) {
      pontos[indice].addEventListener('click', function () { mostrar(indice); parar(); });
    })(i);
  }

  /* Setas do teclado quando o carrossel está em foco */
  trilha.parentNode.parentNode.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') { mostrar(atual + 1); parar(); }
    if (e.key === 'ArrowLeft') { mostrar(atual - 1); parar(); }
  });

  /* Arrastar com o dedo */
  var inicioX = null;
  trilha.addEventListener('touchstart', function (e) {
    inicioX = e.touches[0].clientX;
  }, { passive: true });
  trilha.addEventListener('touchend', function (e) {
    if (inicioX === null) return;
    var distancia = e.changedTouches[0].clientX - inicioX;
    if (Math.abs(distancia) > 45) { mostrar(atual + (distancia < 0 ? 1 : -1)); parar(); }
    inicioX = null;
  });

  /* Avanço automático, interrompido assim que a pessoa assume o controle */
  var relogio = null;
  function parar() {
    if (relogio) { clearInterval(relogio); relogio = null; }
  }
  if (!reduced) {
    relogio = setInterval(function () { mostrar(atual + 1); }, 7000);
    var palco = trilha.parentNode;
    palco.addEventListener('mouseenter', parar);
  }

  mostrar(0);
})();
