# 🎫 HelpDesk TI Discord

Sistema Web para abertura e gerenciamento de chamados de suporte técnico com integração ao Discord, desenvolvido em **Node.js**, **Express**, **SQLite** e **Discord API**.

O projeto permite que um usuário abra um chamado através de uma interface web, registre as informações em um banco de dados SQLite e envie automaticamente uma notificação para um canal do Discord utilizando um Bot.

---

# 📌 Funcionalidades

- ✅ Dashboard Web
- ✅ Abertura de chamados
- ✅ Integração com Bot do Discord
- ✅ Envio automático de Embed para um canal
- ✅ Banco de dados SQLite
- ✅ Persistência dos chamados
- ✅ Registro das interações do Discord
- ✅ Webhook para Discord Interactions
- ✅ Slash Command
- ✅ Integração utilizando ngrok
- ✅ Configuração através de variáveis de ambiente

---

# 🛠 Tecnologias Utilizadas

- Node.js
- Express.js
- Discord.js v14
- SQLite
- Better-SQLite3
- dotenv
- CORS
- Axios
- TweetNaCl (validação de assinatura)
- ngrok

---

# 📁 Estrutura do Projeto

```
CHAMADO/
│
├── public/
│   ├── css/
│   ├── js/
│   ├── index.html
│   └── novoChamado.html
│
├── src/
│   ├── config/
│   ├── controllers/
│   ├── database/
│   ├── repositories/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── registerCommands.js
│   ├── app.js
│   └── server.js
│
├── helpdesk.db
├── package.json
├── .env.example
├── .gitignore
└── README.md
```

---

# 🚀 Instalação

Clone o repositório:

```bash
git clone https://github.com/dacelofe/helpdesk-ti-discord.git
```

Entre na pasta:

```bash
cd helpdesk-ti-discord
```

Instale as dependências:

```bash
npm install
```

---

# ⚙ Configuração do .env

Crie um arquivo chamado:

```
.env
```

Utilize o seguinte modelo:

```env
PORT=3000

DISCORD_TOKEN=SEU_TOKEN_DO_BOT

DISCORD_CHANNEL_ID=ID_DO_CANAL

DISCORD_APPLICATION_ID=APPLICATION_ID

DISCORD_PUBLIC_KEY=PUBLIC_KEY

DISCORD_VALIDATE_SIGNATURE=false
```

> **Importante:** Nunca envie o arquivo `.env` para o GitHub.

---

# ▶ Executando o Projeto

Modo desenvolvimento:

```bash
npm run dev
```

ou

```bash
node src/server.js
```

Servidor:

```
http://localhost:3000
```

---

# 🤖 Configuração do Bot Discord

1. Acesse o Discord Developer Portal.
2. Crie uma nova aplicação.
3. Crie um Bot.
4. Copie o **Bot Token**.
5. Copie a **Application ID**.
6. Copie a **Public Key**.
7. Convide o Bot para o servidor.
8. Conceda permissão para:

- View Channel
- Send Messages
- Embed Links

---

# 🌐 Configuração do ngrok

Execute:

```bash
ngrok http 3000
```

Será gerada uma URL semelhante a:

```
https://xxxxxxxx.ngrok-free.app
```

Configure essa URL no Discord:

```
https://xxxxxxxx.ngrok-free.app/webhook/discord
```

---

# 📡 Registro dos Slash Commands

Execute apenas uma vez:

```bash
npm run register
```

ou

```bash
node src/registerCommands.js
```

Após alguns segundos o comando estará disponível:

```
/status
```

---

# 💾 Banco de Dados

O sistema utiliza SQLite.

Principais tabelas:

## chamados

Armazena os chamados criados pela aplicação.

Campos principais:

- protocolo
- nome
- departamento
- categoria
- prioridade
- descricao
- discord_message_id

---

## mensagens

Armazena as interações recebidas do Discord.

Campos principais:

- id_externo
- status
- payload_bruto

---

# 🔄 Fluxo da Aplicação

```
Usuário

        │

        ▼

Interface Web

        │

        ▼

Express API

        │

        ▼

SQLite

        │

        ▼

Discord Bot

        │

        ▼

Canal de Suporte
```

---

# 📋 Fluxo das Interações

```
Discord

      │

      ▼

Webhook

      │

      ▼

Validação da Assinatura

      │

      ▼

Persistência SQLite

      │

      ▼

Resposta ao Discord
```

---

# 🔐 Segurança

O projeto utiliza:

- Variáveis de ambiente
- Token fora do Git
- Public Key fora do Git
- Validação da assinatura do Discord (Ed25519)
- `.gitignore`

---

# 🧪 Testes Realizados

- Abertura de chamado pela interface
- Persistência no SQLite
- Envio para o Discord
- Slash Command
- Registro das interações
- Webhook
- Integração via ngrok

---

# 📷 Evidências Recomendadas

Para apresentação do projeto, recomenda-se registrar:

- Interface Web
- Chamado criado
- Mensagem enviada ao Discord
- Banco SQLite
- Slash Command
- Endpoint configurado
- Repositório GitHub

---

# 📈 Melhorias Futuras

- Sistema de autenticação de usuários
- Painel administrativo
- Fechamento e reabertura de chamados
- Dashboard com indicadores
- Histórico de atendimentos
- Notificações em tempo real
- Integração com e-mail
- Upload de anexos
- API REST documentada com Swagger

---

# 👨‍💻 Autor

**Marcelo Felipe**

Projeto desenvolvido para a disciplina de Desenvolvimento de Sistemas, demonstrando integração entre aplicações Web, banco de dados SQLite e a API oficial do Discord.

---

# 📄 Licença

Este projeto possui finalidade exclusivamente acadêmica.
