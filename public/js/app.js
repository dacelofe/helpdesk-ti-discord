document.addEventListener("DOMContentLoaded", async () => {

    const status = await verificarStatus();

    document.getElementById("backendStatus").innerText = status.backend;

    document.getElementById("discordStatus").innerText = status.discord;

});