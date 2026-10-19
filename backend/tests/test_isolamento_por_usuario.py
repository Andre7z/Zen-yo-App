import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.alunos import service as alunos_service
from app.alunos.erros import AlunoNaoEncontrado
from app.database import Base
from app.faixas import service as faixas_service
from app.faixas.erros import FaixaNaoEncontrada
from app.faixas.padrao import FAIXAS_PADRAO
from app.faixas.service import normalizar_tipo
from app.turmas import service as turmas_service
from app.turmas.erros import TurmaNaoEncontrada
from app.usuarios import service as usuarios_service


@pytest.fixture()
def db():
    from app.alunos import models as _a  # noqa: F401
    from app.anexos import models as _b  # noqa: F401
    from app.atividades import models as _c  # noqa: F401
    from app.faixas import models as _d  # noqa: F401
    from app.turmas import models as _e  # noqa: F401
    from app.usuarios import models as _f  # noqa: F401

    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    with Session(engine) as sessao:
        yield sessao


def _usuario(db, email):
    return usuarios_service.cadastrar(
        db, {"nome": "Mestre", "email": email, "senha": "segredo123"}
    )


def test_cadastro_semeia_faixas_padrao(db):
    usuario = _usuario(db, "a@x.com")

    faixas = faixas_service.listar(db, usuario)

    assert sorted(f.nome for f in faixas) == sorted(n for n, _, _ in FAIXAS_PADRAO)
    assert [(f.tipo, f.grau) for f in faixas] == [(normalizar_tipo(t), g) for _, t, g in FAIXAS_PADRAO]


def test_cada_usuario_tem_seu_catalogo_de_faixas(db):
    ana = _usuario(db, "ana@x.com")
    bia = _usuario(db, "bia@x.com")
    faixa_ana = faixas_service.listar(db, ana)[0]

    nova = faixas_service.criar(db, ana, {"nome": "Dourada", "tipo": "Dan", "grau": 11})

    assert faixas_service.listar(db, ana)[-1].id == nova.id
    assert len(faixas_service.listar(db, ana)) == len(FAIXAS_PADRAO) + 1
    assert len(faixas_service.listar(db, bia)) == len(FAIXAS_PADRAO)
    with pytest.raises(FaixaNaoEncontrada):
        faixas_service.buscar(db, bia, faixa_ana.id)


def test_alunos_e_turmas_sao_isolados_por_usuario(db):
    ana = _usuario(db, "ana@x.com")
    bia = _usuario(db, "bia@x.com")
    faixa_ana = faixas_service.listar(db, ana)[0]
    faixa_bia = faixas_service.listar(db, bia)[0]
    turma_ana = turmas_service.criar(db, ana, {"nome": "Infantil"})
    aluno = alunos_service.criar(
        db, ana, {"nome": "Caio", "faixa_id": faixa_ana.id, "turma_id": turma_ana.id}
    )

    assert alunos_service.listar(db, bia) == []
    assert turmas_service.listar(db, bia) == []
    with pytest.raises(AlunoNaoEncontrado):
        alunos_service.buscar(db, bia, aluno.id)
    with pytest.raises(AlunoNaoEncontrado):
        alunos_service.buscar_por_ids(db, bia, [aluno.id])
    with pytest.raises(TurmaNaoEncontrada):
        turmas_service.buscar(db, bia, turma_ana.id)
    with pytest.raises(FaixaNaoEncontrada):
        alunos_service.criar(db, bia, {"nome": "Leo", "faixa_id": faixa_ana.id})
    with pytest.raises(TurmaNaoEncontrada):
        alunos_service.criar(
            db, bia, {"nome": "Leo", "faixa_id": faixa_bia.id, "turma_id": turma_ana.id}
        )
