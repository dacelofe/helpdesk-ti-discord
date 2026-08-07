const client = require("../config/discordClient");

exports.enviarMensagem = async (protocolo, chamado) => {

    try {

        console.log("Enviando mensagem ao Discord...");
        console.log("Canal:", process.env.DISCORD_CHANNEL_ID);

        const canal = await client.channels.fetch(process.env.DISCORD_CHANNEL_ID);
        console.log("Canal encontrado:", canal?.name);
console.log("Tipo:", canal?.type);

        if (!canal) {
            throw new Error("Canal não encontrado.");
        }

        const mensagem = await canal.send({
            embeds: [
                {
                    color: 0x2563eb,
                    title: "🎫 Novo Chamado",
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
            ]
        });

      console.log("Canal encontrado:", canal.name);
console.log("Mensagem enviada!");
console.log("ID:", mensagem.id);

return mensagem.id;

    } catch (erro) {

    console.error("================================");
    console.error("ERRO AO ENVIAR PARA O DISCORD");
    console.error("Nome:", erro.name);
    console.error("Mensagem:", erro.message);
    console.error("Stack:", erro.stack);
    console.error("================================");

    throw erro;
}
};