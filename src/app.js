const express = require("express");
const helmet = require("helmet");
const path = require("path");

const chamadoRoutes = require("./routes/chamadoRoutes");
const healthRoutes = require("./routes/healthRoutes");
const webhookRoutes = require("./routes/webhookRoutes");

const app = express();

app.set("trust proxy", 1);

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: [
                "'self'",
                "https://fonts.googleapis.com",
                "https://cdn.jsdelivr.net"
            ],
            fontSrc: [
                "'self'",
                "data:",
                "https://fonts.gstatic.com",
                "https://cdn.jsdelivr.net"
            ],
            imgSrc: ["'self'", "data:"],
            connectSrc: ["'self'"],
            objectSrc: ["'none'"]
        }
    }
}));

app.use(express.json({
    limit: "100kb",
    verify: (req, res, buffer) => {
        req.rawBody = buffer.toString("utf8");
    }
}));

/*
    Front-end
*/

app.use(express.static(path.join(__dirname, "../public")));

/*
    Rotas da API
*/

app.use("/api", chamadoRoutes);
app.use("/health", healthRoutes);
app.use("/webhook", webhookRoutes);

app.use((erro, req, res, next) => {
    if (erro instanceof SyntaxError || erro.type === "entity.too.large") {
        return res.status(400).json({
            success: false,
            message: "Corpo JSON inválido ou acima do limite permitido."
        });
    }

    console.error(`Erro HTTP não tratado: ${erro.name}.`);
    return res.status(500).json({
        success: false,
        message: "Erro interno do servidor."
    });
});

module.exports = app;
