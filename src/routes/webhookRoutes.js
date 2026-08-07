const express = require("express");

const router = express.Router();

const webhookController = require("../controllers/webhookController");

router.post(

    "/discord",

    webhookController.receberWebhook

);

module.exports = router;