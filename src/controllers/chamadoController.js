const discord = require("../services/discordService");
const chamadoService = require("../services/chamadoService");
const { obterEstadoDiscord } = require("../config/discordClient");
const { bancoDisponivel } = require("./healthController");
const {
    ErroValidacao,
    validarChamado
} = require("../utils/chamadoValidation");

exports.status = (req, res) => {
    const estadoDiscord = obterEstadoDiscord();

    res.json({
        backend: "Online",
        database: bancoDisponivel() ? "Pronto" : "Indisponível",
        discord: estadoDiscord.conectado ? "Pronto" : "Indisponível",
        bot: estadoDiscord.usuario || "HelpDeskBOT",
        canal: "#suporte"
    });
};

exports.criarChamado = async (req, res) => {
    try {
        const chamado = validarChamado(req.body);
        const registro = chamadoService.criar(chamado);

        console.log(`Chamado ${registro.protocolo} gravado no banco.`);

        let discordId;

        try {
            discordId = await discord.enviarMensagem(
                registro.protocolo,
                chamado
            );

            chamadoService.atualizarEnvio(registro.id, "Enviado", discordId);
        } catch (erro) {
            chamadoService.atualizarEnvio(registro.id, "Falha no envio", null);
            console.error(`Falha ao enviar o chamado ${registro.protocolo} ao Discord.`);

            return res.status(502).json({
                success: false,
                message: "Chamado registrado, mas não foi possível enviá-lo ao Discord.",
                protocolo: registro.protocolo,
                status: "Falha no envio"
            });
        }

        return res.json({
            success: true,
            protocolo: registro.protocolo,
            status: "Enviado",
            discordMessageId: discordId
        });
    } catch (erro) {
        if (erro instanceof ErroValidacao) {
            return res.status(400).json({
                success: false,
                message: erro.message
            });
        }

        console.error(`Erro ao criar chamado: ${erro.name}.`);

        return res.status(500).json({
            success: false,
            message: "Não foi possível criar o chamado."
        });
    }
};
