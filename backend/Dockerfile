FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV POETRY_VIRTUALENVS_CREATE=false

WORKDIR /app

RUN pip install --no-cache-dir poetry==2.4.1

# Instala apenas as dependencias de producao.
COPY pyproject.toml poetry.lock ./
RUN poetry install --only main --no-root --no-interaction --no-ansi

# Copia o backend. Os testes e arquivos locais sao excluidos pelo .dockerignore.
COPY . ./
RUN mkdir -p uploads/anexos

EXPOSE 8000

# Aplica as migrations pendentes antes de iniciar a API.
CMD ["sh", "-c", "alembic upgrade head && exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
