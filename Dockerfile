FROM python:3.11-slim-bookworm

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    NODE_VERSION=20.18.0

RUN apt-get update && apt-get install -y --no-install-recommends \
      ffmpeg curl ca-certificates xz-utils \
    && rm -rf /var/lib/apt/lists/*

# ── Node.js (for the dashboard) ────────────────────────────────────
RUN curl -fsSL https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.xz \
    | tar -xJ -C /usr/local --strip-components=1

WORKDIR /app

# ── Bot dependencies ───────────────────────────────────────────────
COPY bot/requirements.txt bot/requirements.txt
RUN pip install -r bot/requirements.txt && pip install -U yt-dlp

# ── Dashboard: install + build (NEXT_PUBLIC_* vars are baked in here) ──
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_DASHBOARD_API_KEY
ARG NEXT_PUBLIC_ADMIN_IDS
ARG NEXT_PUBLIC_BRAND_NAME
ARG NEXT_PUBLIC_BRAND_NAME_WORD

COPY dashboard/package.json dashboard/package-lock.json* dashboard/
WORKDIR /app/dashboard
RUN npm install --no-audit --no-fund

COPY dashboard/ .
RUN npm run build

# ── App source ─────────────────────────────────────────────────────
WORKDIR /app
COPY start.sh .
COPY bot/ bot/

RUN chmod +x start.sh && mkdir -p .node/bin

EXPOSE 8080
CMD ["bash", "start.sh"]
