const nacl = require("tweetnacl");

exports.validarAssinatura = (req) => {

    if (process.env.DISCORD_VALIDATE_SIGNATURE !== "true") {

        console.log("Validação de assinatura desabilitada.");

        return true;

    }

    const signature = req.header("X-Signature-Ed25519");
    const timestamp = req.header("X-Signature-Timestamp");
    const publicKey = process.env.DISCORD_PUBLIC_KEY;

    if (
        typeof req.rawBody !== "string" ||
        !/^[0-9a-fA-F]{128}$/.test(signature || "") ||
        typeof timestamp !== "string" ||
        timestamp.length === 0 ||
        timestamp.length > 64 ||
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
