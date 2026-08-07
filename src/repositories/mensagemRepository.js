const db = require("../database/database");

exports.salvar = (dados) => {

    return db.prepare(`
        INSERT INTO mensagens (
            id_externo,
            status,
            payload_bruto
        )
        VALUES (?, ?, ?)
    `).run(

        dados.id_externo,

        dados.status,

        JSON.stringify(dados.payload_bruto)

    );

};