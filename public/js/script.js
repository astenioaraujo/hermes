// Astênio Araújo / Inovai — comportamentos de interface

(function () {
  'use strict';

  /* ---------- A página sempre abre no topo ----------
     Duas coisas faziam o site abrir no meio ao recarregar: o navegador
     restaura sozinho a posição de rolagem anterior, e o clique no menu deixa
     uma âncora (#consultoria) na URL, que o navegador persegue no reload. */

  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }

  if (window.location.hash) {
    // tira a âncora da URL sem recarregar nem criar entrada no histórico
    history.replaceState(null, '', window.location.pathname + window.location.search);
  }

  window.scrollTo(0, 0);

  /* O 'load' só dispara depois das imagens, e até lá a pessoa já pode ter
     clicado no menu ou rolado. Forçar o topo ali cegamente a arrancaria do
     lugar, então só reforçamos enquanto ninguém tiver mexido na página. */
  var mexeu = false;
  function marcarInteracao() { mexeu = true; }
  ['wheel', 'touchstart', 'keydown', 'click'].forEach(function (evento) {
    window.addEventListener(evento, marcarInteracao, { passive: true, once: true });
  });

  window.addEventListener('load', function () {
    if (!mexeu && window.scrollY < 200) window.scrollTo(0, 0);
  });

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

  /* Links internos rolam suavemente, mas sem gravar a âncora na URL —
     assim um recarregamento depois continua abrindo no topo. */
  document.addEventListener('click', function (e) {
    var link = e.target.closest ? e.target.closest('a[href^="#"]') : null;
    if (!link) return;
    var destino = document.querySelector(link.getAttribute('href'));
    if (!destino) return;
    e.preventDefault();
    destino.scrollIntoView({
      behavior: reduced ? 'auto' : 'smooth',
      block: 'start'
    });
  });

  document.getElementById('ano').textContent = new Date().getFullYear();

  /* ---------- Carrossel de produtos ---------- */

  var trilha = document.getElementById('carrosselTrilha');
  if (!trilha) return;

  var slides = trilha.children;
  var caixaPontos = document.getElementById('carrosselPontos');
  var pontos = caixaPontos.children;
  var setaAnterior = document.getElementById('carrosselAnterior');
  var setaProxima = document.getElementById('carrosselProximo');
  var atual = 0;
  var total = slides.length;

  /* Com um produto só não há o que navegar: some com setas e pontos.
     Ao descomentar o próximo slide no HTML, os controles voltam sozinhos. */
  var navegavel = total > 1;
  setaAnterior.hidden = !navegavel;
  setaProxima.hidden = !navegavel;
  caixaPontos.hidden = !navegavel;

  /* A contagem no rótulo acompanha quantos slides existem de fato */
  for (var r = 0; r < total; r++) {
    var titulo = slides[r].querySelector('h3');
    slides[r].setAttribute('aria-label',
      (r + 1) + ' de ' + total + (titulo ? ': ' + titulo.textContent : ''));
  }

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

  setaProxima.addEventListener('click', function () { mostrar(atual + 1); parar(); });
  setaAnterior.addEventListener('click', function () { mostrar(atual - 1); parar(); });

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
  if (!reduced && navegavel) {
    relogio = setInterval(function () { mostrar(atual + 1); }, 7000);
    var palco = trilha.parentNode;
    palco.addEventListener('mouseenter', parar);
  }

  mostrar(0);
})();

/* ---------------------------------------------------------
   Formulário de contato
   Valida no navegador e envia ao Web3Forms, que entrega por e-mail.
   A validação daqui é conveniência: quem posta direto no endpoint
   passa por cima dela, e o Web3Forms é quem barra spam de verdade.
   --------------------------------------------------------- */
(function () {
  var form = document.getElementById('formContato');
  if (!form) return;

  var btn = document.getElementById('btnEnviar');
  var aviso = document.getElementById('formAviso');
  var ok = document.getElementById('formOk');

  /* Telefone brasileiro, formatado enquanto digita: (84) 99999-9999 */
  function mascaraTelefone(valor) {
    var d = valor.replace(/\D/g, '').slice(0, 11);
    if (d.length <= 2) return d.length ? '(' + d : '';
    var corpo = d.slice(2);
    var corte = d.length > 10 ? 5 : 4; // celular tem 9 dígitos, fixo tem 8
    if (corpo.length <= corte) return '(' + d.slice(0, 2) + ') ' + corpo;
    return '(' + d.slice(0, 2) + ') ' + corpo.slice(0, corte) + '-' + corpo.slice(corte);
  }

  ['telefone', 'whatsapp'].forEach(function (id) {
    var campo = document.getElementById(id);
    campo.addEventListener('input', function () {
      var fim = campo.selectionStart === campo.value.length;
      campo.value = mascaraTelefone(campo.value);
      if (fim) campo.setSelectionRange(campo.value.length, campo.value.length);
    });
  });

  function mostrarErro(campo, texto) {
    var alvo = form.querySelector('[data-erro-de="' + campo.name + '"]');
    campo.setAttribute('aria-invalid', 'true');
    if (alvo) { alvo.textContent = texto; alvo.hidden = false; }
  }

  function limparErro(campo) {
    var alvo = form.querySelector('[data-erro-de="' + campo.name + '"]');
    campo.removeAttribute('aria-invalid');
    if (alvo) alvo.hidden = true;
  }

  form.addEventListener('input', function (e) {
    if (e.target.name) limparErro(e.target);
  });

  function validar() {
    var erros = [];

    [['nome', 'Informe seu nome.'],
     ['empresa', 'Informe o nome da empresa.'],
     ['descricao', 'Conte brevemente o que você precisa.']
    ].forEach(function (par) {
      var campo = form.elements[par[0]];
      if (!campo.value.trim()) { mostrarErro(campo, par[1]); erros.push(campo); }
    });

    var wpp = form.elements.whatsapp;
    var digitos = wpp.value.replace(/\D/g, '');
    if (!digitos) {
      mostrarErro(wpp, 'Informe seu WhatsApp com DDD.');
      erros.push(wpp);
    } else if (digitos.length < 10 || digitos.length > 11) {
      mostrarErro(wpp, 'Número incompleto — use DDD + número.');
      erros.push(wpp);
    }

    var tel = form.elements.telefone;
    var telDigitos = tel.value.replace(/\D/g, '');
    if (telDigitos && (telDigitos.length < 10 || telDigitos.length > 11)) {
      mostrarErro(tel, 'Número incompleto — use DDD + número.');
      erros.push(tel);
    }

    var email = form.elements.email;
    if (email.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
      mostrarErro(email, 'E-mail parece incompleto.');
      erros.push(email);
    }

    return erros;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    aviso.hidden = true;

    var erros = validar();
    if (erros.length) {
      erros[0].focus();
      return;
    }

    /* Checkbox vai como booleano: é a armadilha de robô que o Web3Forms lê. */
    var dados = {};
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name) return;
      dados[el.name] = el.type === 'checkbox' ? el.checked : el.value.trim();
    });

    btn.disabled = true;
    btn.textContent = 'Enviando…';

    fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(dados)
    })
      .then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (corpo) {
          return { ok: r.ok && corpo.success !== false, corpo: corpo };
        });
      })
      .then(function (res) {
        if (!res.ok) throw new Error(res.corpo.message || 'Não foi possível enviar agora.');
        form.hidden = true;
        ok.hidden = false;
        ok.scrollIntoView({ behavior: 'smooth', block: 'center' });
      })
      .catch(function () {
        aviso.textContent = 'Não foi possível enviar agora. Se preferir, ligue para ' +
          '(84) 3211-3414 ou fale no Telegram @astenioaraujo.';
        aviso.hidden = false;
        btn.disabled = false;
        btn.textContent = 'Enviar solicitação';
      });
  });
})();
