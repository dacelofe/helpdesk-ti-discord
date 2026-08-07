require("dotenv").config();

const { REST, Routes, SlashCommandBuilder } = require("discord.js");

const commands = [

    new SlashCommandBuilder()

        .setName("status")

        .setDescription("Verifica se o HelpDesk TI está online.")

].map(command => command.toJSON());

const rest = new REST({

    version: "10"

}).setToken(

    process.env.DISCORD_TOKEN

);

(async () => {

    try {

        console.log("");

        console.log("====================================");

        console.log("REGISTRANDO SLASH COMMANDS");

        console.log("====================================");

        await rest.put(

            Routes.applicationCommands(

                process.env.DISCORD_APPLICATION_ID

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