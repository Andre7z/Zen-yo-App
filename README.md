# Zen’yo App
O Zen’yo App - Sistema de gestão de atividades de Judô.

## Tecnologias
React, TypeScript e Vite — interface do sistema.
Python e FastAPI — API e regras do sistema.
SQLAlchemy e Alembic — acesso e atualização do banco de dados.
PostgreSQL — armazenamento dos dados.

## Funções
Usuários e login — acesso à conta e proteção dos dados.
Alunos e responsáveis — cadastro e consulta de informações e contatos.
Turmas — organização dos alunos, com possibilidade de participar de mais de uma turma.
Faixas e tamanhos — gerenciamento das graduações e dos tamanhos de judogi e faixa.
Atividades — organização de treinos, campeonatos, entregas de judogi e graduações, incluindo participantes e confirmação.
Graduação — atualização em lote dos alunos selecionados, com transação para impedir alterações parciais.
Planilhas — consulta e exportação dos controles de frequência, campeonatos, judogis e graduações.
Anexos — armazenamento e consulta de documentos.

## Para rodar
Para rodar utilize o comando:
npm.cmd run dev

## Testes

Execute os comandos abaixo a partir da raiz do projeto. Na primeira execução, instale as dependências em cada pasta.

### Backend — pytest

Requer Python 3.13 ou superior e Poetry instalado.

```powershell
cd backend
poetry install
poetry run pytest
```

### Frontend — Vitest e Testing Library

Requer Node.js e npm instalados. Em outro terminal, a partir da raiz do projeto:

```powershell
cd frontend
npm.cmd install
npm.cmd test
```
