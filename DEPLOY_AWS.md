# Implantação na AWS EC2

Para imagens publicadas e deploy automático, siga [CI_CD.md](CI_CD.md).
As instruções abaixo de build na VM são o fluxo manual anterior; não as misture
com a operação do Compose de produção, que exige identidade e volume explícitos.

Este guia assume Ubuntu Server 24.04 LTS x86_64 em uma EC2 pública. Substitua
sempre `SEU_DOMINIO`, `SEU_EMAIL`, `IP_DA_VM`, `SEU_IP_PUBLICO` e caminhos de
exemplo. Os comandos devem ser executados na raiz do repositório, salvo indicação.

## 1. Pré-requisitos

- EC2 com Ubuntu Server 24.04 LTS x86_64, endereço público e chave SSH.
- Elastic IP associado à instância é recomendado para evitar mudança de IP.
- Registro DNS A de `SEU_DOMINIO` apontando para o Elastic IP.
- Aplicação, bot, token, Application ID, Public Key e canal configurados no Discord.
- Memória suficiente para construir `better-sqlite3`; 2 GiB ou mais é uma margem
  prática. Verifique preços e elegibilidade atuais: este guia não promete Free Tier.

O bot precisa somente de `View Channel`, `Send Messages` e `Embed Links` no canal.

## 2. Security Group mínimo

Configure somente as regras de entrada abaixo:

| Tipo | Porta | Origem |
| --- | ---: | --- |
| SSH | TCP 22 | `SEU_IP_PUBLICO/32` |
| HTTP | TCP 80 | `0.0.0.0/0` |
| HTTPS | TCP 443 | `0.0.0.0/0` |
| HTTP IPv6, se usado | TCP 80 | `::/0` |
| HTTPS IPv6, se usado | TCP 443 | `::/0` |

Não abra 3000, 5432 ou qualquer “porta do SQLite”. O Compose publica 3000 apenas
em `127.0.0.1` e o Nginx é a única entrada pública.

Referência: [regras para servidores web da AWS](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/security-group-rules-reference.html).

## 3. SSH pelo Windows PowerShell

```powershell
ssh -i .\SUA_CHAVE.pem ubuntu@IP_DA_VM
```

Se o OpenSSH reclamar que a chave tem permissões amplas:

```powershell
icacls .\SUA_CHAVE.pem /inheritance:r
icacls .\SUA_CHAVE.pem /grant:r "$($env:USERNAME):(R)"
ssh -i .\SUA_CHAVE.pem ubuntu@IP_DA_VM
```

## 4. Docker Engine e Compose pelo repositório oficial

Remova pacotes conflitantes, se existirem:

```bash
for pkg in docker.io docker-doc docker-compose docker-compose-v2 podman-docker containerd runc; do sudo apt-get remove -y "$pkg"; done
```

Cadastre o repositório APT oficial e instale Engine, Buildx e Compose:

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

sudo tee /etc/apt/sources.list.d/docker.sources >/dev/null <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}")
Components: stable
Architectures: $(dpkg --print-architecture)
Signed-By: /etc/apt/keyrings/docker.asc
EOF

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker
sudo docker run --rm hello-world
sudo usermod -aG docker "$USER"
```

Saia da sessão SSH e entre novamente para aplicar o grupo, depois valide:

```bash
docker version
docker compose version
```

Não use o script de conveniência em produção. Consulte a
[instalação oficial do Docker no Ubuntu](https://docs.docker.com/engine/install/ubuntu/).

## 5. Obter o projeto

Clone o GitHub; não transfira o ZIP original com `.env`, `node_modules` e banco:

```bash
git clone https://github.com/dacelofe/helpdesk-ti-discord.git
cd helpdesk-ti-discord
git status --short --branch
```

## 6. Criar o `.env` com segurança

Crie o arquivo diretamente na VM com modo 600 e edite em um editor, evitando
colocar segredos na linha de comando ou no histórico do shell:

```bash
umask 077
cp .env.example .env
chmod 600 .env
nano .env
```

No Nano: substitua todos os placeholders, pressione `Ctrl+O`, `Enter` e `Ctrl+X`.
Mantenha `NODE_ENV=production`, `DB_PATH=/data/helpdesk.db` e
`DISCORD_VALIDATE_SIGNATURE=true`.

Valide apenas presença/ausência, sem imprimir valores:

```bash
for name in NODE_ENV PORT DB_PATH APP_PORT DISCORD_TOKEN DISCORD_CHANNEL_ID DISCORD_APPLICATION_ID DISCORD_PUBLIC_KEY DISCORD_VALIDATE_SIGNATURE; do
  if grep -Eq "^${name}=.+" .env; then
    printf '%s: presente\n' "$name"
  else
    printf '%s: ausente\n' "$name"
  fi
done
stat -c '%a %n' .env
```

O resultado de `stat` deve começar com `600`. A chave pública deve ter exatamente
64 caracteres hexadecimais. O token nunca deve aparecer em logs, screenshots ou Git.

## 7. Validar, construir e subir

`docker compose config` sem `--quiet` expande variáveis; não publique sua saída.

```bash
docker compose config --quiet
docker compose build --pull
docker compose up -d
docker compose ps
docker compose logs --tail=100 app
```

Espere o estado `healthy`:

```bash
container_id=$(docker compose ps -q app)
docker inspect --format '{{.State.Health.Status}}' "$container_id"
curl --fail --silent http://127.0.0.1:3000/health/live
curl --silent http://127.0.0.1:3000/health/ready
```

Liveness confirma o processo HTTP. Readiness retorna 200 somente quando SQLite e
Discord estão prontos; durante uma indisponibilidade do Discord, 503 é esperado.

## 8. Nginx no host

```bash
sudo apt-get update
sudo apt-get install -y nginx
sudo cp deploy/nginx/helpdesk.conf.example /etc/nginx/sites-available/helpdesk
sudo nano /etc/nginx/sites-available/helpdesk
```

Troque `SEU_DOMINIO`, salve, habilite e teste:

```bash
sudo ln -sf /etc/nginx/sites-available/helpdesk /etc/nginx/sites-enabled/helpdesk
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl enable --now nginx
curl --fail --silent -H 'Host: SEU_DOMINIO' http://127.0.0.1/health/live
```

O exemplo encaminha `Host`, `X-Real-IP`, `X-Forwarded-For` e
`X-Forwarded-Proto` para `http://127.0.0.1:3000`. A aplicação confia em exatamente
um proxy, necessário para o rate limit de 10 tentativas por IP a cada 15 minutos.

## 9. HTTPS com Certbot

Só prossiga quando `dig +short SEU_DOMINIO` retornar o IP da VM e a porta 80
estiver acessível externamente.

```bash
sudo snap install core
sudo snap refresh core
sudo snap install --classic certbot
sudo ln -sf /snap/bin/certbot /usr/local/bin/certbot
sudo certbot --nginx -d SEU_DOMINIO -m SEU_EMAIL --agree-tos --no-eff-email
sudo certbot renew --dry-run
curl --fail --silent https://SEU_DOMINIO/health/live
```

O método snap é o recomendado nas
[instruções oficiais do Certbot para Nginx](https://certbot.eff.org/instructions?os=snap&ws=nginx).

## 10. Endpoint de interações do Discord

No Discord Developer Portal, abra a aplicação e configure **Interactions Endpoint
URL** como:

```text
https://SEU_DOMINIO/webhook/discord
```

Ao salvar, o Discord valida o endpoint com PING e também verifica se requisições
com assinatura inválida recebem 401. Esse 401 é obrigatório e não deve ser
convertido em 200 pelo Nginx. O PING autenticado recebe `{"type":1}`.

Referência: [recebimento e resposta de interações do Discord](https://docs.discord.com/developers/interactions/receiving-and-responding).

Sem domínio, um túnel HTTPS pode ser usado apenas para teste temporário. Não é o
modelo de implantação permanente deste guia.

## 11. Registrar o slash command

Execute sob demanda; isso cria um contêiner temporário, não um segundo bot
persistente:

```bash
docker compose run --rm app npm run register
```

O comando global `/status` pode levar algum tempo para aparecer no Discord.

## 12. Teste ponta a ponta

1. Abra `https://SEU_DOMINIO/` e confirme os estados do dashboard.
2. Abra um chamado válido. Confirme protocolo e embed no canal, sem menções.
3. Confirme o registro sem imprimir descrição ou credenciais:

```bash
docker compose exec app node -e "const db=require('./src/database/database'); console.table(db.prepare('SELECT protocolo,status,created_at FROM chamados ORDER BY id DESC LIMIT 5').all()); db.close()"
```

4. Salve a URL no Developer Portal e confirme o PING validado.
5. Execute `/status` no Discord.
6. Confira `https://SEU_DOMINIO/health/live` e `/health/ready`.

## 13. Atualização segura

Faça backup antes de atualizar:

```bash
git status --short
git pull --ff-only
docker compose build --pull
docker compose up -d
docker compose ps
curl --fail --silent http://127.0.0.1:3000/health/live
docker image prune -f
```

Não use `docker volume prune` e não execute `docker compose down -v`.

## 14. Backup e restauração do SQLite

O backup on-line usa a API de backup do SQLite e é copiado para fora do volume:

```bash
mkdir -p "$HOME/helpdesk-backups"
chmod 700 "$HOME/helpdesk-backups"
backup_file="$HOME/helpdesk-backups/helpdesk-$(date -u +%Y%m%dT%H%M%SZ).db"
docker compose exec -T app node -e "const db=require('./src/database/database'); db.backup('/data/.backup-export.db').then(()=>db.close()).catch((e)=>{console.error(e.name);process.exit(1)})"
container_id=$(docker compose ps -q app)
docker cp "$container_id:/data/.backup-export.db" "$backup_file"
docker compose exec -T app node -e "require('node:fs').unlinkSync('/data/.backup-export.db')"
chmod 600 "$backup_file"
ls -lh "$backup_file"
```

Copie backups para armazenamento externo protegido e defina retenção. Teste a
restauração periodicamente. Para restaurar, faça antes outro backup, escolha um
arquivo conhecido e pare o aplicativo:

```bash
restore_file=/CAMINHO/ABSOLUTO/helpdesk-AAAAMMDDTHHMMSSZ.db
test -f "$restore_file"
docker compose stop app
docker compose run --rm --no-deps -v "$restore_file:/restore/helpdesk.db:ro" app node -e "const fs=require('node:fs'); for (const f of ['/data/helpdesk.db-wal','/data/helpdesk.db-shm']) fs.rmSync(f,{force:true}); fs.copyFileSync('/restore/helpdesk.db','/data/helpdesk.db')"
docker compose up -d
docker compose ps
```

Para importar uma cópia antiga, use o mesmo procedimento somente depois de
validar e guardar backup. Nunca copie um banco ativo nem versione o arquivo.

## 15. Rollback sem excluir o volume

Anote primeiro o commit atual e selecione uma tag ou hash conhecido:

```bash
git rev-parse --short HEAD
git fetch --tags --prune
git switch --detach TAG_OU_COMMIT_ANTERIOR
docker compose build --pull
docker compose up -d
docker compose ps
```

O volume nomeado permanece. Confirme compatibilidade do esquema antes de voltar
para uma versão muito antiga. Para retornar à linha principal:

```bash
git switch main
git pull --ff-only
docker compose up -d --build
```

## 16. Diagnóstico

```bash
docker compose ps
docker compose logs --tail=200 app
container_id=$(docker compose ps -q app)
docker inspect --format '{{json .State.Health}}' "$container_id"
curl -i http://127.0.0.1:3000/health/live
curl -i http://127.0.0.1:3000/health/ready
curl -i -X POST -H 'Content-Type: application/json' -d '{"type":1}' http://127.0.0.1:3000/webhook/discord
sudo nginx -t
systemctl status nginx --no-pager
sudo ss -lntp | grep -E ':(80|443|3000)\b'
dig +short SEU_DOMINIO
curl -4 https://icanhazip.com
```

O POST sem assinatura deve retornar 401. Em `ss`, a porta 3000 deve aparecer em
`127.0.0.1:3000`, nunca em `0.0.0.0:3000` ou `[::]:3000`. Se houver falha no
Discord, confirme permissões do bot e os nomes das variáveis no `.env`, sem
imprimir seus valores.
