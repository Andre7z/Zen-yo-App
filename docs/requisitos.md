## Requisitos funcionais

| Identificação | Descrição do RF | RNF |
|---|---|---|
| RF.001 | O sistema deve permitir realizar cadastro e login de usuários (professores). | RNF.001, RNF.002, RNF.003 |
| RF.002 | O sistema deve permitir consultar e atualizar nome, e-mail e senha da própria conta. | RNF.004 |
| RF.003 | O sistema deve permitir o gerenciamento (cadastro, alteração e exclusão) do aluno, incluindo celular, faixa e tamanhos de faixa e judogi. | RNF.004 |
| RF.004 | O sistema deve permitir o gerenciamento (cadastro, alteração e exclusão) do responsável do aluno, incluindo o parentesco. | RNF.004 |
| RF.005 | O sistema deve permitir o gerenciamento (cadastro, alteração e exclusão) da turma. | RNF.004 |
| RF.006 | O sistema deve permitir adicionar e remover alunos de uma turma, sendo que um aluno pode estar em várias turmas. | — |
| RF.007 | O sistema deve permitir o gerenciamento (cadastro, alteração e exclusão) de atividades dos tipos frequência, entrega de judogi, troca de faixa e campeonato, incluindo seus participantes. | RNF.004 |
| RF.008 | O sistema deve mostrar informações específicas de acordo com o tipo da atividade. | — |
| RF.009 | O sistema deve permitir registrar a participação e confirmar o aluno na atividade. | — |
| RF.010 | O sistema deve permitir filtrar atividades por tipo e nome e mostrar as próximas atividades ordenadas por data. | — |
| RF.011 | O sistema deve permitir gerar o relatório correspondente ao tipo da atividade. | RNF.005, RNF.006 |
| RF.012 | O sistema deve permitir exportar planilhas (XLSX) de frequência, troca de faixa, campeonato e entrega de judogis. | RNF.005, RNF.006 |
| RF.013 | O sistema deve permitir o gerenciamento de anexos (envio, consulta, download, alteração e exclusão). | RNF.004, RNF.007 |
| RF.014 | O sistema deve permitir o gerenciamento (cadastro, alteração e exclusão) de faixas. | RNF.004 |
| RF.015 | O sistema deve permitir o gerenciamento (cadastro, alteração e exclusão) de tamanhos de faixa e de judogi. | RNF.004 |
| RF.016 | O sistema deve criar automaticamente o catálogo padrão de faixas ao cadastrar uma conta. | — |
| RF.017 | O sistema deve mostrar e permitir alterar, a cada professor, somente os dados da sua própria conta. | RNF.003 |

## Requisitos não funcionais

| Identificação | Descrição do RNF | RF |
|---|---|---|
| RNF.001 | O sistema deve permitir realizar login apenas caso e-mail e senha estejam corretos. | RF.001 |
| RNF.002 | O sistema deve armazenar senhas como hash bcrypt e assinar tokens JWT com expiração de 60 minutos. | RF.001 |
| RNF.003 | O sistema deve exigir token válido nas operações protegidas e rejeitar tokens inválidos ou expirados. | RF.001, RF.017 |
| RNF.004 | O sistema deve permitir salvar apenas caso os campos obrigatórios estejam preenchidos e válidos (por exemplo, o CPF do aluno). | RF.002 a RF.005, RF.007, RF.013 a RF.015 |
| RNF.005 | O sistema, ao gerar relatório de troca de faixa, deve colocar na planilha a faixa atual, a nova faixa do aluno e o tamanho da faixa. | RF.011, RF.012 |
| RNF.006 | O sistema, ao gerar relatório de entrega de judogis, deve colocar na planilha o tamanho do judogi que o aluno usa. | RF.011, RF.012 |
| RNF.007 | O sistema deve limitar o tamanho dos anexos enviados a 50 MB. | RF.013 |
| RNF.008 | O sistema deve usar banco de dados relacional (SQLite ou PostgreSQL) com SQLAlchemy e controlar o esquema com Alembic. | Todos |
| RNF.009 | O sistema deve separar API, regras de negócio e acesso a dados em camadas distintas. | Todos |
| RNF.010 | O sistema deve aceitar requisições CORS somente das origens configuradas. | Todos |
