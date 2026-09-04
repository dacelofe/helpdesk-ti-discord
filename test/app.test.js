const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { after, before, test } = require("node:test");
const nacl = require("tweetnacl");

const diretorioTemporario = fs.mkdtempSync(
    path.join(os.tmpdir(), "helpdesk-test-")
);
const chaves = nacl.sign.keyPair();

process.env.NODE_ENV = "test";
process.env.DB_PATH = path.join(diretorioTemporario, "helpdesk.db");
process.env.DISCORD_PUBLIC_KEY = Buffer.from(chaves.publicKey).toString("hex");
process.env.DISCORD_VALIDATE_SIGNATURE = "true";
delete process.env.DISCORD_TOKEN;

require("../src/database/init");
const app = require("../src/app");
const db = require("../src/database/database");
const { createConfig } = require("../src/config");

let servidor;
let baseUrl;

before(async () => {
    servidor = await new Promise((resolve, reject) => {
        const instancia = app.listen(0, "127.0.0.1", () => resolve(instancia));
        instancia.once("error", reject);
    });

    const endereco = servidor.address();
    baseUrl = `http://127.0.0.1:${endereco.port}`;
});

after(async () => {
    if (servidor) {
        await new Promise((resolve) => servidor.close(resolve));
    }

    if (db.open) {
        db.close();
    }

    fs.rmSync(diretorioTemporario, { recursive: true, force: true });
});

function assinar(timestamp, rawBody) {
    return Buffer.from(
        nacl.sign.detached(
            Buffer.from(timestamp + rawBody, "utf8"),
            chaves.secretKey
        )
    ).toString("hex");
}

async function enviarInteracao(rawBody, assinatura) {
    return fetch(`${baseUrl}/webhook/discord`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Signature-Timestamp": "1700000000",
            "X-Signature-Ed25519": assinatura
        },
        body: rawBody
    });
}

test("liveness e status respondem sem depender do Discord", async () => {
    const live = await fetch(`${baseUrl}/health/live`);
    assert.equal(live.status, 200);
    assert.deepEqual(await live.json(), { status: "alive" });

    const status = await fetch(`${baseUrl}/api/status`);
    assert.equal(status.status, 200);
    const body = await status.json();
    assert.equal(body.backend, "Online");
    assert.equal(body.database, "Pronto");
    assert.equal(body.discord, "Indisponível");

    const ready = await fetch(`${baseUrl}/health/ready`);
    assert.equal(ready.status, 503);
});

test("chamado inválido retorna 400", async () => {
    const response = await fetch(`${baseUrl}/api/chamados`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: "A" })
    });

    assert.equal(response.status, 400);
    assert.equal((await response.json()).success, false);
});

test("chamado válido persiste falha explícita sem cliente Discord", async () => {
    const response = await fetch(`${baseUrl}/api/chamados`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            nome: "  Pessoa   de Teste ",
            departamento: " TI ",
            categoria: " Rede ",
            prioridade: "media",
            descricao: " Não consigo acessar a rede interna. "
        })
    });

    assert.equal(response.status, 502);
    const body = await response.json();
    assert.equal(body.status, "Falha no envio");

    const registro = db.prepare(`
        SELECT nome, prioridade, status
        FROM chamados
        WHERE protocolo = ?
    `).get(body.protocolo);

    assert.deepEqual(registro, {
        nome: "Pessoa de Teste",
        prioridade: "Média",
        status: "Falha no envio"
    });
});

test("assinatura ausente ou inválida retorna 401", async () => {
    const ausente = await fetch(`${baseUrl}/webhook/discord`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: 1 })
    });
    assert.equal(ausente.status, 401);

    const invalida = await enviarInteracao(
        JSON.stringify({ type: 1 }),
        "00".repeat(64)
    );
    assert.equal(invalida.status, 401);
});

test("PING assinado sobre o corpo bruto retorna PONG e persiste", async () => {
    const rawBody = '{"type":1,"nonce":"teste"}';
    const assinatura = assinar("1700000000", rawBody);
    const response = await enviarInteracao(rawBody, assinatura);

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { type: 1 });

    const quantidade = db.prepare(
        "SELECT COUNT(*) AS total FROM mensagens"
    ).get().total;
    assert.equal(quantidade, 1);
});

test("JSON equivalente com bytes diferentes rejeita assinatura reutilizada", async () => {
    const corpoAssinado = '{"type":1,"nonce":"bytes"}';
    const corpoAlterado = '{ "type": 1, "nonce": "bytes" }';
    const assinatura = assinar("1700000000", corpoAssinado);
    const response = await enviarInteracao(corpoAlterado, assinatura);

    assert.equal(response.status, 401);
});

test("frontend usa API relativa e implementa verificarStatus", () => {
    const api = fs.readFileSync(
        path.resolve(__dirname, "../public/js/api.js"),
        "utf8"
    );

    assert.doesNotMatch(api, /http:\/\/localhost:3000\/api/);
    assert.match(api, /const API_URL = ["']\/api["']/);
    assert.match(api, /async function verificarStatus\s*\(/);
});

test("produção recusa validação de assinatura desativada", () => {
    assert.throws(
        () => createConfig({
            NODE_ENV: "production",
            DISCORD_TOKEN: "token-de-teste",
            DISCORD_CHANNEL_ID: "canal-de-teste",
            DISCORD_APPLICATION_ID: "aplicacao-de-teste",
            DISCORD_PUBLIC_KEY: "00".repeat(32),
            DISCORD_VALIDATE_SIGNATURE: "false"
        }),
        /DISCORD_VALIDATE_SIGNATURE deve ser true/
    );
});
