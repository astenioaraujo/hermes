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

  /* ---------- Formulário de contato ---------- */

  var form = document.getElementById('formContato');
  if (!form) return;

  var btn = document.getElementById('btnEnviar');
  var aviso = document.getElementById('formAviso');
  var ok = document.getElementById('formOk');
  var abertoEm = Date.now();

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

    var dados = {};
    Array.prototype.forEach.call(form.elements, function (el) {
      if (el.name) dados[el.name] = el.value.trim();
    });
    dados.segundos_na_pagina = Math.round((Date.now() - abertoEm) / 1000);

    btn.disabled = true;
    btn.textContent = 'Enviando…';

    fetch('/api/contato', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    })
      .then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (corpo) {
          return { ok: r.ok, corpo: corpo };
        });
      })
      .then(function (res) {
        if (!res.ok) throw new Error(res.corpo.erro || 'Não foi possível enviar agora.');
        form.hidden = true;
        ok.hidden = false;
        ok.scrollIntoView({ behavior: 'smooth', block: 'center' });
      })
      .catch(function (err) {
        aviso.textContent = err.message +
          ' Se preferir, fale direto pelo WhatsApp (84) 3211-3414 ou contato@inovai.com.br.';
        aviso.hidden = false;
        btn.disabled = false;
        btn.textContent = 'Enviar solicitação';
      });
  });
})();
