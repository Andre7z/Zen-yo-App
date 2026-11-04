## Refatoração (Atividade 10)

| Cheiro | Onde | Antes | Depois | O que doía |
|---|---|---|---|---|
| Função longa | `app/atividades/[id]/page.tsx` — `DetalheAtividadePage` | A página também renderizava a lista, os estados dos participantes e o modal de inclusão. | Seção e modal movidos para `components/participantes-atividade.tsx`; a página mantém os callbacks e o fluxo. | A página acumulava apresentação e interação de participantes junto do detalhe, relatório e exclusão da atividade. |
| Código duplicado | `backend/app/{atividades,anexos,dojos,faixas,turmas}/schemas.py` | Cinco cópias de `_texto_legivel` normalizavam espaços, verificavam o tamanho mínimo e montavam a mesma mensagem. | Regra compartilhada em `backend/app/validacoes.py`; schemas mantêm as guardas de valores opcionais. | Uma mudança poderia divergir entre módulos e duplicava a mesma manutenção. |
| Código duplicado | `backend/app/main.py` — handlers de erros de domínio | Seis handlers repetiam a conversão de “não encontrado” para 404 e demais recusas para 409. | Mapeamento comum em `_resposta_erro_de_dominio`; autenticação segue com o tratamento especial 401/Bearer. | Alterar o mapeamento exigia repetir a mesma regra em cada handler. |

Os testes de comportamento foram executados antes e depois de cada refatoração: página de atividade, 3 testes; schemas, 24 testes; handlers, 37 testes. Na validação final passaram 37 testes backend, 3 testes Next e 4 testes Vite; o build de produção Next também concluiu com sucesso.
