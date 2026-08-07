const express = require("express");
const cors = require("cors");
const path = require("path");

const chamadoRoutes = require("./routes/chamadoRoutes");
const webhookRoutes = require("./routes/webhookRoutes");

const app = express();

app.use(cors());

app.use(express.json());

/*
    Front-end
*/

app.use(express.static(path.join(__dirname, "../public")));

/*
    Rotas da API
*/

app.use("/api", chamadoRoutes);
app.use("/webhook", webhookRoutes);

module.exports = app;