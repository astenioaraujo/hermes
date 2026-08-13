"""Site da Inovai — servidor Flask.

Serve os arquivos de `public/` e recebe as solicitações do formulário de
contato em POST /api/contato.
"""

import logging
import os
from datetime import datetime, timedelta

from flask import Flask, jsonify, request, send_from_directory

import contato
from armazenamento import gravar_contato

app = Flask(__name__, static_folder="public", static_url_path="")
log = logging.getLogger(__name__)

# Anti-robô: quem preenche o formulário honesto leva mais que isso para digitar.
SEGUNDOS_MINIMOS = 4

# Freio simples por IP, em memória. Não sobrevive a restart nem cobre várias
# instâncias — é para conter robô bobo, não ataque dirigido.
_ultimos_envios = {}
LIMITE_POR_IP = 3
JANELA = timedelta(minutes=10)


@app.route("/")
def home():
    return send_from_directory("public", "index.html")


@app.route("/saude")
def saude():
    """Endpoint simples para o health check do Render."""
    return {"status": "ok"}


def _ip_do_visitante():
    encaminhado = request.headers.get("X-Forwarded-For", "")
    return encaminhado.split(",")[0].strip() or request.remote_addr or "?"


def _passou_do_limite(ip, agora):
    envios = [q for q in _ultimos_envios.get(ip, []) if agora - q < JANELA]
    _ultimos_envios[ip] = envios
    return len(envios) >= LIMITE_POR_IP


@app.post("/api/contato")
def receber_contato():
    corpo = request.get_json(silent=True) or {}
    agora = datetime.now()
    ip = _ip_do_visitante()

    # Armadilha de robô: campo invisível no HTML. Preenchido = robô.
    # Responde 200 de propósito, para o robô não aprender que foi barrado.
    if corpo.get("empresa_site"):
        log.info("contato descartado (honeypot) de %s", ip)
        return jsonify({"ok": True})

    try:
        segundos = int(corpo.get("segundos_na_pagina") or 0)
    except (TypeError, ValueError):
        segundos = 0
    if segundos < SEGUNDOS_MINIMOS:
        log.info("contato descartado (rápido demais: %ss) de %s", segundos, ip)
        return jsonify({"ok": True})

    if _passou_do_limite(ip, agora):
        return jsonify(
            {"erro": "Muitas tentativas seguidas. Tente de novo em alguns minutos."}
        ), 429

    try:
        dados = contato.validar(corpo)
    except contato.DadosInvalidos as e:
        return jsonify({"erro": str(e)}), 400

    # Grava antes de enviar: se o e-mail falhar, o contato não se perde.
    try:
        gravar_contato(dados, agora, ip)
    except Exception:
        log.exception("falha ao gravar o contato de %s no banco", dados["empresa"])

    try:
        contato.enviar(contato.montar_email(dados, agora))
    except KeyError as e:
        log.error("SMTP não configurado: falta a variável %s", e)
        return jsonify(
            {"erro": "O envio está temporariamente indisponível."}
        ), 503
    except Exception:
        log.exception("falha ao enviar o e-mail do contato de %s", dados["empresa"])
        return jsonify(
            {"erro": "Não conseguimos enviar sua mensagem agora."}
        ), 502

    _ultimos_envios.setdefault(ip, []).append(agora)
    return jsonify({"ok": True})


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    app.run(debug=True, port=int(os.environ.get("PORT", 5055)))
