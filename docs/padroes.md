1. Injeção de Dependência
Que problema ele resolve?
Permite que o FastAPI entregue a conexão do banco para a rota. Assim, cada rota não precisa criar sua própria conexão.

O que aconteceria sem ele?
O código para criar a conexão ficaria repetido nas rotas. Se a forma de acessar o banco mudasse, seria preciso alterar cada uma delas.

Quando vale e quando é burocracia — neste projeto:
Vale a pena porque várias rotas usam o banco. Seria desnecessário em uma operação isolada que não precisasse compartilhar essa dependência.

no controller
@router.post("/", response_model=AlunoPublico, status_code=201)
def criar(dados: AlunoCriar, db: Session = Depends(get_db)):
    return service.criar(db, dados.model_dump())

no database
def get_db():
    """Uma sessao por requisicao, fechada mesmo se der erro."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

2. Corrente de Responsabilidade
Que problema ele resolve?
Centraliza o tratamento dos erros da aplicação, para que as rotas não precisem repetir vários blocos `try/except`.

O que aconteceria sem ele?
Cada rota trataria os mesmos erros por conta própria. Uma mudança precisaria ser repetida em vários arquivos.

Quando vale e quando é burocracia — neste projeto:
Vale a pena porque vários módulos podem gerar erros que precisam virar respostas HTTP. Em uma aplicação pequena, com poucos erros, essa estrutura poderia ser desnecessária.

no erros
class ErroAluno(Exception):
    """Qualquer erro que envolve Aluno."""


class AlunoNaoEncontrado(ErroAluno):
    """Aluno nao existe."""

class CampoNaoEditavel(ErroAluno):
    """Tentaram editar pelo catalogo um campo que nao e do catalogo."""


no main
@app.exception_handler(ErroAluno)
def traduzir_recusa(request: Request, erro: ErroAluno):
    """O unico lugar do sistema que transforma recusa em numero HTTP."""
    codigo = 404 if isinstance(erro, AlunoNaoEncontrado) else 409
    return JSONResponse(status_code=codigo, content={"detail": str(erro)})


3. Composite (include_router)
Que problema ele resolve?
Agrupa rotas relacionadas em um `router`. O `main.py` inclui esse grupo no aplicativo com `include_router()`.

O que aconteceria sem ele?
Todas as rotas ficariam no `main.py`, que cresceria e ficaria mais difícil de manter.

Quando vale e quando é burocracia — neste projeto:
Vale a pena porque o sistema tem vários grupos de rotas. Para poucas rotas sem relação entre si, criar grupos poderia ser desnecessário.

no controller
router = APIRouter(prefix="/aluno", tags=["Aluno"])
@router.get("/")
def listar():

@router.post("/")
def criar():

@router.delete("/{aluno_id}")
def apagar():

no main
app.include_router(alunos_controller.router)

5. Facade
Que problema ele resolve?
Oferece uma chamada simples para uma operação que precisa coordenar mais de um módulo. Na criação de atividade, a Facade busca os alunos e depois chama o service de atividades.

O que aconteceria sem ele?
O service de atividades também precisaria conhecer a busca de alunos. Isso aumentaria o acoplamento entre os módulos.

Quando vale e quando é burocracia — neste projeto:
Vale a pena ao criar ou editar uma atividade com alunos, pois esse fluxo usa os módulos de alunos e atividades. Listar, buscar, apagar e gerar relatório continuam no service de atividades, porque não precisam coordenar outros módulos.

em atividades/facade
class AtividadeFacade:
    def __init__(self, atividades_service, alunos_service):
        self.atividades_service = atividades_service
        self.alunos_service = alunos_service

    def criar(self, db, usuario, dados):
        dados_atividade = dict(dados)
        aluno_ids = dados_atividade.pop("aluno_ids", [])
        dados_atividade["alunos"] = self.alunos_service.buscar_por_ids(db, aluno_ids)
        return self.atividades_service.criar(
            db,
            usuario,
            dados_atividade,
        )

em atividades/dependencias
def obter_facade():
    return AtividadeFacade(atividades_service, alunos_service)

no controller
facade: AtividadeFacade = Depends(obter_facade)
return facade.criar(db, usuario, dados.model_dump())

Na criação e edição de turmas, a Facade também busca o professor pelo módulo
de usuários. O service de turmas verifica se ele pertence ao mesmo dojo.
Listagem, busca e exclusão continuam fora da Facade.

em turmas/facade
class TurmaFacade:
    def __init__(self, turmas_service, usuarios_service):
        self.turmas_service = turmas_service
        self.usuarios_service = usuarios_service

    def criar(self, db, dados):
        professor = self.usuarios_service.buscar(db, dados.get("professor_id"))
        return self.turmas_service.criar(db, dados, professor)

em turmas/dependencias
def obter_facade():
    return TurmaFacade(turmas_service, usuarios_service)

no controller
facade: TurmaFacade = Depends(obter_facade)
return facade.criar(db, dados.model_dump())

Diario do Encontro 09 — Facade de atividades
O fluxo escolhido é a criação de uma atividade com alunos associados. Antes,
o service de atividades recebia `aluno_ids`, buscava os alunos e depois criava
a atividade. Assim, esse service conhecia o módulo de alunos, e a consulta dos
alunos ficava no repository de atividades.

Agora a `AtividadeFacade` chama `alunos_service.buscar_por_ids` e depois
`atividades_service.criar`. O service de alunos valida os IDs, o service de
atividades define o dono e os repositories continuam responsáveis pelo SQL.
A Facade apenas coordena essas chamadas.

O service de atividades foi simplificado: não precisa mais buscar alunos e
fica focado nas regras da atividade. O controller usa a Facade nesse fluxo.
Antes, porém, o controller já fazia uma única chamada ao service; o ganho
principal é reduzir o acoplamento entre os módulos, não diminuir chamadas na rota.

4. Unit of Work (Session + commit)
Que problema ele resolve?
Permite agrupar alterações na sessão do banco e confirmá-las juntas com `commit()`.

O que aconteceria sem ele?
Uma parte das alterações poderia ser salva antes de outra falhar. O banco ficaria com apenas uma parte da operação concluída.

Quando vale e quando é burocracia — neste projeto:
Vale a pena em operações que precisam salvar várias alterações juntas. Para uma única alteração simples, controlar uma transação pode ser desnecessário.

no database
SessionLocal = sessionmaker(bind=engine)

no repository
def criar(db: Session, dados: dict):
    aluno = Aluno(**dados)
    db.add(aluno)
    db.commit()
    db.refresh(aluno)
    return aluno

