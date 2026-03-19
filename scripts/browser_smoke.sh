#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT="${PORT:-4178}"
HOST="127.0.0.1"
BASE_URL="http://${HOST}:${PORT}"
SERVER_LOG="${ROOT_DIR}/output/playwright/browser-smoke-server.log"
UPLOAD_ONE="${ROOT_DIR}/src/assets/hero.png"
UPLOAD_TWO="${ROOT_DIR}/public/favicon.svg"

export CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
export PWCLI="${CODEX_HOME}/skills/playwright/scripts/playwright_cli.sh"

mkdir -p "${ROOT_DIR}/output/playwright"

if ! command -v npx >/dev/null 2>&1; then
  echo "npx is required for browser smoke runs."
  exit 1
fi

if [[ ! -x "${PWCLI}" ]]; then
  echo "Playwright CLI wrapper not found at ${PWCLI}."
  exit 1
fi

cleanup() {
  "${PWCLI}" close-all >/dev/null 2>&1 || true
  if [[ -n "${SERVER_PID:-}" ]]; then
    kill "${SERVER_PID}" >/dev/null 2>&1 || true
    wait "${SERVER_PID}" >/dev/null 2>&1 || true
  fi
}

trap cleanup EXIT

cd "${ROOT_DIR}"
npm run dev -- --host "${HOST}" --port "${PORT}" >"${SERVER_LOG}" 2>&1 &
SERVER_PID=$!

for _ in {1..30}; do
  if curl -fsS "${BASE_URL}" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

if ! curl -fsS "${BASE_URL}" >/dev/null 2>&1; then
  echo "Dev server did not become ready on ${BASE_URL}."
  exit 1
fi

"${PWCLI}" close-all >/dev/null 2>&1 || true
"${PWCLI}" open "${BASE_URL}" >/dev/null
UPLOAD_CODE="(async (page) => { await page.setViewportSize({ width: 390, height: 844 }); const input = page.locator(\"[data-testid=\\\"library-upload-input\\\"]\"); await input.setInputFiles([\"${UPLOAD_ONE}\", \"${UPLOAD_TWO}\", \"${UPLOAD_ONE}\", \"${UPLOAD_TWO}\"]); await page.getByText(\"Render ready\").waitFor({ timeout: 5000 }); })"
"${PWCLI}" run-code "${UPLOAD_CODE}" >/dev/null
SNAPSHOT_OUTPUT="$("${PWCLI}" snapshot)"
SNAPSHOT_PATH="$(printf '%s\n' "${SNAPSHOT_OUTPUT}" | sed -n 's/.*\[Snapshot](\(.*\)).*/\1/p' | tail -n 1)"

if [[ -z "${SNAPSHOT_PATH}" || ! -f "${ROOT_DIR}/${SNAPSHOT_PATH}" ]]; then
  echo "Could not locate Playwright snapshot output."
  exit 1
fi

if ! rg 'Build It Now|Render ready' "${ROOT_DIR}/${SNAPSHOT_PATH}" >/dev/null 2>&1; then
  echo "Upload smoke check did not find the render-ready state."
  exit 1
fi

GUIDE_REF="$(
  rg 'button "Build It Now".*\[ref=' "${ROOT_DIR}/${SNAPSHOT_PATH}" \
    | sed -E 's/.*\[ref=([^]]+)\].*/\1/' \
    | head -n 1
)"

if [[ -z "${GUIDE_REF}" ]]; then
  echo "Could not find the Build It Now button ref in the snapshot."
  exit 1
fi

"${PWCLI}" click "${GUIDE_REF}" >/dev/null
"${PWCLI}" snapshot >/dev/null
SCROLL_TOP_CODE="(async (page) => { await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(100); })"
"${PWCLI}" run-code "${SCROLL_TOP_CODE}" >/dev/null
SCREENSHOT_OUTPUT="$("${PWCLI}" screenshot)"
SCREENSHOT_PATH="$(printf '%s\n' "${SCREENSHOT_OUTPUT}" | sed -n 's/.*(\(.*\.png\)).*/\1/p' | tr -d '()' | tail -n 1)"

if [[ -z "${SCREENSHOT_PATH}" || ! -f "${ROOT_DIR}/${SCREENSHOT_PATH}" ]]; then
  echo "Could not locate the Playwright screenshot output."
  exit 1
fi

cp "${ROOT_DIR}/${SCREENSHOT_PATH}" "${ROOT_DIR}/output/playwright/app-smoke.png"
echo "Browser smoke passed."
echo "Screenshot: ${ROOT_DIR}/output/playwright/app-smoke.png"
echo "Server log: ${SERVER_LOG}"
