const db = require("./database");

db.exec(`
    CREATE TABLE IF NOT EXISTS chamados (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        protocolo INTEGER NOT NULL,
        nome TEXT NOT NULL,
        departamento TEXT NOT NULL,
        categoria TEXT NOT NULL,
        prioridade TEXT NOT NULL,
        descricao TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Aberto',
        discord_message_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS mensagens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        id_externo TEXT,
        status TEXT NOT NULL,
        payload_bruto TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
`);

console.log("Tabelas verificadas/criadas.");

module.exports = db;