O sistema tem vários tipos de atividade, e cada uma gera o relatório de um jeito diferente.

Problemas de não usar factory method:
o código cresce muito, a regra de escolha fica espalhada, 
toda nova atividade exige mexer no mesmo lugar, o código fica mais difícil de manter.

A fábrica centraliza essa decisão:
Porque o código que usa a atividade não precisa saber “qual if usar”.
Ele só faz:
estrategia = RelatorioFactory.criar(atividade.tipo)
resultado = estrategia.gerar(atividade)

O if decide o caso; a fábrica organiza a criação da regra correta.