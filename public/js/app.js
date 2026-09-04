document.addEventListener("DOMContentLoaded", async () => {

    try {

        const status = await verificarStatus();

        document.getElementById("backendStatus").innerText = status.backend;

        document.getElementById("discordStatus").innerText = status.discord;

    } catch (erro) {

        document.getElementById("backendStatus").innerText = "Indisponível";
        document.getElementById("discordStatus").innerText = "Indisponível";

        console.error("Falha ao consultar o status da aplicação.", erro);

    }

});
