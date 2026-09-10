#!/usr/bin/env bash
# Run only inside the disposable test image; Docker is simulated, no host socket.
set -euo pipefail
repo=$(cd "$(dirname "$0")/.." && pwd)
test -f /.dockerenv
test ! -e /opt/helpdesk
mkdir -p /opt/helpdesk/releases/test /tmp/mock-bin
cp "$repo/deploy/deploy.sh" "$repo/compose.prod.yaml" /opt/helpdesk/releases/test/
printf 'DUMMY=value\n' > /opt/helpdesk/.env
printf 'COMPOSE_PROJECT_NAME=existing\nHELPDESK_DATA_VOLUME=existing_data\n' > /opt/helpdesk/.settings.env
cat > /tmp/mock-bin/docker <<'PY'
#!/usr/bin/env python3
import json
import os
import sys

args = sys.argv[1:]
scenario = os.environ['SCENARIO']
digest = 'sha256:' + 'a' * 64
if args[0] == 'compose':
    if 'config' in args and '--format' in args:
        print(json.dumps({'name': 'existing', 'volumes': {'helpdesk_data': {'name': 'existing_data'}}}))
    elif 'up' in args and scenario == 'unhealthy':
        sys.exit(1)
    elif 'ps' in args:
        print('new-container')
elif args[:2] == ['volume', 'inspect']:
    if scenario == 'missing-volume':
        sys.exit(1)
elif args[:2] == ['image', 'inspect']:
    print('amd64' if 'Architecture' in args[3] else 'sha256:expected')
elif args[0] == 'ps':
    print('old-container')
elif args[0] == 'inspect':
    fmt = args[2]
    if '.Mounts' in fmt:
        print('wrong_data' if scenario == 'wrong-volume' else 'existing_data')
    elif '.Config.Image' in fmt:
        print('marcelobarbusa/helpdesk-ti-discord@' + digest)
    elif '.Image' in fmt:
        print('sha256:old' if scenario == 'old-image' else 'sha256:expected')
    elif '.State.Health.Status' in fmt:
        print('healthy')
PY
chmod +x /tmp/mock-bin/docker
export PATH="/tmp/mock-bin:$PATH"
digest="sha256:$(printf 'a%.0s' {1..64})"
for scenario in missing-volume wrong-volume unhealthy old-image success; do
  export SCENARIO="$scenario"
  if bash /opt/helpdesk/releases/test/deploy.sh "$digest"; then
    [[ "$scenario" == success ]] || { echo "Unexpected success: $scenario"; exit 1; }
    test -s /opt/helpdesk/.last-success.env
    grep -q "$digest" /opt/helpdesk/.deployment.env
  else
    [[ "$scenario" != success ]] || exit 1
    test ! -e /opt/helpdesk/.last-success.env
  fi
  printf 'PASS deploy scenario: %s\n' "$scenario"
done
