const form = document.getElementById("formChamado");

form.addEventListener("submit", async function (e) {

    e.preventDefault();

    console.log("================================");
    console.log("Formulário enviado.");
    console.log("================================");

    const dados = {

        nome: document.getElementById("nome").value,

        departamento:
            document.getElementById("departamento").value,

        categoria:
            document.getElementById("categoria").value,

        prioridade:
            document.querySelector(
                "input[name='prioridade']:checked"
            ).value,

        descricao:
            document.getElementById("descricao").value

    };

    console.log("Dados do chamado:", dados);

    const botao = form.querySelector("button[type='submit']");

    try {

        // Desabilita o botão durante o envio
        botao.disabled = true;

        botao.innerHTML = `
            <i class="bi bi-hourglass-split"></i>
            Enviando...
        `;

        const resposta = await criarChamado(dados);

        console.log("Resposta recebida:", resposta);

        // Exibe o card de resultado
        const resultado =
            document.getElementById("resultado");

        resultado.style.display = "block";

        // Preenche os dados
        document.getElementById("protocolo").innerText =
            resposta.protocolo ?? "--";

        document.getElementById("status").innerText =
            resposta.status ?? "--";

        document.getElementById("discordId").innerText =
            resposta.discordMessageId ?? "--";

        // Limpa o formulário
        form.reset();

        // Volta o botão ao estado normal
        botao.disabled = false;

        botao.innerHTML = `
            <i class="bi bi-send-fill"></i>
            Abrir Chamado
        `;

        // Rola até o resultado
        resultado.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

    }

    catch (erro) {

        console.error(
            "Erro ao enviar chamado:",
            erro
        );

        alert(
            "Não foi possível enviar o chamado.\n\n" +
            erro.message
        );

        // Reativa o botão
        botao.disabled = false;

        botao.innerHTML = `
            <i class="bi bi-send-fill"></i>
            Abrir Chamado
        `;

    }

});