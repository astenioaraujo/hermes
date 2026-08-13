import os
from flask import Flask, render_template

app = Flask(__name__)


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/saude")
def saude():
    """Endpoint simples para checar se o serviço está no ar (Render health check)."""
    return {"status": "ok"}


if __name__ == "__main__":
    app.run(debug=True, port=int(os.environ.get("PORT", 5055)))
