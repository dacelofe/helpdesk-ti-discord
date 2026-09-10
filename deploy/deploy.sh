#!/usr/bin/env bash
set -euo pipefail
umask 077
release=$(cd "$(dirname "$0")" && pwd)
cd /opt/helpdesk
exec 9>.deploy.lock
flock -w 300 9
digest=${1:?Published digest required}
[[ "$digest" =~ ^sha256:[a-f0-9]{64}$ ]] || { echo 'Invalid digest'; exit 1; }
test -s .env
test -s .settings.env
# Settings are Compose dotenv data, never sourced as shell code.
candidate=$(mktemp /opt/helpdesk/.candidate.XXXXXX)
trap 'rm -f "$candidate"' EXIT
printf 'IMAGE_VERSION=@%s\nCOMPOSE_FILE=%s/compose.prod.yaml\nHELPDESK_ENV_FILE=/opt/helpdesk/.env\n' "$digest" "$release" > "$candidate"
compose=(docker compose --env-file .settings.env --env-file "$candidate")
"${compose[@]}" config --quiet
# Inspect only non-secret fields; never print the expanded service environment.
volume=$("${compose[@]}" config --format json | python3 -c 'import json,sys; print(json.load(sys.stdin)["volumes"]["helpdesk_data"]["name"])')
project=$("${compose[@]}" config --format json | python3 -c 'import json,sys; print(json.load(sys.stdin)["name"])')
grep -Eq '^COMPOSE_PROJECT_NAME=[a-z0-9][a-z0-9_-]*$' .settings.env || { echo 'Explicit Compose project required'; exit 1; }
docker volume inspect "$volume" >/dev/null
ref="marcelobarbusa/helpdesk-ti-discord@$digest"
docker pull "$ref"
expected=$(docker image inspect --format '{{.Id}}' "$ref")
image_arch=$(docker image inspect --format '{{.Architecture}}' "$ref")
case "$(uname -m)" in x86_64) host_arch=amd64 ;; aarch64|arm64) host_arch=arm64 ;; *) echo 'Unsupported VM architecture'; exit 1 ;; esac
[[ "$image_arch" == "$host_arch" ]] || { echo 'Image/VM architecture mismatch'; exit 1; }
# Refuse an accidental switch away from an already mounted database volume.
old=$(docker ps -aq --filter "label=com.docker.compose.project=$project" --filter label=com.docker.compose.service=app)
if [[ -n "$old" ]]; then
  [[ $(wc -w <<< "$old") -eq 1 ]] || { echo 'Multiple app containers; inspect manually'; exit 1; }
  mounted=$(docker inspect --format '{{range .Mounts}}{{if eq .Destination "/data"}}{{.Name}}{{end}}{{end}}' "$old")
  [[ "$mounted" == "$volume" ]] || { echo 'Existing database mount differs; refusing update'; exit 1; }
fi
if [[ -f .deployment.env ]]; then cp .deployment.env .previous.env; fi
# Persist the attempted reference even on failure so operational commands inspect it.
mv "$candidate" .deployment.env
compose=(docker compose --env-file .settings.env --env-file .deployment.env)
"${compose[@]}" up -d --no-build --pull never --force-recreate --wait --wait-timeout 180 app
id=$("${compose[@]}" ps -q app)
test -n "$id"
[[ $(docker inspect --format '{{.Config.Image}}' "$id") == "$ref" ]]
[[ $(docker inspect --format '{{.Image}}' "$id") == "$expected" ]]
[[ $(docker inspect --format '{{.State.Health.Status}}' "$id") == healthy ]]
cp .deployment.env .last-success.env
printf 'Deployment healthy: %s container=%s\n' "$ref" "$id"
