const discord = require("../services/discordService");

let protocolo = 1;

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

        const numero = protocolo++;

        const discordId = await discord.enviarMensagem(

            numero,

            chamado

        );

        res.json({

            success: true,

            protocolo: numero,

            status: "Enviado",

            discordMessageId: discordId

        });

    }

    catch (erro) {

    console.error("========== ERRO COMPLETO ==========");
    console.error(erro);
    console.error("Mensagem:", erro.message);
    console.error("Stack:", erro.stack);
    console.error("===================================");

    res.status(500).json({
        success: false,
        message: erro.message
    });

}

};