/* ---------------------------------------------------------
   Pedido de cópia autografada
   Mesmo caminho do formulário de contato: valida no navegador e envia ao
   Web3Forms, que entrega por e-mail. Nada é gravado — aqui não há servidor
   nem banco.

   O comprovante do Pix NÃO vem por aqui: anexo é recurso de plano pago do
   Web3Forms, e no plano gratuito o arquivo seria descartado sem aviso. Quem
   compra manda o comprovante por e-mail comum, para contato@inovai.com.br.
   --------------------------------------------------------- */
(function () {
  'use strict';

  var form = document.getElementById('formLivro');
  if (!form) return;

  var btn = document.getElementById('btnPedido');
  var aviso = document.getElementById('formLivroAviso');
  var ok = document.getElementById('formLivroOk');

  /* Telefone brasileiro, formatado enquanto digita: (84) 99999-9999 */
  function mascaraTelefone(valor) {
    var d = valor.replace(/\D/g, '').slice(0, 11);
    if (d.length <= 2) return d.length ? '(' + d : '';
    var corpo = d.slice(2);
    var corte = d.length > 10 ? 5 : 4; // celular tem 9 dígitos, fixo tem 8
    if (corpo.length <= corte) return '(' + d.slice(0, 2) + ') ' + corpo;
    return '(' + d.slice(0, 2) + ') ' + corpo.slice(0, corte) + '-' + corpo.slice(corte);
  }

  function mascaraCep(valor) {
    var d = valor.replace(/\D/g, '').slice(0, 8);
    return d.length > 5 ? d.slice(0, 5) + '-' + d.slice(5) : d;
  }

  [['whatsapp', mascaraTelefone], ['cep', mascaraCep]].forEach(function (par) {
    var campo = document.getElementById(par[0]);
    campo.addEventListener('input', function () {
      var fim = campo.selectionStart === campo.value.length;
      campo.value = par[1](campo.value);
      if (fim) campo.setSelectionRange(campo.value.length, campo.value.length);
    });
  });


  /* Nome legível do campo, tirado do próprio <label> — é o que aparece na
     lista do resumo. */
  function rotuloDe(campo) {
    var lab = form.querySelector('label[for="' + campo.id + '"]');
    return lab ? lab.textContent.replace('*', '').trim() : campo.name;
  }

  function piscar(campo) {
    var caixa = campo.closest('.field');
    if (!caixa) return;
    caixa.classList.remove('field--erro');
    void caixa.offsetWidth;            // reinicia a animação
    caixa.classList.add('field--erro');
  }

  /* Resumo no topo do formulário. Sem ele, quem errou dois campos distantes
     um do outro só descobre o segundo depois de corrigir o primeiro. */
  function mostrarResumo(erros) {
    var caixa = form.querySelector('.form__resumo');
    if (!caixa) {
      caixa = document.createElement('div');
      caixa.className = 'form__resumo';
      caixa.setAttribute('role', 'alert');
      caixa.tabIndex = -1;
      form.insertBefore(caixa, form.firstChild);
    }
    caixa.innerHTML = '';

    var titulo = document.createElement('strong');
    titulo.textContent = erros.length === 1
      ? 'Falta preencher 1 campo:'
      : 'Faltam preencher ' + erros.length + ' campos:';
    caixa.appendChild(titulo);

    var lista = document.createElement('ul');
    erros.forEach(function (campo) {
      var item = document.createElement('li');
      var link = document.createElement('button');
      link.type = 'button';
      link.textContent = rotuloDe(campo);
      link.addEventListener('click', function () {
        campo.focus();
        campo.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      item.appendChild(link);
      lista.appendChild(item);
    });
    caixa.appendChild(lista);
  }

  function limparResumo() {
    var caixa = form.querySelector('.form__resumo');
    if (caixa) caixa.remove();
  }

  function mostrarErro(campo, texto) {
    var alvo = form.querySelector('[data-erro-de="' + campo.name + '"]');
    campo.setAttribute('aria-invalid', 'true');
    if (alvo) { alvo.textContent = texto; alvo.hidden = false; }
    piscar(campo);
  }

  function limparErro(campo) {
    var alvo = form.querySelector('[data-erro-de="' + campo.name + '"]');
    campo.removeAttribute('aria-invalid');
    if (alvo) alvo.hidden = true;
    var caixa = campo.closest('.field');
    if (caixa) caixa.classList.remove('field--erro');
    if (!form.querySelectorAll('[aria-invalid="true"]').length) limparResumo();
  }

  form.addEventListener('input', function (e) {
    if (e.target.name) limparErro(e.target);
  });
  form.addEventListener('change', function (e) {
    if (e.target.name) limparErro(e.target);
  });

  function validar() {
    var erros = [];

    [['nome', 'Informe o nome de quem recebe.'],
     ['endereco', 'Informe a rua ou avenida.'],
     ['numero', 'Informe o número.'],
     ['bairro', 'Informe o bairro.'],
     ['cidade', 'Informe a cidade.'],
     ['uf', 'Escolha o estado.']
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

    var cep = form.elements.cep;
    if (cep.value.replace(/\D/g, '').length !== 8) {
      mostrarErro(cep, 'CEP incompleto — são 8 dígitos.');
      erros.push(cep);
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
      mostrarResumo(erros);
      /* Foco sem rolagem própria, senão o campo para colado no topo, por baixo
         da barra fixa. A rolagem é nossa, que deixa o campo no meio da tela. */
      erros[0].focus({ preventScroll: true });
      erros[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    limparResumo();

    /* FormData pega os campos direto do formulário. O checkbox anti-robô só
       entra quando marcado — que é justamente o sinal que o Web3Forms espera
       para descartar o envio. */
    var dados = new FormData(form);

    btn.disabled = true;
    btn.textContent = 'Enviando…';

    fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
      body: dados
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
        aviso.textContent = 'Não foi possível enviar agora. Se preferir, fale com ' +
          'o autor pelo telefone (84) 3211-3414.';
        aviso.hidden = false;
        btn.disabled = false;
        btn.textContent = 'Enviar pedido';
      });
  });
})();

/* ---------------------------------------------------------
   Pix copia e cola
   O QR resolve no celular; no computador, quem paga precisa do código.
   O valor de R$ 84,00 já vem embutido nele (campo 54 do BR Code).
   --------------------------------------------------------- */
(function () {
  if (!navigator.clipboard) return;

  function copiador(id, campo, confirmacao) {
    var botao = document.getElementById(id);
    if (!botao) return;

    var rotulo = botao.textContent.trim();

    function avisar(texto) {
      botao.textContent = texto;
      setTimeout(function () { botao.textContent = rotulo; }, 2600);
    }

    botao.addEventListener('click', function () {
      navigator.clipboard.writeText(botao.dataset[campo])
        .then(function () { avisar(confirmacao); })
        /* A área de transferência pode ser negada pelo navegador. Em vez de o
           botão não fazer nada, o texto fica selecionado para copiar à mão. */
        .catch(function () {
          var alvo = botao.previousElementSibling;
          if (alvo) {
            var faixa = document.createRange();
            faixa.selectNodeContents(alvo);
            var selecao = window.getSelection();
            selecao.removeAllRanges();
            selecao.addRange(faixa);
          }
          avisar('Copie com Ctrl+C');
        });
    });
  }

  copiador('btnCopiarPix', 'pix', 'Código copiado');
  copiador('btnCopiarEmail', 'email', 'E-mail copiado');
})();
