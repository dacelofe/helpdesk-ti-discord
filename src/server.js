require("dotenv").config({ quiet: true });

const { getConfig } = require("./config");
const {
    iniciarDiscord,
    encerrarDiscord
} = require("./config/discordClient");

let servidor;
let encerrando = false;

async function iniciarServidor() {
    const config = getConfig();
    require("./database/init");
    const app = require("./app");

    servidor = await new Promise((resolve, reject) => {
        const httpServer = app.listen(config.port, () => resolve(httpServer));
        httpServer.once("error", reject);
    });

    console.log(`Servidor HTTP iniciado na porta ${config.port}.`);

    try {
        await iniciarDiscord(config.discord.token);
    } catch (erro) {
        await encerrarServidor();
        throw new Error(`Falha ao conectar ao Discord: ${erro.message}`);
    }

    return servidor;
}

async function encerrarServidor() {
    if (encerrando) {
        return;
    }

    encerrando = true;
    console.log("Encerrando aplicação...");

    const timeout = setTimeout(() => {
        console.error("Tempo limite excedido durante o encerramento.");
        servidor?.closeAllConnections?.();
        process.exit(1);
    }, 10000);
    timeout.unref();

    const fechamentoHttp = servidor
        ? new Promise((resolve) => servidor.close(resolve))
        : Promise.resolve();

    await encerrarDiscord();
    await fechamentoHttp;

    const db = require("./database/database");
    if (db.open) {
        db.close();
    }

    clearTimeout(timeout);
    console.log("Aplicação encerrada.");
}

if (require.main === module) {
    iniciarServidor().catch((erro) => {
        console.error(`Não foi possível iniciar a aplicação: ${erro.message}`);
        process.exitCode = 1;
    });

    for (const sinal of ["SIGTERM", "SIGINT"]) {
        process.once(sinal, () => {
            encerrarServidor()
                .then(() => process.exit(0))
                .catch((erro) => {
                    console.error(`Falha no encerramento: ${erro.message}`);
                    process.exit(1);
                });
        });
    }
}

module.exports = {
    iniciarServidor,
    encerrarServidor
};
