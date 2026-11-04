from sqlalchemy import create_engine
from sqlalchemy.orm import Session

import app.main  # noqa: F401 registra todos os models
from app.alunos import service as alunos_service
from app.alunos.models import Aluno
from app.alunos.schemas import AlunoPublico
from app.database import Base
from app.faixas.models import Faixa
from app.responsaveis.models import Responsavel
from app.usuarios.models import Usuario


def _banco():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    return engine


def _criar_usuario_e_faixa(db):
    usuario = Usuario(
        nome="Mestre",
        email="mestre@example.com",
        senha_hash="hash",
    )
    db.add(usuario)
    db.flush()
    faixa = Faixa(nome="Branca", tipo="Kyu", ordem=1, dono_id=usuario.id)
    db.add(faixa)
    db.commit()
    return usuario, faixa


def test_responsavel_persiste_em_tabela_separada_e_mantem_contrato_publico():
    engine = _banco()
    with Session(engine) as db:
        usuario, faixa = _criar_usuario_e_faixa(db)
        aluno = alunos_service.criar(
            db,
            usuario,
            {
                "nome": "Caio",
                "faixa_id": faixa.id,
                "responsavel_nome": "Maria Costa",
                "responsavel_cpf": "52998224725",
            },
        )

        responsavel = db.query(Responsavel).one()
        publico = AlunoPublico.model_validate(aluno)

        assert responsavel.aluno_id == aluno.id
        assert responsavel.nome == "Maria Costa"
        assert responsavel.cpf == "529.982.247-25"
        assert publico.responsavel_nome == "Maria Costa"
        assert publico.responsavel_cpf == "529.982.247-25"
        assert "responsavel_nome" not in Aluno.__table__.columns
        assert "responsavel_cpf" not in Aluno.__table__.columns
        assert "responsavel_celular" not in Aluno.__table__.columns
    engine.dispose()


def test_atualizar_responsavel_preserva_campos_e_remove_quando_vazio():
    engine = _banco()
    with Session(engine) as db:
        usuario, faixa = _criar_usuario_e_faixa(db)
        aluno = alunos_service.criar(
            db,
            usuario,
            {
                "nome": "Caio",
                "faixa_id": faixa.id,
                "responsavel_nome": "Maria Costa",
                "responsavel_cpf": "52998224725",
            },
        )

        atualizado = alunos_service.atualizar(
            db,
            usuario,
            aluno.id,
            {"responsavel_nome": "Maria Silva"},
        )
        assert atualizado.responsavel_nome == "Maria Silva"
        assert atualizado.responsavel_cpf == "529.982.247-25"

        atualizado = alunos_service.atualizar(
            db,
            usuario,
            aluno.id,
            {"responsavel_nome": None, "responsavel_cpf": None},
        )
        assert atualizado.responsavel_nome is None
        assert atualizado.responsavel_cpf is None
        assert db.query(Responsavel).count() == 0
    engine.dispose()


def test_aluno_sem_responsavel_nao_cria_registro_vazio():
    engine = _banco()
    with Session(engine) as db:
        usuario, faixa = _criar_usuario_e_faixa(db)
        aluno = alunos_service.criar(
            db,
            usuario,
            {"nome": "Caio", "faixa_id": faixa.id},
        )

        assert aluno.responsavel is None
        assert db.query(Responsavel).count() == 0
    engine.dispose()


def test_apagar_aluno_remove_responsavel_associado():
    engine = _banco()
    with Session(engine) as db:
        usuario, faixa = _criar_usuario_e_faixa(db)
        aluno = alunos_service.criar(
            db,
            usuario,
            {
                "nome": "Caio",
                "faixa_id": faixa.id,
                "responsavel_nome": "Maria Costa",
            },
        )

        alunos_service.apagar(db, usuario, aluno.id)

        assert db.query(Responsavel).count() == 0
    engine.dispose()


def _cliente(engine, usuario_id):
    from fastapi.testclient import TestClient
    from sqlalchemy.orm import sessionmaker

    from app.database import get_db
    from app.main import app
    from app.seguranca import get_current_user

    fabrica = sessionmaker(bind=engine)

    def _db():
        with fabrica() as sessao:
            yield sessao

    def _usuario():
        with fabrica() as sessao:
            return sessao.get(Usuario, usuario_id)

    app.dependency_overrides[get_db] = _db
    app.dependency_overrides[get_current_user] = _usuario
    return TestClient(app), app


def test_controller_de_responsavel_busca_salva_e_apaga():
    from sqlalchemy.pool import StaticPool

    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(engine)
    with Session(engine) as db:
        usuario, faixa = _criar_usuario_e_faixa(db)
        aluno = alunos_service.criar(db, usuario, {"nome": "Caio", "faixa_id": faixa.id})
        aluno_id, usuario_id = aluno.id, usuario.id

    cliente, app = _cliente(engine, usuario_id)
    try:
        rota = f"/aluno/{aluno_id}/responsavel/"
        assert cliente.get(rota).status_code == 404
        assert cliente.put(rota, json={}).status_code == 409

        salvo = cliente.put(rota, json={"nome": "Maria", "cpf": "52998224725"})
        assert salvo.status_code == 200
        assert salvo.json()["cpf"] == "529.982.247-25"
        assert cliente.get(rota).json()["nome"] == "Maria"

        assert cliente.delete(rota).status_code == 204
        assert cliente.get(rota).status_code == 404
        assert cliente.get("/aluno/999/responsavel/").status_code == 404
    finally:
        app.dependency_overrides.clear()
        engine.dispose()
