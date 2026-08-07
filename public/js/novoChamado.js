const form = document.getElementById("formChamado");

console.log("novoChamado.js carregado");

form.addEventListener("submit", async function (e) {

    e.preventDefault();

    console.log("Formulário enviado");

    const dados = {

        nome: document.getElementById("nome").value,
        departamento: document.getElementById("departamento").value,
        categoria: document.getElementById("categoria").value,
        prioridade: document.querySelector("input[name='prioridade']:checked").value,
        descricao: document.getElementById("descricao").value

    };

    console.log("Chamando criarChamado()", dados);

    try {

        const resposta = await criarChamado(dados);

        console.log("Resposta:", resposta);

        // restante do código...

    } catch (erro) {

        console.error("Erro:", erro);

    }

});