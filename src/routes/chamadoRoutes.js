const express = require("express");

const router = express.Router();

const controller = require("../controllers/chamadoController");

router.get("/status", controller.status);

router.post("/chamados", controller.criarChamado);

module.exports = router;