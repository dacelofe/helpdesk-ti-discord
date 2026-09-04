const webhookService = require("../services/webhookService");
const signature = require("../utils/discordSignature");

exports.receberWebhook = async (req, res) => {
    try {
        if (!signature.validarAssinatura(req)) {
            return res.status(401).json({
                error: "invalid request signature"
            });
        }

        const resultado = await webhookService.processar(req.body);
        return res.status(200).json(resultado);
    } catch (erro) {
        console.error(`Erro ao processar webhook: ${erro.name}.`);

        return res.status(500).json({
            success: false,
            message: "Não foi possível processar a interação."
        });
    }
};
