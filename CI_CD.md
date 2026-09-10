# CI/CD — HelpDesk TI Discord

O backend continua Node.js 22/Express com SQLite e Discord. A VM executa a
imagem runtime; Nginx no host encaminha HTTPS para `127.0.0.1:3000`.
O deploy está condicionado a `ENABLE_AWS_DEPLOY=true`, sem valor padrão ativo.

## Eventos e publicação

| Evento | Testes e builds | Docker Hub | EC2 |
| --- | --- | --- | --- |
| PR para main | Sim | Não | Não |
| push em main | Sim | Após testes | Somente com gate e environment production |
| manual em main | Sim | Após testes | Mesmo gate |
| manual em outra branch | Sim | Não | Não |

Falhas bloqueiam os jobs dependentes. O job `tests` deve ser configurado como
check obrigatório na proteção da main. Não há merge automático.
Publicação gera `marcelobarbusa/helpdesk-ti-discord:latest` e
`:sha-<SHA completo de 40 caracteres>`. O digest é passado diretamente ao
deploy; `latest` não é usado para implantar. Tags podem ser sobrescritas numa
reexecução; registre sempre o digest para reprodução exata.

O build usa a plataforma nativa do runner `ubuntu-latest` (atualmente amd64),
sem definir uma plataforma da EC2 ainda desconhecida. Antes de ativar, confira
`uname -m` e `docker info --format '{{.Architecture}}'` na VM. Para ARM64,
ajuste e valide builds/testes ARM64 com runner nativo ou Buildx/QEMU antes
da ativação. O script recusa imagem com arquitetura diferente da VM.

## Configuração no GitHub

Settings → Secrets and variables → Actions:

| Tipo | Nome | Uso |
| --- | --- | --- |
| Secret | DOCKERHUB_USERNAME | Já cadastrado; conta autorizada a publicar |
| Secret | DOCKERHUB_TOKEN | Já cadastrado; token Docker Hub |
| Secret | EC2_HOST | IPv4 ou hostname da VM, sem protocolo ou porta |
| Secret | EC2_USER | Usuário Linux de deploy |
| Secret | EC2_SSH_PRIVATE_KEY | Chave privada dedicada, utilizável sem prompt |
| Secret | EC2_KNOWN_HOSTS | Linha(s) OpenSSH com a chave do servidor verificada |
| Repository variable | ENABLE_AWS_DEPLOY | Ausente/false até concluir preparação; true ativa |

Crie environment `production`, restrito à main, com aprovação se desejado.
Não copie secrets para código, logs ou conversa. Cadastre-os pela interface
oficial. Obtenha a fingerprint do servidor por canal confiável, por exemplo
console/SSM já autorizado, e compare com a chave coletada antes de cadastrar
known_hosts. Executar ssh-keyscan sozinho não comprova identidade. O workflow
usa BatchMode, StrictHostKeyChecking, timeout e arquivo known_hosts dedicado.

## Preparação única da VM (com destino confirmado)

Não crie recursos pagos automaticamente. Confirme SO, arquitetura, endereço,
aplicação atual, banco, volume, domínio e política de rede primeiro.

O runner precisa alcançar a EC2 na porta 22. Autorizar apenas o IP pessoal
não autoriza GitHub Actions. Não abra `0.0.0.0/0` para SSH. Uma opção é um
runner de deploy dedicado, administrado e isolado na mesma VPC/rede privada,
com Security Group permitindo SSH somente desse runner. Nesse caso altere
somente `deploy.runs-on` para seus labels, mantenha testes de PR nos runners
hospedados e valide a conectividade. Outra opção, se já disponível no plano,
é runner hospedado com saída IP estática, autorizando somente esse IP /32.
O workflow atual usa runner hospedado padrão; **a rede precisa ser resolvida
antes de habilitar o gate**. Não cria runner, VPN ou infraestrutura.

Para Ubuntu compatível, siga a instalação oficial de Engine e Compose plugin
em [Docker no Ubuntu](https://docs.docker.com/engine/install/ubuntu/) e a seção
4 de [DEPLOY_AWS.md](DEPLOY_AWS.md). Não desinstale Docker de VM em uso sem
avaliar a instalação atual. Requer Bash, Python 3, tar, util-linux (flock),
coreutils (timeout), OpenSSH e Compose com `up --wait --wait-timeout`.
Verifique `docker version`, `docker compose version` e `docker compose up --help`.

O usuário precisa executar `docker info` sem sudo nem senha; associação ao
grupo docker concede privilégios equivalentes a root. Use usuário e chave
dedicados; após `sudo usermod -aG docker USUARIO`, abra nova sessão. Prepare:

```bash
sudo install -d -m 750 -o "$USER" -g "$(id -gn)" /opt/helpdesk
mkdir -p /opt/helpdesk/releases
```

Preserve o `.env` existente. Se estiver em outra pasta, copie-o de forma
protegida para `/opt/helpdesk/.env` sem sobrescrever um arquivo já existente;
confira a equivalência sem imprimir os valores. Para instalação nova, preencha
localmente a partir de `.env.example`, usando editor. Permissão `600`, dono
usuário de deploy, assinatura Discord habilitada. O workflow nunca transfere
nem gera esse arquivo. Imagem privada exige login Docker Hub **na VM**, com
credencial de leitura cadastrada por canal seguro. O login do runner não é
repassado à VM. A VM também precisa de saída HTTPS para Docker Hub e Discord.

## Identificar e preservar o SQLite antes da primeira implantação

Na VM, identifique o contêiner correto, sem imprimir seu ambiente:

```bash
docker ps --format 'table {{.ID}}\t{{.Names}}\t{{.Image}}'
container_id=ID_CONFIRMADO
docker inspect --format '{{index .Config.Labels "com.docker.compose.project"}}' "$container_id"
docker inspect --format '{{range .Mounts}}{{println .Type .Name .Source "->" .Destination}}{{end}}' "$container_id"
```

Registre o projeto Compose e o volume montado em `/data`. Confirme que contém
o banco esperado, com contagens/protocolos conhecidos e backup consistente
pela API SQLite descrita na seção 14 de DEPLOY_AWS.md. Não copie banco ativo
ignorando WAL. Guarde backup fora do volume e teste restauração separadamente.

Em `/opt/helpdesk/.settings.env`, escreva **valores reais identificados**:

```dotenv
COMPOSE_PROJECT_NAME=projeto_atual_confirmado
HELPDESK_DATA_VOLUME=volume_atual_confirmado
APP_PORT=3000
```

Não use esses placeholders literalmente. O mesmo projeto permite substituir
o serviço `app` atual mesmo mudando de pasta. O volume é `external: true` e
não será criado automaticamente. Confirme com `docker volume inspect NOME`.
O script recusa mudança de volume quando encontra um serviço app nesse projeto.
Um nome de projeto errado pode esconder o contêiner antigo; por isso a inspeção
manual inicial é obrigatória. Não execute dois bots sobre o mesmo banco.

Se o banco atual estiver em bind mount, fora de `/data`, em outro serviço ou
diretamente no host, pare aqui e planeje migração com backup consistente e janela
de parada. Não crie volume vazio para contornar o problema. Para VM comprovadamente
nova e sem dados, crie um volume explicitamente e teste escrita por UID/GID 1000
(usuário node da imagem); ajuste proprietário somente desse volume novo.
Não execute `down -v`, `volume prune` nem remova bancos.

## Nginx, HTTPS e ativação

Use `deploy/nginx/helpdesk.conf.example` e as seções 8–10 de DEPLOY_AWS.md:
ajuste domínio, instale Nginx no host, execute `sudo nginx -t`, configure DNS e
Certbot, valide renovação e HTTPS. Mantenha porta 3000 restrita a loopback e
80/443 conforme necessidade. A implantação não sobrescreve Nginx ou certificados.

Somente após confirmar destino, rede do runner, fingerprint, Docker, arquitetura,
volume, backup, `.env` e environment, defina `ENABLE_AWS_DEPLOY=true`. Execute
o workflow manualmente selecionando **main**, ou faça merge do PR revisado.
Uma execução manual em outra branch só testa. Desativar a variável bloqueia
execuções futuras; não cancela um deploy já iniciado.

## Operação, validação e rollback

Releases ficam em `/opt/helpdesk/releases/RUN_ID-RUN_ATTEMPT`. Cada uma inclui
Compose e scripts; o script aplica lock local, valida configuração, baixa o
digest e força recriação. `up --wait` tem 180 s, comando remoto 600 s e job
15 min. Erros retornam status diferente de zero. Só há sucesso após comparar
referência, ID local da imagem e saúde do novo contêiner.

`.deployment.env` registra a versão tentada e o caminho do Compose;
`.previous.env` guarda a tentativa anterior; `.last-success.env` guarda o último
sucesso. Em falha não há rollback automático nem garantia de disponibilidade:
inspecione e recupere explicitamente. Guarde esses arquivos e releases para
rollback; não há limpeza automática. `.settings.env` mantém projeto e volume.

Use sempre os dois env-files, sem depender do diretório para nomear o projeto:

```bash
cd /opt/helpdesk
docker compose --env-file .settings.env --env-file .deployment.env ps
docker compose --env-file .settings.env --env-file .deployment.env config --quiet
# Atalho equivalente, usando o script de uma release instalada:
bash releases/RUN_ID-RUN_ATTEMPT/compose.sh ps
curl --fail --silent http://127.0.0.1:3000/health/live
curl --fail --silent https://SEU_DOMINIO/health/ready
```

Saúde do contêiner usa liveness. Readiness inclui Discord e deve ser comprovada
na validação operacional; 503 indica dependência indisponível. Verifique chamado
real e PING assinado; chamada sem assinatura deve retornar 401. Não confunda
liveness com integração Discord validada. Logs podem conter dados de chamados;
colete somente trechos revisados e sem dados sensíveis.

Para rollback, escolha uma release conhecida e seu digest registrado no Actions
ou em `.previous.env` (confira se era bem-sucedida). Após falha, `.last-success.env`
é outra fonte. Verifique compatibilidade de esquema e backup antes:

```bash
cd /opt/helpdesk
bash releases/RELEASE_CONHECIDA/deploy.sh sha256:DIGEST_CONHECIDO
```

O mesmo script usa o Compose dessa release, preserva volume e verifica imagem
e saúde. Rollback de código não desfaz alterações no banco. Para backup e
registro de slash commands, adapte os comandos do guia antigo adicionando
`--env-file .settings.env --env-file .deployment.env`; não volte ao Compose de
build local para operar a instalação CI/CD.

## Validação e evidências

PowerShell 5.1, raiz do repositório:

```powershell
npm.cmd ci
if ($LASTEXITCODE -ne 0) { throw 'npm ci falhou' }
npm.cmd run check
if ($LASTEXITCODE -ne 0) { throw 'check falhou' }
npm.cmd test
if ($LASTEXITCODE -ne 0) { throw 'testes falharam' }
docker build --target test -t helpdesk-cicd-test:local .
if ($LASTEXITCODE -ne 0) { throw 'build test falhou' }
docker build --target runtime -t helpdesk-cicd-runtime:local .
if ($LASTEXITCODE -ne 0) { throw 'build runtime falhou' }
docker run --rm --mount "type=bind,source=$($PWD.Path),target=/repo,readonly" --workdir /repo rhysd/actionlint@sha256:b1934ee5f1c509618f2508e6eb47ee0d3520686341fec936f3b79331f9315667 .github/workflows/ci-cd.yml
if ($LASTEXITCODE -ne 0) { throw 'actionlint falhou' }
git diff --check
if ($LASTEXITCODE -ne 0) { throw 'diff invalido' }
```

No Windows, better-sqlite3 pode precisar de Visual Studio Build Tools C++.
Docker permite validar Node 22 sem trocar o Node local. O job tests também
valida o Compose com ambiente fictício e `--quiet`; actionlint verifica as
expressões Actions, além da estrutura YAML. Nunca publique `compose config`
expandido nem `docker inspect` completo de contêineres reais.

Registre no manual: SHA/PR, URL e resultado de cada job, tags/digest do Hub,
arquitetura, projeto/volume confirmado, evidência de backup, ID/imagem/saúde do
contêiner após deploy, HTTPS/readiness, chamado no Discord e rollback testado.
Diferencie implementação, validação local, Actions, publicação e AWS; um build
local não comprova publicação ou deploy.

Validação desta implementação: os 8 testes de aplicação passaram em Node 22
no Docker; os builds test/runtime passaram (com cache). Os cinco cenários
isolados do deploy passaram: volume ausente, volume divergente, falha de saúde,
imagem antiga ainda saudável e sucesso com imagem esperada. Esse teste usa
Docker simulado dentro de contêiner descartável; não comprova SSH ou EC2.
Compose com dados fictícios, actionlint (incluindo expressões), ShellCheck e
sintaxe Bash passaram. No Windows/Node 24, o check passou; npm ci/testes nativos
ficaram limitados pela ausência de Build Tools C++ para better-sqlite3.
Resultados de Actions, Hub e AWS devem ser anexados após execuções reais.

Referências oficiais consultadas: [checkout](https://github.com/actions/checkout),
[setup-node](https://github.com/actions/setup-node),
[Buildx](https://github.com/docker/setup-buildx-action),
[login](https://github.com/docker/login-action),
[build/push e digest](https://github.com/docker/build-push-action),
[Compose up e espera](https://docs.docker.com/reference/cli/docker/compose/up/).
