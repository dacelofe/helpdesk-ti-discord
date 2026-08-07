require("dotenv").config();

require("./config/discordClient");

const app = require("./app");

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log("--------------------------------");

    console.log("Servidor iniciado");

    console.log(`http://localhost:${PORT}`);

    console.log("--------------------------------");

});