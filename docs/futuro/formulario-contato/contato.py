"""Recebimento das solicitações de contato do site da Inovai.

Duas responsabilidades, deliberadamente separadas da rota: validar o que chegou
e entregar em dois lugares — e-mail para contato@inovai.com.br e, quando houver
banco configurado, uma linha em `contatos_site`.

O e-mail nunca é o único registro: se o SMTP falhar, a gravação no banco já
aconteceu e o contato não se perde (ver `registrar` em app.py).
"""

import os
import re
import smtplib
import unicodedata
from email.message import EmailMessage

# Campos aceitos. Qualquer coisa fora desta lista é descartada.
CAMPOS = ("nome", "empresa", "email", "site", "instagram", "telefone",
          "whatsapp", "descricao")

OBRIGATORIOS = ("nome", "empresa", "whatsapp", "descricao")

ROTULOS = {
    "nome": "Nome",
    "empresa": "Empresa",
    "email": "E-mail",
    "site": "Site",
    "instagram": "Instagram",
    "telefone": "Telefone",
    "whatsapp": "WhatsApp",
}

LIMITES = {"descricao": 3000, "email": 180, "site": 180}
LIMITE_PADRAO = 120

RE_EMAIL = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


class DadosInvalidos(Exception):
    """Erro de preenchimento — vira 400 com mensagem para o visitante."""


def _limpar(texto, multilinha=False):
    """Tira caracteres de controle e espaços das pontas.

    Só a descrição pode ter quebra de linha. Nos demais campos a quebra vira
    espaço, porque `nome` e `empresa` entram no assunto do e-mail e um `\\n`
    ali viraria uma linha extra de cabeçalho (injeção de cabeçalho SMTP).
    """
    if not isinstance(texto, str):
        return ""
    texto = unicodedata.normalize("NFC", texto)
    if multilinha:
        texto = "".join(
            c for c in texto if c == "\n" or unicodedata.category(c)[0] != "C")
    else:
        texto = "".join(
            " " if unicodedata.category(c)[0] == "C" else c for c in texto)
        texto = re.sub(r"\s{2,}", " ", texto)
    return texto.strip()


def so_digitos(valor):
    return re.sub(r"\D", "", valor or "")


def validar(bruto):
    """Devolve os dados limpos ou levanta DadosInvalidos.

    Repete a validação que o JavaScript já faz, porque a do navegador é
    conveniência — qualquer um posta direto no endpoint.
    """
    dados = {campo: _limpar(bruto.get(campo, ""), multilinha=(campo == "descricao"))
             for campo in CAMPOS}

    for campo, valor in dados.items():
        limite = LIMITES.get(campo, LIMITE_PADRAO)
        if len(valor) > limite:
            raise DadosInvalidos("Campo %s é longo demais." % ROTULOS.get(campo, campo))

    faltando = [ROTULOS.get(c, c) for c in OBRIGATORIOS if not dados[c]]
    if faltando:
        raise DadosInvalidos("Preencha: %s." % ", ".join(faltando))

    for campo in ("whatsapp", "telefone"):
        digitos = so_digitos(dados[campo])
        if campo == "telefone" and not digitos:
            continue
        if len(digitos) < 10 or len(digitos) > 11:
            raise DadosInvalidos(
                "%s incompleto — informe DDD e número." % ROTULOS[campo])

    if dados["email"] and not RE_EMAIL.match(dados["email"]):
        raise DadosInvalidos("E-mail parece incompleto.")

    if len(dados["descricao"]) < 15:
        raise DadosInvalidos("Conte um pouco mais sobre o que você precisa.")

    return dados


def montar_email(dados, quando):
    """Monta a mensagem no formato combinado com o Astênio."""
    msg = EmailMessage()
    msg["Subject"] = "Novo contato pelo site – %s – %s" % (
        dados["empresa"], dados["nome"])
    msg["From"] = os.environ["SMTP_REMETENTE"]
    msg["To"] = os.environ.get("CONTATO_DESTINO", "contato@inovai.com.br")

    # Responder ao e-mail cai direto no cliente, quando ele informou um.
    if dados["email"]:
        msg["Reply-To"] = dados["email"]

    linhas = ["Novo contato recebido pelo site da INOVAI", ""]
    for campo in ("nome", "empresa", "email", "site", "instagram",
                  "telefone", "whatsapp"):
        if dados[campo]:
            linhas.append("%s: %s" % (ROTULOS[campo], dados[campo]))

    linhas += [
        "",
        "Problema / necessidade informada:",
        dados["descricao"],
        "",
        "—",
        "Recebido em %s" % quando.strftime("%d/%m/%Y às %H:%M"),
    ]

    msg.set_content("\n".join(linhas))
    return msg


def enviar(msg):
    """Entrega via SMTP. Levanta a exceção do smtplib se falhar."""
    host = os.environ["SMTP_HOST"]
    porta = int(os.environ.get("SMTP_PORTA", 587))
    usuario = os.environ["SMTP_USUARIO"]
    senha = os.environ["SMTP_SENHA"]

    if porta == 465:
        with smtplib.SMTP_SSL(host, porta, timeout=20) as s:
            s.login(usuario, senha)
            s.send_message(msg)
    else:
        with smtplib.SMTP(host, porta, timeout=20) as s:
            s.starttls()
            s.login(usuario, senha)
            s.send_message(msg)
