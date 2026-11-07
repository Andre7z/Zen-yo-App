# Zen’yo — Backend
API do Zen’yo, responsável pelas regras do sistema e pelo acesso aos dados.

## Tecnologias
Python e FastAPI — API e regras do sistema.
SQLAlchemy e Alembic — acesso e migrações do banco de dados.
PostgreSQL — armazenamento dos dados.
JWT e bcrypt — autenticação e senhas.
openpyxl — exportação de planilhas em XLSX.
Pytest — testes automatizados.

## Estrutura
Cada módulo em `app/` (alunos, responsaveis, turmas, faixas, tamanhos, atividades, anexos, usuarios) é dividido em controller, service, repository, models, schemas e erros.

## Funções da API
Usuários — cadastro, login e perfil; cada usuário acessa apenas seus dados.
Alunos e responsáveis — cadastro e contatos.
Turmas — relação N:N com alunos, chamada por data e planilha mensal para uma ou mais turmas.
Cada turma nova deve informar o núcleo, incluído no bloco correspondente da planilha. Turmas anteriores à migração ficam sem núcleo até serem editadas; o preenchimento é exigido ao salvar a edição.
Faixas e tamanhos — graduações e tamanhos de judogi e faixa.
O tamanho A3 faz parte dos tamanhos padrão de judogi. A migração também o adiciona aos catálogos existentes, sem duplicar um A3 já cadastrado.
Atividades — treinos, campeonatos, entregas de judogi e graduações, com participantes.
Planilhas — controles em JSON e XLSX.
Anexos — upload e consulta de documentos.

## Como rodar
```
poetry install
poetry run alembic upgrade head
poetry run uvicorn app.main:app --reload
```
Defina `DATABASE_URL` no arquivo `.env`. Documentação da API em http://127.0.0.1:8000/docs.
Testes: `poetry run pytest`

A chamada usa a lista atual de alunos ao ser registrada pela primeira vez, com todos marcados como presentes; desmarque quem faltou e salve. Chamadas já salvas mantêm os participantes e as marcações mesmo após mudanças de turma. A planilha usa `V` para presença, `X` para ausência e `-` quando o aluno não estava na chamada. Ao excluir um aluno ou uma turma, os registros de frequência correspondentes também são excluídos. As rotas de atividades usam `/planilha` no lugar de `/relatorio`.
Nos detalhes da turma, o histórico lista as datas com chamada registrada, da mais recente para a mais antiga, e permite editar cada registro. Na planilha mensal, os cabeçalhos das chamadas mostram somente o dia.

## Docker
O Dockerfile na raiz gera uma imagem somente para a API. Execute os comandos a partir da raiz do repositório:
```
docker build -t zenyo-api .
docker run --rm -p 8000:8000 -e DATABASE_URL="postgresql+psycopg://usuario:senha@host.docker.internal:5432/zenyo" zenyo-api
```
Configure `DATABASE_URL` com os dados do PostgreSQL acessível pelo container. A imagem aplica as migrações antes de iniciar a API; a interface frontend é implantada separadamente.
