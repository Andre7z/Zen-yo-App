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
- Atividades — treinos, campeonatos, entregas e graduações, com relatórios.
- Anexos — envio e consulta de documentos.

Telas internas exigem login; sem sessão válida o app redireciona para o login. O token fica só na memória, então recarregar a página encerra a sessão.

## Como rodar

```
npm install
npm run dev
```

A API é acessada em `http://localhost:8000` por padrão; para mudar, defina `VITE_API_URL` no `.env`.

Testes: `npm test`
