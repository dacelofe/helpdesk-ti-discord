const nacl = require("tweetnacl");
const { getConfig } = require("../config");

exports.validarAssinatura = (req) => {

    const config = getConfig();

    if (!config.discord.validateSignature) {

        console.log("Validação de assinatura desabilitada.");

        return true;

    }

    const signature = req.header("X-Signature-Ed25519");
    const timestamp = req.header("X-Signature-Timestamp");
    const publicKey = config.discord.publicKey;

    if (
        typeof req.rawBody !== "string" ||
        !/^[0-9a-fA-F]{128}$/.test(signature || "") ||
        !/^\d{1,20}$/.test(timestamp || "") ||
        !/^[0-9a-fA-F]{64}$/.test(publicKey || "")
    ) {
        return false;
    }

    try {
        return nacl.sign.detached.verify(
            Buffer.from(timestamp + req.rawBody, "utf8"),
            Buffer.from(signature, "hex"),
            Buffer.from(publicKey, "hex")
        );
    } catch (erro) {
        return false;
    }

};
