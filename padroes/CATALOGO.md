# Catálogo de padrões — Zen'yo App - gestao-de-judo

Este arquivo cresce o semestre inteiro.
A última coluna começa vazia e só é preenchida quando o padrão for
aplicado de verdade no projeto.

| Padrão | Família | Que problema resolve | Onde caberia no MEU projeto | Já usei? Onde? |
|---|---|---|---|---|
| Strategy | Comportamental | Uma regra que muda de caso para caso vira uma escada de if que cresce a cada caso novo | Cálculo de regras diferentes para atividades, troca de faixa ou geração de relatórios | — |
| Factory Method | Criacional | Quando existem vários tipos de objetos, fica difícil organizar a criação de cada um | Criação de diferentes tipos de atividades, como troca de faixa, festival e entrega de kimono | — |
| Observer | Comportamental | Permite avisar vários componentes quando um objeto sofre alteração | Atualizar informações quando alunos ou atividades forem alterados | — |
| Facade | Estrutural | Simplifica o uso de vários módulos que precisam trabalhar juntos | Criar/editar atividades com alunos e turmas com professor do dojo | `backend/app/atividades/facade.py`; `backend/app/turmas/facade.py` |
