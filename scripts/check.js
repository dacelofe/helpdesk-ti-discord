const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const raizes = ["src", path.join("public", "js"), "test", "scripts"];
const arquivos = [];

function encontrarJavaScript(diretorio) {
    for (const entrada of fs.readdirSync(diretorio, { withFileTypes: true })) {
        const caminho = path.join(diretorio, entrada.name);

        if (entrada.isDirectory()) {
            encontrarJavaScript(caminho);
        } else if (entrada.isFile() && caminho.endsWith(".js")) {
            arquivos.push(caminho);
        }
    }
}

for (const raiz of raizes) {
    encontrarJavaScript(path.resolve(raiz));
}

for (const arquivo of arquivos) {
    const resultado = spawnSync(process.execPath, ["--check", arquivo], {
        stdio: "inherit"
    });

    if (resultado.status !== 0) {
        process.exit(resultado.status || 1);
    }
}

console.log(`${arquivos.length} arquivos JavaScript verificados.`);
