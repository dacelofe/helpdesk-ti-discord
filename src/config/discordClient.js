const { Client, GatewayIntentBits } = require("discord.js");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.once("clientReady", () => {
    console.log("");
    console.log("===================================");
    console.log(`Bot conectado: ${client.user.tag}`);
    console.log("===================================");
    console.log("");
});

client.login(process.env.DISCORD_TOKEN);

module.exports = client;