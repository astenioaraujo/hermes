# Formulário de contato — suspenso em 12/08/2026

Estava pronto e testado quando foi suspenso a pedido do Astênio: por enquanto a
seção de contato só oferece os canais diretos (WhatsApp, e-mail e Instagram), e
quem clica no e-mail abre o próprio programa de e-mail já com o endereço.

Motivo prático de manter suspenso: formulário exige servidor, e o site como
**Static Site é gratuito** no Render. Religá-lo custa US$ 7/mês de Web Service.

## O que está guardado aqui

| Arquivo | O que faz |
|---|---|
| `contato.py` | valida os campos e monta/envia o e-mail para contato@inovai.com.br |
| `armazenamento.py` | grava a solicitação em `contatos_site` (opcional, via DATABASE_URL) |
| `criar_tabela_contatos_site.sql` | a tabela, com RLS habilitado |

O HTML, o CSS e o JavaScript do formulário **não** estão aqui — foram removidos
de `public/`. Para recuperá-los, o commit é `9d10900`:

```
git show 9d10900 -- public/
```

## Para religar

1. Voltar os arquivos para a raiz do projeto e o trecho de `public/` do commit acima
2. Restaurar a rota `POST /api/contato` no `app.py` (também em `9d10900`)
3. Trocar o serviço do Render de Static Site para **Web Service**
   (Build `pip install -r requirements.txt`, Start `gunicorn -b 0.0.0.0:$PORT app:app`)
4. Repor `psycopg2-binary` no `requirements.txt` se for usar banco
5. Definir as variáveis de SMTP no Render (ver `.env.example` do commit `9d10900`)

## Decisões que ficaram pendentes

- **Por onde enviar**: o `contato@inovai.com.br` é iCloud, e o SMTP da Apple
  exige uma *senha de app* gerada na conta Apple do Astênio. A alternativa
  (Resend, Brevo) exige registros DNS no domínio, que hoje está na Wix.
- **Banco**: sem `DATABASE_URL` o formulário funciona só com e-mail. O CRM de
  oportunidades depende de decidir entre schema no MATRX e projeto Supabase
  próprio.
