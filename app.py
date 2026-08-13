"""Servidor local de desenvolvimento.

Em produção o site é publicado como Static Site no Render, servindo a pasta
`public/` direto pelo CDN — este arquivo não vai para o ar. Ele existe só para
abrir o site localmente com os mesmos caminhos relativos, e como base para
quando o Hermes precisar de um back-end de verdade.
"""

import os
from flask import Flask, send_from_directory

app = Flask(__name__, static_folder="public", static_url_path="")


@app.route("/")
def home():
    return send_from_directory("public", "index.html")


@app.route("/saude")
def saude():
    """Endpoint simples para checar se o serviço está no ar."""
    return {"status": "ok"}


if __name__ == "__main__":
    app.run(debug=True, port=int(os.environ.get("PORT", 5055)))
