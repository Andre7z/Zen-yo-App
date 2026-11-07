from types import SimpleNamespace
from pathlib import Path

import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

import app.main  # noqa: F401  registra todos os models
from app.alunos.models import Aluno
from app.database import Base
from app.tamanhos import service
from app.tamanhos.erros import TamanhoDuplicado, TamanhoEmUso
from app.usuarios.models import Usuario


@pytest.fixture
def db():
    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine)
    sessao = sessionmaker(bind=engine)()
    yield sessao
    sessao.close()


@pytest.fixture
def usuario(db):
    dono = Usuario(nome="Prof", email="prof@example.com", senha_hash="x")
    db.add(dono)
    db.commit()
    return SimpleNamespace(id=dono.id)


def test_comeca_com_os_tamanhos_padrao(db, usuario):
    assert service.nomes(db, usuario, "faixa") == ["PP", "P", "N2", "M", "G", "N4", "GG"]
    assert service.nomes(db, usuario, "kimono") == ["M00", "M0", "M1", "M2", "M3", "A0", "A1", "A2", "A3", "A4", "A5"]


def test_migracao_adiciona_a3_sem_duplicar_ou_alterar_outros_catalogos(tmp_path, monkeypatch):
    from alembic import command
    from alembic.config import Config

    url = f"sqlite:///{(tmp_path / 'tamanhos.db').as_posix()}"
    monkeypatch.setenv("DATABASE_URL", url)
    config = Config(str(Path(__file__).resolve().parents[1] / "alembic.ini"))
    command.upgrade(config, "b3c4d5e6f7a8")
    engine = create_engine(url)
    with engine.begin() as conexao:
        for id in range(1, 5):
            conexao.execute(text(
                "INSERT INTO usuarios (id, nome, email, senha_hash) VALUES (:id, 'Prof', :email, 'x')"
            ), {"id": id, "email": f"prof{id}@teste.com"})
        conexao.execute(text(
            "INSERT INTO tamanhos (dono_id, tipo, nome, ordem) VALUES "
            "(1, 'kimono', 'A2', 1), (1, 'kimono', 'A4', 2), (1, 'kimono', 'A5', 3), "
            "(2, 'kimono', 'a3', 7), (2, 'kimono', 'A4', 8), "
            "(3, 'kimono', 'M1', 4), (1, 'faixa', 'A4', 2)"
        ))
    command.upgrade(config, "head")
    with engine.connect() as conexao:
        linhas = conexao.execute(text(
            "SELECT dono_id, tipo, nome, ordem FROM tamanhos ORDER BY dono_id, tipo, ordem"
        )).all()
    assert linhas == [
        (1, "faixa", "A4", 2),
        (1, "kimono", "A2", 1), (1, "kimono", "A3", 2),
        (1, "kimono", "A4", 3), (1, "kimono", "A5", 4),
        (2, "kimono", "a3", 7), (2, "kimono", "A4", 8),
        (3, "kimono", "M1", 4), (3, "kimono", "A3", 5),
    ]
    command.downgrade(config, "b3c4d5e6f7a8")
    command.upgrade(config, "head")
    with engine.connect() as conexao:
        assert conexao.execute(text("SELECT count(*) FROM tamanhos WHERE upper(nome) = 'A3'")).scalar_one() == 3
    engine.dispose()


def test_adiciona_renomeia_e_recusa_duplicado(db, usuario):
    novo = service.criar(db, usuario, {"tipo": "faixa", "nome": "XG"})
    assert service.nomes(db, usuario, "faixa")[-1] == "XG"
    with pytest.raises(TamanhoDuplicado):
        service.criar(db, usuario, {"tipo": "faixa", "nome": "xg"})
    service.atualizar(db, usuario, novo.id, {"nome": "XXG"})
    assert service.nomes(db, usuario, "faixa")[-1] == "XXG"


def test_nao_remove_tamanho_em_uso(db, usuario):
    tamanho = service.listar(db, usuario)[0]
    assert tamanho.tipo == "faixa" or tamanho.tipo == "kimono"
    db.execute(
        Aluno.__table__.insert().values(
            nome="Ana", faixa_id=1, dono_id=usuario.id, faixa_grossa=False, **{f"tamanho_{tamanho.tipo}": tamanho.nome}
        )
    )
    db.commit()
    with pytest.raises(TamanhoEmUso):
        service.apagar(db, usuario, tamanho.id)
