const db = require("../database/database");
const { obterEstadoDiscord } = require("../config/discordClient");

function bancoDisponivel() {
    try {
        return db.open && db.prepare("SELECT 1 AS ok").get().ok === 1;
    } catch (erro) {
        return false;
    }
}

exports.liveness = (req, res) => {
    res.json({ status: "alive" });
};

exports.readiness = (req, res) => {
    const database = bancoDisponivel();
    const discord = obterEstadoDiscord().conectado;
    const ready = database && discord;

    res.status(ready ? 200 : 503).json({
        status: ready ? "ready" : "not_ready",
        database: database ? "Pronto" : "Indisponível",
        discord: discord ? "Pronto" : "Indisponível"
    });
};

exports.bancoDisponivel = bancoDisponivel;
