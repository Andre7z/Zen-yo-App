# Gestão de Judô — Zen'yo

O Zen'yo é gerenciador de atividades de judô. O sistema permite fazer login, cadastrar alunos e registrar atividades, logo terá a parte de anexos.

Tecnologias FastAPI, SQLAlchemy, SQLite e Alembic.

## Como rodar

Primeiro, instale as dependências do projeto:

```
poetry install
```

Depois, renomeie o arquivo `env.exemplo` para `.env` e configure as informações necessárias.

Para criar e atualizar as tabelas do banco, execute:

```
poetry run alembic upgrade head
```

Agora, inicie a API:

```
poetry run uvicorn app.main:app --reload
```

Acesse o docs adicionando o /docs:

http://127.0.0.1:8000/docs
E acesse http://localhost:5173/

para rodar o frontend 
npm run dev

## Funções no `/docs`

Login;
CRUD de alunos;
CRUD de atividades;
Filtro de atividades por tipo e nome;
Rotas que precisam de autenticação.

## Onde cada coisa fica

`main` — configuração principal da API;
`usuarios/` — usuários e login;
`alunos/` — cadastro e gerenciamento dos alunos;
`atividades/` — cadastro e gerenciamento das atividades;
`database` — conexão com o banco de dados;
`seguranca` — autenticação;
`alembic/` — migrações do banco de dados.

Controller: recebe as requisições da API e chama os serviços.
Service: concentra as regras e a lógica da aplicação.
Repository: realiza as operações no banco de dados.
Model: representa as tabelas e relacionamentos do banco.
Schema: define e valida os dados de entrada e saída da API.
Erros: reúne os erros específicos de cada módulo.

As tabelas do banco são criadas e atualizadas usando o Alembic.


