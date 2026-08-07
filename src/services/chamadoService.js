const db = require("../database/database");

exports.criar = (chamado) => {

    const ultimoChamado = db.prepare(`
        SELECT protocolo
        FROM chamados
        ORDER BY protocolo DESC
        LIMIT 1
    `).get();

    const protocolo = ultimoChamado
        ? ultimoChamado.protocolo + 1
        : 1;

    const resultado = db.prepare(`
        INSERT INTO chamados (
            protocolo,
            nome,
            departamento,
            categoria,
            prioridade,
            descricao,
            status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
        protocolo,
        chamado.nome,
        chamado.departamento,
        chamado.categoria,
        chamado.prioridade,
        chamado.descricao,
        "Aberto"
    );

    return {
        id: resultado.lastInsertRowid,
        protocolo
    };
};

exports.atualizarDiscordMessageId = (id, discordMessageId) => {

    db.prepare(`
        UPDATE chamados
        SET discord_message_id = ?
        WHERE id = ?
    `).run(
        discordMessageId,
        id
    );
};