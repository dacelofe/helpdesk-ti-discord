const repository = require("../repositories/mensagemRepository");

exports.registrar = (body) => {

    repository.salvar({

        id_externo:

            body.id || null,

        status:

            "RECEBIDO",

        payload_bruto:

            body

    });

};