const nacl = require("tweetnacl");

exports.validarAssinatura = (req) => {

    if (process.env.DISCORD_VALIDATE_SIGNATURE !== "true") {

        console.log("Validação de assinatura desabilitada.");

        return true;

    }

    const signature = req.header("X-Signature-Ed25519");
    const timestamp = req.header("X-Signature-Timestamp");

    if (!signature || !timestamp) {
        return false;
    }

    const body = JSON.stringify(req.body);

    return nacl.sign.detached.verify(
        Buffer.from(timestamp + body),
        Buffer.from(signature, "hex"),
        Buffer.from(process.env.DISCORD_PUBLIC_KEY, "hex")
    );

};