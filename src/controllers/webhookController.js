const webhookService = require("../services/webhookService");
const signature = require("../utils/discordSignature");

exports.receberWebhook = async (req, res) => {

    try {

        console.log("");
        console.log("====================================");
        console.log("WEBHOOK RECEBIDO");
        console.log("====================================");

        /*
            Validação da assinatura
        */

        const assinaturaValida = signature.validarAssinatura(req);

        if (!assinaturaValida) {

            console.log("Assinatura inválida.");

            return res.status(401).json({

                error: "invalid request signature"

            });

        }

        console.log("Assinatura válida.");

        const resultado = await webhookService.processar(req.body);

        return res.status(200).json(resultado);

    }

    catch (erro) {

        console.error(erro);

        return res.status(500).json({

            success: false,

            message: erro.message

        });

    }

};