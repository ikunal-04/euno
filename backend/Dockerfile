FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim

WORKDIR /app
ENV UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy

# Install dependencies first so they cache independently of source changes
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-install-project --no-dev

COPY . .
RUN uv sync --frozen --no-dev

EXPOSE 8000

# $PORT is injected by the host (Render uses 10000); default to 8000 locally
CMD uv run uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
