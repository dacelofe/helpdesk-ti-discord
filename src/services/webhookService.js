const mensagemService = require("./mensagemService");
const { obterEstadoDiscord } = require("../config/discordClient");

exports.processar = async (body) => {
    mensagemService.registrar(body);

    if (body.type === 1) {
        return { type: 1 };
    }

    if (body.type === 2) {
        const discord = obterEstadoDiscord().conectado
            ? "Conectado"
            : "Indisponível";

        return {
            type: 4,
            data: {
                content: `HelpDesk TI\n\nBackend: Online\nBanco SQLite: Conectado\nBot Discord: ${discord}`
            }
        };
    }

    return {
        type: 4,
        data: {
            content: "Evento recebido."
        }
    };
};
