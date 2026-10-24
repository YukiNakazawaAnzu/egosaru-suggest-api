#!/usr/bin/env bash
# Usage: KEY=gsk_... ./suggest.sh "keyword" [source=google] [lang=en] [country]
set -euo pipefail
q=${1:?keyword required}; source=${2:-google}; lang=${3:-en}; country=${4:-}
url="https://gstudio1.com/api/v1/${source}/suggest?flat=1&lang=${lang}"
[ -n "$country" ] && url="${url}&country=${country}"
for _ in $(seq 1 12); do
  body=$(curl -sS -G --data-urlencode "q=${q}" -H "Authorization: Bearer ${KEY:?set KEY}" -w '\n%{http_code}' "$url")
  code=${body##*$'\n'}; json=${body%$'\n'*}
  if [ "$code" = 200 ]; then echo "$json"; exit 0; fi
  if [ "$code" = 202 ]; then
    wait=$(printf '%s' "$json" | sed -n 's/.*"retry_after_seconds": *\([0-9]*\).*/\1/p')
    sleep "${wait:-20}"
    continue
  fi
  echo "HTTP $code: $json" >&2; exit 1
done
echo "still queued, try again later" >&2; exit 2
