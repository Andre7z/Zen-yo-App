# Zen'yo App — React + TypeScript + Vite

## Navegação e sessão

O app usa `react-router-dom` e os nomes de rota definidos em `src/routes.ts`. Login (`/login`) e cadastro (`/cadastro`) são públicos; início (`/inicio`) e perfil (`/perfil`) passam pelo guarda de rota e redirecionam para o login quando não há sessão válida.

O `AutenticacaoProvider` compartilha usuário, carregamento e ações de autenticação com as telas por meio do hook `useAutenticacao`; as mudanças no estado do contexto atualizam suas telas consumidoras, como uma notificação de `ChangeNotifier` no Flutter. O token fica somente na memória: ao recarregar a página, a sessão termina e o guarda redireciona para o login. O menu lateral mostra o nome e o e-mail da sessão. Ao sair, o app limpa o token e substitui a rota atual pelo login; como no navegador não há API para apagar arbitrariamente toda a pilha de histórico, o guarda também impede que o botão Voltar reabra conteúdo protegido.

Para iniciar o frontend, execute `npm run dev` nesta pasta. A API usa `http://localhost:8000` por padrão; configure `VITE_API_URL` em `.env` quando necessário.

Execute `npm test` nesta pasta para rodar os testes de guarda de rota, menu/sessão, logout e atualização da interface pelo Provider.

## Estrutura original do Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
