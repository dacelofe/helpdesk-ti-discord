const { Client, Events, GatewayIntentBits } = require("discord.js");

let client;

async function iniciarDiscord(token) {
    if (!token) {
        console.warn("Discord não iniciado: DISCORD_TOKEN ausente.");
        return false;
    }

    if (client) {
        return client.isReady();
    }

    client = new Client({
        intents: [GatewayIntentBits.Guilds]
    });

    client.once(Events.ClientReady, (clientePronto) => {
        console.log(`Bot Discord conectado como ${clientePronto.user.tag}.`);
    });

    try {
        await client.login(token);
        return client.isReady();
    } catch (erro) {
        client.destroy();
        client = undefined;
        throw erro;
    }
}

function obterClienteDiscord() {
    if (!client || !client.isReady()) {
        throw new Error("Cliente Discord indisponível.");
    }

    return client;
}

function obterEstadoDiscord() {
    return {
        conectado: Boolean(client?.isReady()),
        usuario: client?.user?.tag || null
    };
}

async function encerrarDiscord() {
    if (!client) {
        return;
    }

    client.destroy();
    client = undefined;
}

module.exports = {
    iniciarDiscord,
    obterClienteDiscord,
    obterEstadoDiscord,
    encerrarDiscord
};
