from types import SimpleNamespace

import pytest
from sqlalchemy import create_engine
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
    assert service.nomes(db, usuario, "kimono")[0] == "M00"


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
