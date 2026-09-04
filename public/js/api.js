const API_URL = "/api";

async function verificarStatus() {

    const response = await fetch(`${API_URL}/status`, {
        headers: {
            "Accept": "application/json"
        }
    });

    if (!response.ok) {
        throw new Error("Não foi possível consultar o status do serviço.");
    }

    return response.json();
}

async function criarChamado(dados) {

    const response = await fetch(`${API_URL}/chamados`, {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify(dados)

    });

    const resposta = await response.json();

    if (!response.ok) {

        throw new Error(
            resposta.message || "Erro ao criar chamado."
        );

    }

    return resposta;
}
