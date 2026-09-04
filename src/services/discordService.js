const { getConfig } = require("../config");
const { obterClienteDiscord } = require("../config/discordClient");

exports.enviarMensagem = async (protocolo, chamado) => {
    const client = obterClienteDiscord();
    const canal = await client.channels.fetch(getConfig().discord.channelId);

    if (!canal || !canal.isTextBased()) {
        throw new Error("Canal Discord não encontrado ou incompatível.");
    }

    const mensagem = await canal.send({
        embeds: [
            {
                color: 0x2563eb,
                title: "Novo chamado",
                fields: [
                    {
                        name: "Protocolo",
                        value: protocolo.toString(),
                        inline: true
                    },
                    {
                        name: "Solicitante",
                        value: chamado.nome,
                        inline: true
                    },
                    {
                        name: "Departamento",
                        value: chamado.departamento,
                        inline: true
                    },
                    {
                        name: "Categoria",
                        value: chamado.categoria,
                        inline: true
                    },
                    {
                        name: "Prioridade",
                        value: chamado.prioridade,
                        inline: true
                    },
                    {
                        name: "Descrição",
                        value: chamado.descricao
                    }
                ],
                timestamp: new Date()
            }
        ],
        allowedMentions: { parse: [] }
    });

    console.log(`Chamado ${protocolo} enviado ao Discord.`);
    return mensagem.id;
};
