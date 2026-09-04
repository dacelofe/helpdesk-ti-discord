# HelpDesk TI Discord

Aplicação web para abertura de chamados, persistência em SQLite e envio de embeds
para um canal do Discord. O frontend e a API são servidos pelo mesmo Express e,
em produção, ficam atrás de Nginx com HTTPS.

## Requisitos

- Node.js 22 ou superior (`better-sqlite3` exige essa versão)
- npm
- Credenciais de uma aplicação/bot Discord
- Docker Engine com o plugin Compose para implantação em contêiner

## Configuração

Copie `.env.example` para `.env` e substitua todos os placeholders. Nunca versione
o `.env` nem bancos SQLite.

| Variável | Uso |
| --- | --- |
| `NODE_ENV` | `development`, `test` ou `production` |
| `PORT` | porta HTTP interna; padrão 3000 |
| `APP_PORT` | porta de loopback publicada pelo Compose; padrão 3000 |
| `DB_PATH` | caminho do SQLite; em produção, `/data/helpdesk.db` |
| `DISCORD_TOKEN` | token do bot |
| `DISCORD_CHANNEL_ID` | canal que recebe os chamados |
| `DISCORD_APPLICATION_ID` | ID usado no registro do slash command |
| `DISCORD_PUBLIC_KEY` | chave Ed25519 pública, 64 caracteres hexadecimais |
| `DISCORD_VALIDATE_SIGNATURE` | deve ser `true` em produção |

Em produção, a inicialização falha se faltar uma variável Discord obrigatória ou
se a validação de assinatura estiver desativada.

## Desenvolvimento

```bash
npm ci
npm run check
npm test
npm start
```

Sem token em desenvolvimento, o servidor HTTP sobe e informa Discord como
indisponível; importar a aplicação em testes nunca executa login automaticamente.

## Docker Compose

```bash
docker compose config --quiet
docker compose up -d --build
docker compose ps
```

O serviço roda como usuário não-root, com filesystem raiz somente leitura e volume
nomeado em `/data`. A publicação é `127.0.0.1:3000`; não abra essa porta na internet.

Endpoints operacionais:

- `GET /health/live`: liveness usada pelo healthcheck do contêiner.
- `GET /health/ready`: 200 apenas com SQLite e Discord prontos; caso contrário 503.
- `GET /api/status`: estado usado pelo dashboard.
- `POST /api/chamados`: cria um chamado; limite de 10 pedidos por IP em 15 minutos.
- `POST /webhook/discord`: interações Discord autenticadas por Ed25519 sobre o corpo bruto.

O endpoint de chamados valida tipos, comprimentos e prioridade. O embed bloqueia
menções. Se o SQLite persistir o chamado, mas o Discord falhar, o registro recebe
o estado `Falha no envio` e a API responde 502 sem expor detalhes internos.

## Discord

O bot usa apenas o Gateway Intent `Guilds`. No canal, conceda `View Channel`,
`Send Messages` e `Embed Links`.

Para registrar o comando global `/status`:

```bash
npm run register
```

Em Compose, use um contêiner temporário:

```bash
docker compose run --rm app npm run register
```

A URL de interações permanente deve ser
`https://SEU_DOMINIO/webhook/discord`. O webhook devolve 401 para assinatura
ausente/inválida, `{ "type": 1 }` para PING autenticado e resposta `type: 4` para
o comando de aplicação.

## Segurança e persistência

- `.dockerignore` exclui Git, `.env`, bancos, módulos do host, logs e backups.
- Helmet aplica headers defensivos e CSP compatível com Google Fonts e Bootstrap Icons.
- CORS não é habilitado porque frontend e API compartilham a mesma origem.
- SQLite usa `foreign_keys=ON`, `busy_timeout=5000` e WAL para uma única instância.
- Segredos, payloads brutos e conteúdo integral de chamados não são registrados em logs.

Não use mais de uma réplica escrevendo no mesmo arquivo SQLite. Para backup,
restauração, atualização, rollback, Nginx, TLS e diagnóstico em Ubuntu 24.04,
consulte [DEPLOY_AWS.md](DEPLOY_AWS.md).

## Estrutura principal

```text
public/                 frontend estático
src/config/             configuração e ciclo de vida do Discord
src/controllers/        controladores HTTP e saúde
src/database/           conexão, pragmas e schema SQLite
src/services/           regras de chamados, Discord e webhook
test/                   testes node:test
deploy/nginx/            exemplo de proxy reverso
Dockerfile              imagem de produção Node 22 Debian slim
compose.yaml             serviço e volume persistente
```

## Licença

Projeto acadêmico, licenciado conforme o arquivo `package.json`.
