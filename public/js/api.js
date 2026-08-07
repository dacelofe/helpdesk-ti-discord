const API_URL = "http://localhost:3000/api";

async function criarChamado(dados) {

    console.log("Enviando chamado para a API...");
    console.log("Dados:", dados);

    const response = await fetch(`${API_URL}/chamados`, {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify(dados)

    });

    console.log("Status HTTP:", response.status);

    const resposta = await response.json();

    console.log("Resposta da API:", resposta);

    if (!response.ok) {

        throw new Error(
            resposta.message || "Erro ao criar chamado."
        );

    }

    return resposta;
}