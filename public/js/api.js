// URL base da API
const API_URL = "http://localhost:3000/api";

// ==============================
// STATUS DA API
// ==============================

async function verificarStatus() {

    try {

        const response = await fetch(`${API_URL}/status`);

        if (!response.ok) {
            throw new Error("Erro ao consultar API");
        }

        return await response.json();

    } catch (error) {

        console.error("Erro ao consultar status:", error);

        return {
            backend: "offline",
            discord: "offline",
            bot: "--",
            canal: "--"
        };

    }

}

// ==============================
// NOVO CHAMADO
// ==============================

async function criarChamado(dados) {

    console.log("Enviando para:", `${API_URL}/chamados`);
    console.log(dados);

    const response = await fetch(`${API_URL}/chamados`, {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify(dados)

    });

    console.log("Status HTTP:", response.status);

    const resultado = await response.json();

    console.log("Resposta da API:", resultado);

    return resultado;

}