const discord = require("../services/discordService");
const chamadoService = require("../services/chamadoService");

exports.status = (req, res) => {

    res.json({

        backend: "Online",

        discord: "Pronto",

        bot: "HelpDeskBOT",

        canal: "#suporte"

    });

};

exports.criarChamado = async (req, res) => {

    try {

        const chamado = req.body;

        console.log("================================");
        console.log("Novo chamado recebido");
        console.log(chamado);
        console.log("================================");

        // 1. Grava o chamado no banco
        const registro = chamadoService.criar(chamado);

        console.log(
            "Chamado gravado no banco. Protocolo:",
            registro.protocolo
        );

        // 2. Envia o chamado para o Discord
        const discordId = await discord.enviarMensagem(
            registro.protocolo,
            chamado
        );

        console.log(
            "Mensagem enviada ao Discord:",
            discordId
        );

        // 3. Atualiza o registro com o ID da mensagem
        chamadoService.atualizarDiscordMessageId(
            registro.id,
            discordId
        );

        console.log(
            "Chamado atualizado com ID do Discord."
        );

        // 4. Resposta para o frontend
        res.json({

            success: true,

            protocolo: registro.protocolo,

            status: "Enviado",

            discordMessageId: discordId

        });

    }

    catch (erro) {

        console.error("================================");
        console.error("ERRO AO CRIAR CHAMADO");
        console.error("Nome:", erro.name);
        console.error("Mensagem:", erro.message);
        console.error("Stack:", erro.stack);
        console.error("================================");

        res.status(500).json({

            success: false,

            message: erro.message

        });

    }

};