# Hermes

Site institucional / plataforma de produtos de varejo. Contexto para o Claude Code.

## O que é

Hermes é o projeto separado do MATRX — landing pages e softwares de varejo com
cadastro de usuário avulso (não multiempresa como o MATRX). Site novo, hoje
estático, com produtos Flask entrando aos poucos.

## Isolamento em relação ao MATRX

- **Banco: decisão adiada (10/08/2026).** A homepage e as landing pages são
  estáticas e não precisam de banco. Nada de Supabase no Hermes até o primeiro
  serviço com dados aparecer — aí se decide entre projeto Supabase próprio
  (+US$ 10/mês, isolamento real, libera chave anon no navegador) e um schema
  `hermes` no banco do MATRX (sem custo, mas só se todo acesso passar pelo
  Flask com service role e o schema ficar fora do `public` exposto pela API).
- Se vier projeto próprio: URL e chaves distintas, nunca reaproveitar as
  credenciais do MATRX aqui.
- **Deploy separado.** Render, Project `HERMES` (o MATRX vive no Project
  `MATRX`, mesmo Workspace). Project no Render não custa nada — é agrupamento;
  quem custa é o serviço. Hoje o site é **Static Site (grátis)**, publicando a
  pasta `public/`; Web Service pago só quando houver back-end de verdade.
- Motivo: aqui o navegador fala direto com a API do Supabase usando a chave
  anon — ao contrário do MATRX, onde tudo passa pelo servidor Flask com a
  service role key. RLS aqui é a fronteira de segurança de verdade, não uma
  rede de proteção.

## Regra para qualquer tabela nova aqui

Toda tabela precisa de RLS habilitado **e políticas escritas** no mesmo passo
do `CREATE TABLE` — diferente do MATRX, aqui não basta ligar RLS sem política
nenhuma, porque o acesso não passa por um service role.

```sql
ALTER TABLE public.<tabela> ENABLE ROW LEVEL SECURITY;
-- + política real, ex.: auth.uid() = user_id
```

A chave `service_role` do Supabase nunca vai para o navegador nem para
código versionado — só em variável de ambiente do lado servidor.

## Stack

- Flask + gunicorn, mesmo padrão do MATRX
- Deploy: Render, Web Service, Start Command `gunicorn app:app`
- Front hoje é HTML/CSS servido pelo Flask (`templates/`, `static/`) — sem
  framework de front-end ainda

## Estrutura

```
public/           o que vai ao ar (Publish Directory do Static Site)
  index.html      site da Inovai — HTML puro, caminhos relativos, sem Jinja
  livro.html      landing do livro (2º slide do carrossel aponta para cá)
  sobre.html      "Sobre a Inovai" — história da empresa e o Nullius in Verba
  css/styles.css
  js/script.js    menu mobile, reveal on scroll, carrossel, form de contato
  js/livro.js     formulário de cópia autografada (só na livro.html)
  img/            vazio: falta a foto e os logos de clientes
app.py            só desenvolvimento local — NÃO vai ao ar
docs/futuro/      HTML de reserva, não publicado (seções de livro e cursos)
requirements.txt
.env.example      variáveis de ambiente esperadas (preencher .env local)
.claude/launch.json  dev server na porta 5055
```

Nada de Jinja em `public/index.html`: no Render é servido como arquivo estático,
sem Python no meio. Se um dia precisar de template, o site volta a ser Web
Service (US$ 7/mês) e o `app.py` já está pronto para isso.

## Site da Inovai

O `index.html` veio de `~/Desktop/Claude Folder/inovai-site/` (10/08/2026) — a
Inovai é a consultoria financeira empresarial do Astênio, em Natal/RN. Seções:
hero, números, citação de posicionamento, 7 frentes de consultoria, método em 3
etapas, clientes, "Quem conduz" e CTA de contato.

Ainda tem placeholders entre colchetes no HTML, aguardando conteúdo real: prazos
das etapas do método (`[XX semanas]`), um depoimento e a foto do Astênio. Não
inventar esses valores.

### Logos de clientes

São 18 em `img/clientes/`, fechando 6 linhas de 3 no desktop. Todos com o mesmo
tratamento: fundo removido (transparente), recorte justo e escala dentro de uma
caixa de 460×160, salvos em `.png` + `.webp`. Na página vão em cinza e
translúcidos, e a cor volta no hover.

- `.logo--chapado` (Rede Lucena): fundo colorido chapado, fica em cinza também
  no hover.
- `.logo--nome` (Pescados da Cruz): a arte é só o símbolo — um disco rosa com
  os peixes vazados em branco — e não traz o nome. O nome entra como texto no
  HTML, embaixo da figura, e a imagem ganha contraste extra no filtro cinza
  porque em cinza puro o disco clareia e os peixes somem.
- André Elali Advogados: a arte original é branca sobre fundo preto; foi
  invertida para virar preta sobre transparente, como os demais.
- Larco: o único arquivo que existe é o do próprio site deles, 178×46 — pequeno
  demais para chegar à altura dos outros. Foi ampliado 3× no Pillow só para o
  limite de altura passar a valer.
- Em duas colunas (≤620px) a última célula ocupa a linha inteira quando a
  contagem é ímpar.

Não há geração de `.webp` por linha de comando aqui (sem `cwebp`); as conversões
saíram do Pillow (Python).

Contato: telefone (84) 3211-3414 (fixo, não é WhatsApp), e-mail
contato@inovai.com.br e Instagram @astenioaraujo — links diretos, sem
formulário. O formulário chegou a ser feito
e foi suspenso; está guardado em `docs/futuro/formulario-contato/` com o passo a
passo para religar. Enquanto não houver formulário, o site é Static Site e não
custa nada.

## Landing do livro (`public/livro.html`)

"Os Vermelhos, os Amarelos e os Azuis — Inteligências Primárias". Entrou como
2º slide do carrossel da home, e o slide inteiro é link para a página.

- Compra: Amazon físico `dp/6501957311` e e-book `dp/B0GMJB9LVN`.
- Imagens: as duas saem da arte da capa, direto da diagramação
  (`~/Desktop/Capa Diagramada.001.jpeg`) — as fotos do exemplar foram
  descartadas. `img/livro.jpg|webp` é a capa chapada da landing: sem sombra e
  sem canto arredondado, só um fio de 1px, porque a arte tem fundo branco igual
  ao da página. `img/slide-livro.jpg|webp` é a mesma capa centralizada em
  1600×900 com fundo branco, para o slide do carrossel.
  A foto da quarta capa serviu só para transcrever o texto da metodologia
  (15/08/2026) — não é imagem do site.
  `img/quadro-cores.*`, `img/piramide-cores.*` e `img/mistura-cores.*` são as
  três figuras recortadas de páginas do livro, no fim da seção da metodologia.
  Mesmo tratamento nas três: só a arte vira imagem, e os títulos e parágrafos
  em volta vão para o HTML como texto.
- Cópia autografada: R$ 72 + R$ 12 de frete = R$ 84. Formulário com endereço,
  enviado ao mesmo Web3Forms do contato — o e-mail cai em
  astenio.araujo@gmail.com. Nada é gravado: o site continua estático.
- **Anexo de arquivo no Web3Forms é recurso de plano pago** (plano gratuito:
  250 envios/mês, sem upload). Por isso o campo de arquivo saiu do formulário
  em 15/08/2026: quem compra manda o comprovante por e-mail comum para
  contato@inovai.com.br, com botão de copiar o endereço — de propósito não é
  link `mailto:`.
- Pagamento: QR Code do Pix em `img/pix-qr.*`, recortado do QR do banco (a
  moldura roxa do app foi descartada). O BR Code já traz favorecido (Astênio
  Araújo) e o valor de R$ 84,00 embutidos — **se o preço mudar, o QR tem de ser
  gerado de novo**. O mesmo código vai no `data-pix` do botão "Copiar código
  Pix", para quem paga do computador.

## Landing de palestras (`public/palestras.html`)

3º slide do carrossel, também com o slide inteiro como link. Foto de palco em
`img/palestras.*` (hero) e `img/slide-palestras.*` (16:9 do carrossel), vindas
de `~/Desktop/Palestras.png`.

- Formulário `formPalestra` (`js/palestras.js`, nascido do `livro.js`): pega os
  dados de quem cota — nome, cargo, empresa, e-mail, WhatsApp, telefone — mais
  **cidade/local da palestra**, data, público, perfil, duração e o tema.
- Vai para o mesmo Web3Forms das outras páginas (mesma access key), com assunto
  próprio: "Pedido de proposta de palestra — site da Inovai".

## Landing de treinamentos (`public/treinamentos.html`)

4º slide do carrossel. Nasceu da `palestras.html` e reaproveita o CSS dela
(`.palestras-hero`, `.palestras-foto`, `.palestras-cta`) — mexer nessas classes
mexe nas duas páginas. Foto em `img/treinamentos.*` e `img/slide-treinamentos.*`,
vindas de `~/Desktop/Treinamento.png`.

- Os 12 módulos ficam numa lista `.modulos`, na ordem ditada pelo Astênio.
- Formulário `formTreinamento` (`js/treinamentos.js`): mesmos campos da cotação
  de palestra, com rótulos de treinamento (cidade/local do treinamento, quantas
  pessoas, perfil da equipe, formato e duração, módulos e contexto).
- Mesmo Web3Forms, assunto "Pedido de orçamento de treinamento — site da Inovai".

## Página "Sobre a Inovai" (`public/sobre.html`)

Só texto, sem imagem e sem formulário — não entrou no carrossel. Duas seções: a
apresentação da empresa (fundada em 1999, em Natal/RN) e o *Nullius in Verba*,
o lema da Royal Society que a Inovai adota. Os dois hexâmetros de Horácio ficam
num `.verba`, com a tradução na `figcaption`.

O link "Sobre" foi acrescentado ao menu, ao menu mobile e ao rodapé das cinco
páginas, ao lado de "Quem conduz" — que continua apontando para a seção do
Astênio na home. São coisas diferentes: "Quem conduz" é a pessoa, "Sobre" é a
empresa.

Site pessoal `astenioaraujo.com.br` fica para depois, como segundo serviço.
