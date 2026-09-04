const path = require("path");

function lerBooleano(valor, nome, padrao = false) {
    if (valor === undefined || valor === "") {
        return padrao;
    }

    if (valor === "true") {
        return true;
    }

    if (valor === "false") {
        return false;
    }

    throw new Error(`${nome} deve ser "true" ou "false".`);
}

function lerPorta(valor) {
    const porta = Number(valor || 3000);

    if (!Number.isInteger(porta) || porta < 1 || porta > 65535) {
        throw new Error("PORT deve ser um número inteiro entre 1 e 65535.");
    }

    return porta;
}

function createConfig(env = process.env) {
    const nodeEnv = env.NODE_ENV || "development";

    if (!["development", "test", "production"].includes(nodeEnv)) {
        throw new Error("NODE_ENV deve ser development, test ou production.");
    }

    const production = nodeEnv === "production";
    const publicKey = env.DISCORD_PUBLIC_KEY || "";
    const validateSignature = lerBooleano(
        env.DISCORD_VALIDATE_SIGNATURE,
        "DISCORD_VALIDATE_SIGNATURE",
        false
    );

    if (publicKey && !/^[0-9a-fA-F]{64}$/.test(publicKey)) {
        throw new Error("DISCORD_PUBLIC_KEY deve ter 64 caracteres hexadecimais.");
    }

    for (const nome of ["DISCORD_CHANNEL_ID", "DISCORD_APPLICATION_ID"]) {
        if (env[nome] && !/^\d{17,20}$/.test(env[nome])) {
            throw new Error(`${nome} deve ser um ID numérico válido do Discord.`);
        }
    }

    if (production) {
        const obrigatorias = [
            "DISCORD_TOKEN",
            "DISCORD_CHANNEL_ID",
            "DISCORD_APPLICATION_ID",
            "DISCORD_PUBLIC_KEY"
        ];
        const ausentes = obrigatorias.filter((nome) => !env[nome]);

        if (ausentes.length > 0) {
            throw new Error(`Variáveis obrigatórias ausentes: ${ausentes.join(", ")}.`);
        }

        if (!validateSignature) {
            throw new Error(
                "DISCORD_VALIDATE_SIGNATURE deve ser true em produção."
            );
        }
    }

    return Object.freeze({
        nodeEnv,
        production,
        port: lerPorta(env.PORT),
        dbPath: env.DB_PATH || (
            production
                ? "/data/helpdesk.db"
                : path.resolve(__dirname, "../../helpdesk.db")
        ),
        discord: Object.freeze({
            token: env.DISCORD_TOKEN || "",
            channelId: env.DISCORD_CHANNEL_ID || "",
            applicationId: env.DISCORD_APPLICATION_ID || "",
            publicKey,
            validateSignature
        })
    });
}

let config;

function getConfig() {
    if (!config) {
        config = createConfig();
    }

    return config;
}

module.exports = {
    createConfig,
    getConfig
};
