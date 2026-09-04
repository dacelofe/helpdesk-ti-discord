const LIMITES = Object.freeze({
    nome: { minimo: 2, maximo: 100 },
    departamento: { minimo: 2, maximo: 100 },
    categoria: { minimo: 2, maximo: 100 },
    descricao: { minimo: 10, maximo: 1000 }
});

const PRIORIDADES = new Map([
    ["baixa", "Baixa"],
    ["média", "Média"],
    ["media", "Média"],
    ["alta", "Alta"]
]);

class ErroValidacao extends Error {
    constructor(message) {
        super(message);
        this.name = "ErroValidacao";
    }
}

function normalizarTexto(valor, campo) {
    if (typeof valor !== "string") {
        throw new ErroValidacao(`${campo} deve ser um texto.`);
    }

    return valor.trim().replace(/\s+/g, " ");
}

function validarComprimento(campo, valor) {
    const limite = LIMITES[campo];

    if (valor.length < limite.minimo || valor.length > limite.maximo) {
        throw new ErroValidacao(
            `${campo} deve ter entre ${limite.minimo} e ${limite.maximo} caracteres.`
        );
    }
}

function validarChamado(body) {
    if (!body || typeof body !== "object" || Array.isArray(body)) {
        throw new ErroValidacao("O corpo do chamado deve ser um objeto JSON.");
    }

    const chamado = {};

    for (const campo of ["nome", "departamento", "categoria", "descricao"]) {
        chamado[campo] = normalizarTexto(body[campo], campo);
        validarComprimento(campo, chamado[campo]);
    }

    const prioridadeRecebida = normalizarTexto(body.prioridade, "prioridade")
        .toLocaleLowerCase("pt-BR");
    chamado.prioridade = PRIORIDADES.get(prioridadeRecebida);

    if (!chamado.prioridade) {
        throw new ErroValidacao("prioridade deve ser Baixa, Média ou Alta.");
    }

    return chamado;
}

module.exports = {
    ErroValidacao,
    validarChamado
};
