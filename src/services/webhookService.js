const mensagemService = require("./mensagemService");

exports.processar = async (body) => {

    console.log("");
    console.log("====================================");
    console.log("EVENTO RECEBIDO DO DISCORD");
    console.log("====================================");

    console.log(JSON.stringify(body, null, 2));
    mensagemService.registrar(body);

    /*
        TYPE 1
        PING
    */

    if (body.type === 1) {

        console.log("PING recebido.");

        return {

            type: 1

        };

    }

    /*
        TYPE 2
        Slash Command
    */

    if (body.type === 2) {

        console.log("Slash Command recebido.");

        return {

            type: 4,

            data: {

                content:
"✅ HelpDesk TI Online\n\nBackend: Online\nBanco SQLite: Conectado\nBot Discord: Conectado\nStatus: Operacional"

            }

        };

    }

    /*
        Outros eventos
    */

    return {

        type: 4,

        data: {

            content: "Evento recebido."

        }

    };

};