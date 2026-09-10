#!/usr/bin/env bash
set -euo pipefail
cd /opt/helpdesk
exec docker compose --env-file .settings.env --env-file .deployment.env "$@"
