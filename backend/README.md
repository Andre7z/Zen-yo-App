# Zen’yo — Backend
API do Zen’yo, responsável pelas regras do sistema e pelo acesso aos dados.

## Tecnologias
Python e FastAPI — API e regras do sistema.
SQLAlchemy e Alembic — acesso e migrações do banco de dados.
PostgreSQL — armazenamento dos dados.
JWT e bcrypt — autenticação e senhas.
openpyxl — exportação de relatórios em XLSX.
Pytest — testes automatizados.

## Estrutura
Cada módulo em `app/` (alunos, responsaveis, turmas, faixas, tamanhos, atividades, anexos, usuarios) é dividido em controller, service, repository, models, schemas e erros.

## Funções da API
Usuários — cadastro, login e perfil; cada usuário acessa apenas seus dados.
Alunos e responsáveis — cadastro e contatos.
Turmas — relação N:N com alunos, pela tabela `aluno_turmas`.
Faixas e tamanhos — graduações e tamanhos de judogi e faixa.
Atividades — treinos, campeonatos, entregas de judogi e graduações, com participantes.
Relatórios — controles em JSON e XLSX.
Anexos — upload e consulta de documentos.

## Como rodar
```
poetry install
poetry run alembic upgrade head
poetry run uvicorn app.main:app --reload
```
Defina `DATABASE_URL` no arquivo `.env`. Documentação da API em http://127.0.0.1:8000/docs.
Testes: `poetry run pytest`

## Docker
O Dockerfile na raiz gera uma imagem somente para a API. Execute os comandos a partir da raiz do repositório:
```
docker build -t zenyo-api .
docker run --rm -p 8000:8000 -e DATABASE_URL="postgresql+psycopg://usuario:senha@host.docker.internal:5432/zenyo" zenyo-api
```
Configure `DATABASE_URL` com os dados do PostgreSQL acessível pelo container. A imagem aplica as migrações antes de iniciar a API; a interface frontend é implantada separadamente.
