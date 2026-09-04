const db = require("../database/database");

const inserirChamado = db.transaction((chamado) => {
    const proximo = db.prepare(`
        SELECT COALESCE(MAX(protocolo), 0) + 1 AS protocolo
        FROM chamados
    `).get();

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
        proximo.protocolo,
        chamado.nome,
        chamado.departamento,
        chamado.categoria,
        chamado.prioridade,
        chamado.descricao,
        "Aberto"
    );

    return {
        id: resultado.lastInsertRowid,
        protocolo: proximo.protocolo
    };
});

exports.criar = (chamado) => inserirChamado(chamado);

exports.atualizarEnvio = (id, status, discordMessageId) => {
    db.prepare(`
        UPDATE chamados
        SET status = ?, discord_message_id = ?
        WHERE id = ?
    `).run(
        status,
        discordMessageId,
        id
    );
};
