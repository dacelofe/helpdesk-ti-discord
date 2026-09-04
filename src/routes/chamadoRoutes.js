const express = require("express");
const { rateLimit } = require("express-rate-limit");

const router = express.Router();

const controller = require("../controllers/chamadoController");

router.get("/status", controller.status);

const limiteChamados = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        success: false,
        message: "Muitas tentativas. Aguarde antes de abrir outro chamado."
    }
});

router.post("/chamados", limiteChamados, controller.criarChamado);

module.exports = router;
