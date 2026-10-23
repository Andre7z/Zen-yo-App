
FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV POETRY_VIRTUALENVS_CREATE=false

WORKDIR /app

RUN pip install --no-cache-dir poetry

# Copia os arquivos de dependências do backend
COPY backend/pyproject.toml backend/poetry.lock ./

# Instala somente as dependências de produção
RUN poetry install --only main --no-root --no-interaction --no-ansi

# Copia o código do backend
COPY backend/ ./

EXPOSE 8000

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
