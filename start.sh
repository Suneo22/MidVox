#!/bin/bash

echo "=== Starting MidVox ==="

# Add Node.js binary to PATH (extracted during build into .node/)
export PATH="$(dirname "$0")/.node/bin:$PATH"

export API_ENABLED=true
export API_PORT=5001
export TUNNEL_ENABLED=false
export EMOJI_SYNC=true

ROOT="$(pwd)"

# ── Cloudflare WARP egress for YouTube downloads (opt-out: set WARP=0) ──
# Render's GCP IPs are flagged by YouTube ("Sign in to confirm you're not a
# bot"), so the bot downloads through a Cloudflare WARP tunnel instead.
# wireproxy runs a userspace WireGuard client (no TUN device / root needed)
# and exposes a SOCKS5 proxy on 127.0.0.1:33210; only yt-dlp (via the
# YT_DL_PROXY opt) routes through it — Discord traffic stays on the normal
# interface. Failures here are non-fatal: the bot still boots, just without
# the tunnel. On by default; disable by setting WARP=0.
setup_warp() {
  WARP_DIR="$ROOT/.warp"
  # Run inside a subshell so the `cd`s below never change the script's
  # working directory — the rest of start.sh expects to run from the repo root.
  (
    mkdir -p "$WARP_DIR" || exit 1
    cd "$WARP_DIR" || exit 1

    WGCF_BIN="wgcf_2.2.30_linux_amd64"
    if [ ! -x "./$WGCF_BIN" ]; then
      curl -fsSL --retry 3 --connect-timeout 20 \
        -o "./$WGCF_BIN" \
        "https://github.com/ViRb3/wgcf/releases/download/v2.2.30/$WGCF_BIN" || exit 1
      chmod +x "./$WGCF_BIN"
    fi

    if [ ! -f "./wgcf-profile.conf" ]; then
      "./$WGCF_BIN" register --accept-tos || exit 1
      "./$WGCF_BIN" generate || exit 1
    fi

    if [ ! -x "./wireproxy" ]; then
      curl -fsSL --retry 3 --connect-timeout 20 \
        -o "./wireproxy.tar.gz" \
        "https://github.com/windtf/wireproxy/releases/download/v1.1.3/wireproxy_linux_amd64.tar.gz" || exit 1
      tar -xzf "./wireproxy.tar.gz" || exit 1
      chmod +x "./wireproxy"
      rm -f "./wireproxy.tar.gz"
    fi

    cat > "./wireproxy.toml" <<EOF
WGConfig = $WARP_DIR/wgcf-profile.conf

[Socks5]
BindAddress = 127.0.0.1:33210
EOF

    nohup "./wireproxy" -c "./wireproxy.toml" > "$WARP_DIR/wireproxy.log" 2>&1 &
  ) || return 1

  for i in $(seq 1 25); do
    if python -c "import socket; s=socket.create_connection(('127.0.0.1',33210),1); s.close()" >/dev/null 2>&1; then
      export YT_DL_PROXY="socks5://127.0.0.1:33210"
      echo "=== WARP SOCKS5 up on 127.0.0.1:33210 ==="
      return 0
    fi
    sleep 1
  done
  echo "=== WARP SOCKS5 failed; wireproxy log tail: ==="
  tail -n 8 "$WARP_DIR/wireproxy.log" 2>/dev/null || true
  return 1
}

if [ "${WARP:-1}" = "1" ]; then
  if setup_warp; then
    echo "WARP egress: ON (YouTube downloads tunneled via $YT_DL_PROXY)"
  else
    echo "WARP egress: FAILED — continuing without proxy"
  fi
else
  echo "WARP egress: disabled (WARP=$WARP)"
fi

# ── One-time emoji sync (before bot starts, patches emoji.py) ─
echo "Running one-time emoji sync..."
(cd "$(pwd)/bot" && timeout 120 python sync_emojis_once.py)
echo "--- Emoji sync exit code: $? ---"

# Run bot in a restart loop so if it crashes the API stays up
(
  ROOT="$(pwd)"
  while true; do
    cd "$ROOT/bot" || { echo "FATAL: bot/ directory not found at $ROOT/bot"; exit 1; }
    echo "Starting bot (API on port 5001)..."
    python CodeX.py 2>&1 | tee "$ROOT/bot.log"
    echo "WARNING: Bot exited (code $?). Restarting in 2s..." >&2
    cd "$ROOT"
    sleep 2
  done
) &
BOT_PID=$!

# Wait for bot API to be ready (just check port is open)
echo "Waiting for bot API on port 5001..."
for i in $(seq 1 30); do
  if python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:5001/health')" > /dev/null 2>&1; then
    echo "Bot API is ready!"
    break
  fi
  echo "  Attempt $i/30..."
  sleep 2
done

# Start Next.js dashboard on Render's public PORT
cd dashboard
export PORT="${PORT:-8080}"
echo "Starting dashboard on port $PORT..."
npx next start -p "$PORT" -H 0.0.0.0 &
DASHBOARD_PID=$!

echo "=== MidVox running ==="
echo "Bot PID: $BOT_PID"
echo "Dashboard PID: $DASHBOARD_PID"

wait