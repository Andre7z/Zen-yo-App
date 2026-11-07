# Zen’yo — Frontend

Interface web do Zen’yo, que consome a API do backend.

## Tecnologias

- React e TypeScript — interface do sistema.
- Vite — servidor de desenvolvimento e build.
- React Router — navegação entre telas.
- Vitest e Testing Library — testes automatizados.

## Telas

- Login e cadastro — acesso à conta.
- Início e perfil — visão geral e dados do usuário.
- Alunos — cadastro com responsável e contatos.
- Turmas — organização dos alunos em uma ou mais turmas.
- Faixas e tamanhos — graduações e tamanhos de judogi e faixa.
- Atividades — treinos, campeonatos, entregas e graduações, com planilhas.
- Anexos — envio e consulta de documentos.

Anexos são listados por título em ordem alfabética, com números em ordem natural (por exemplo, Apostila 2 antes de Apostila 10).

Telas internas exigem login; sem sessão válida o app redireciona para o login. O token fica só na memória, então recarregar a página encerra a sessão.

## Como rodar

```
npm install
npm run dev
```

A API é acessada em `http://localhost:8000` por padrão; para mudar, defina `VITE_API_URL` no `.env`.
Na Vercel, configure `VITE_API_URL` com a URL pública do backend no Render e faça um novo deploy do frontend após alterá-la. O backend publicado deve incluir as rotas de frequência (`/turmas/{turma_id}/frequencias/{data}`); confirme em `/openapi.json` e atualize o serviço no Render com a branch ou commit correto. As migrações devem ser aplicadas no banco antes de usar a chamada; o Dockerfile do projeto executa `alembic upgrade head` na inicialização.

Testes: `npm test`
