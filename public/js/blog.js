// Blog da Inovai — lista, busca e filtro por palavra-chave (blog.html)

(function () {
  'use strict';

  var materias = (window.MATERIAS || []).slice();
  var lista = document.getElementById('blogLista');
  var campo = document.getElementById('blogBusca');
  var caixaChaves = document.getElementById('blogChaves');
  var vazio = document.getElementById('blogVazio');
  var contagem = document.getElementById('blogContagem');
  if (!lista) return;

  // mais nova primeiro; mesmo dia, a de número maior
  materias.sort(function (a, b) {
    if (a.data !== b.data) return a.data < b.data ? 1 : -1;
    return b.numero - a.numero;
  });

  var MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho',
    'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

  function dataExtenso(iso) {
    var p = iso.split('-');
    return Number(p[2]) + ' de ' + MESES[Number(p[1]) - 1] + ' de ' + p[0];
  }

  function numero3(n) { return ('00' + n).slice(-3); }

  // sem acento e em minúsculas: "gestão" acha "gestao" e vice-versa
  function normalizar(texto) {
    return String(texto || '').toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
  }

  function escapar(texto) {
    return String(texto).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  materias.forEach(function (m) {
    m._busca = normalizar([
      m.titulo, m.resumo, (m.chaves || []).join(' '), dataExtenso(m.data)
    ].join(' '));
  });

  /* ---------- Palavras-chave, das mais usadas às menos ---------- */
  var uso = {};
  materias.forEach(function (m) {
    (m.chaves || []).forEach(function (c) { uso[c] = (uso[c] || 0) + 1; });
  });
  var chaves = Object.keys(uso).sort(function (a, b) {
    return uso[b] - uso[a] || a.localeCompare(b, 'pt-BR');
  });

  var chaveAtiva = '';

  if (chaves.length) {
    caixaChaves.innerHTML = chaves.map(function (c) {
      return '<button type="button" class="blog-chave" data-chave="' + escapar(c) + '">' +
        escapar(c) + ' <span>' + uso[c] + '</span></button>';
    }).join('');
    caixaChaves.hidden = false;
  }

  caixaChaves.addEventListener('click', function (e) {
    var botao = e.target.closest('.blog-chave');
    if (!botao) return;
    var c = botao.getAttribute('data-chave');
    chaveAtiva = chaveAtiva === c ? '' : c;
    desenhar();
  });

  /* ---------- Lista ---------- */
  function cartao(m) {
    var chavesHtml = (m.chaves || []).map(function (c) {
      return '<span>' + escapar(c) + '</span>';
    }).join('');
    return '<li class="blog-item">' +
      '<a href="blog/' + encodeURIComponent(m.slug) + '.html">' +
        '<p class="blog-item__meta">Nº ' + numero3(m.numero) + ' · ' +
          '<time datetime="' + m.data + '">' + dataExtenso(m.data) + '</time></p>' +
        '<h2 class="blog-item__titulo">' + escapar(m.titulo) + '</h2>' +
        (m.resumo ? '<p class="blog-item__resumo">' + escapar(m.resumo) + '</p>' : '') +
        (chavesHtml ? '<p class="blog-item__chaves">' + chavesHtml + '</p>' : '') +
        '<span class="link">Ler a matéria <span>→</span></span>' +
      '</a></li>';
  }

  function desenhar() {
    var consulta = normalizar(campo.value);
    /* "7", "007", "nº 7", "n7": busca exata pelo número — senão o "7" casaria
       com qualquer data que tenha 7. Quatro dígitos é ano, vai para o texto. */
    var porNumero = consulta.match(/^(?:n[º°o.]?\s*)?(\d{1,3})$/);
    var termos = porNumero ? [] : consulta.split(/\s+/).filter(Boolean);
    var achadas = materias.filter(function (m) {
      if (chaveAtiva && (m.chaves || []).indexOf(chaveAtiva) < 0) return false;
      if (porNumero) return m.numero === Number(porNumero[1]);
      // todos os termos precisam aparecer (E, não OU)
      return termos.every(function (t) { return m._busca.indexOf(t) >= 0; });
    });

    Array.prototype.forEach.call(caixaChaves.children, function (b) {
      var ativa = b.getAttribute('data-chave') === chaveAtiva;
      b.classList.toggle('is-ativa', ativa);
      b.setAttribute('aria-pressed', String(ativa));
    });

    lista.innerHTML = achadas.map(cartao).join('');

    var filtrando = consulta || chaveAtiva;
    if (!materias.length) {
      vazio.textContent = 'As primeiras matérias estão a caminho.';
    } else if (!achadas.length) {
      vazio.textContent = 'Nenhuma matéria encontrada para essa busca.';
    }
    vazio.hidden = achadas.length > 0;
    contagem.textContent = !materias.length ? '' : filtrando
      ? achadas.length + ' de ' + materias.length + (materias.length === 1 ? ' matéria' : ' matérias')
      : materias.length + (materias.length === 1 ? ' matéria publicada' : ' matérias publicadas');

    // a busca fica na URL, para o link poder ser enviado a alguém
    var q = [];
    if (campo.value.trim()) q.push('busca=' + encodeURIComponent(campo.value.trim()));
    if (chaveAtiva) q.push('chave=' + encodeURIComponent(chaveAtiva));
    history.replaceState(null, '', window.location.pathname + (q.length ? '?' + q.join('&') : ''));
  }

  /* chegada por link: blog.html?chave=gestao (vem das matérias) ou ?busca=... */
  var params = new URLSearchParams(window.location.search);
  if (params.get('busca')) campo.value = params.get('busca');
  if (params.get('chave') && uso[params.get('chave')]) chaveAtiva = params.get('chave');

  if (!materias.length) {
    campo.disabled = true;
    campo.placeholder = 'A busca aparece com as primeiras matérias';
  }

  campo.addEventListener('input', desenhar);
  desenhar();
})();
