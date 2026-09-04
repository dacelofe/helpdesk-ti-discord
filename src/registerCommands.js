require("dotenv").config();

const { REST, Routes, SlashCommandBuilder } = require("discord.js");
const { getConfig } = require("./config");

const config = getConfig();

const commands = [

    new SlashCommandBuilder()

        .setName("status")

        .setDescription("Verifica se o HelpDesk TI está online.")

].map(command => command.toJSON());

const rest = new REST({

    version: "10"

}).setToken(

    config.discord.token

);

(async () => {

    try {

        console.log("");

        console.log("====================================");

        console.log("REGISTRANDO SLASH COMMANDS");

        console.log("====================================");

        await rest.put(

            Routes.applicationCommands(

                config.discord.applicationId

            ),

            {

                body: commands

            }

        );

        console.log("");

        console.log("Slash Commands registrados com sucesso.");

        console.log("");

    }

    catch (erro) {

        console.error(erro);

    }

})();
