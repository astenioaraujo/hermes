"""Gravação das solicitações de contato no banco.

Opcional de propósito: sem `DATABASE_URL` no ambiente, o site funciona só com
o e-mail. Assim o formulário pôde ir ao ar antes de o banco do Hermes existir.

Quando o banco entrar, rode `migrations/criar_tabela_contatos_site.sql` e
defina DATABASE_URL — nada mais muda.
"""

import logging
import os

log = logging.getLogger(__name__)

INSERT = """
    insert into contatos_site
        (nome, empresa, email, site, instagram, telefone, whatsapp,
         descricao, ip, criado_em)
    values (%(nome)s, %(empresa)s, %(email)s, %(site)s, %(instagram)s,
            %(telefone)s, %(whatsapp)s, %(descricao)s, %(ip)s, %(criado_em)s)
"""


def gravar_contato(dados, quando, ip):
    """Grava uma linha em `contatos_site`. Sem DATABASE_URL, não faz nada."""
    url = os.environ.get("DATABASE_URL")
    if not url:
        log.info("sem DATABASE_URL — contato de %s registrado só por e-mail",
                 dados["empresa"])
        return False

    import psycopg2  # importado aqui: sem banco, a dependência nem é exigida

    parametros = dict(dados, ip=ip, criado_em=quando)
    with psycopg2.connect(url) as conn:
        with conn.cursor() as cur:
            cur.execute(INSERT, parametros)
    return True
