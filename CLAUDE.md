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
  css/styles.css
  js/script.js    menu mobile, reveal on scroll, ano no rodapé
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
das etapas do método (`[XX semanas]`), logos de clientes, um depoimento e a foto
do Astênio. Não inventar esses valores.

Contato: WhatsApp (84) 3211-3414, e-mail contato@inovai.com.br e Instagram
@astenioaraujo — links diretos, sem formulário. O formulário chegou a ser feito
e foi suspenso; está guardado em `docs/futuro/formulario-contato/` com o passo a
passo para religar. Enquanto não houver formulário, o site é Static Site e não
custa nada.

Site pessoal `astenioaraujo.com.br` fica para depois, como segundo serviço.
