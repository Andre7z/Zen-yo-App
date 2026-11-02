import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import app.main  # noqa: F401  registra todos os models
from app import seguranca
from app.alunos.schemas import AlunoCriar
from app.anexos.schemas import CATEGORIAS_ANEXO
from app.database import Base
from app.usuarios import service
from app.usuarios.erros import EmailJaCadastrado, SenhaAtualIncorreta
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
    dono = Usuario(nome="Prof", email="prof@example.com", senha_hash=seguranca.gerar_hash("segredo1"))
    outro = Usuario(nome="Outro", email="outro@example.com", senha_hash="x")
    db.add_all([dono, outro])
    db.commit()
    return dono


def test_altera_nome_sem_pedir_senha(db, usuario):
    atualizado = service.atualizar_perfil(db, usuario, {"nome": "  Novo Nome "})
    assert atualizado.nome == "Novo Nome"


def test_troca_de_email_exige_senha_atual(db, usuario):
    with pytest.raises(SenhaAtualIncorreta):
        service.atualizar_perfil(db, usuario, {"email": "novo@example.com"})
    atualizado = service.atualizar_perfil(db, usuario, {"email": "novo@example.com", "senha_atual": "segredo1"})
    assert atualizado.email == "novo@example.com"


def test_recusa_email_de_outra_conta(db, usuario):
    with pytest.raises(EmailJaCadastrado):
        service.atualizar_perfil(db, usuario, {"email": "outro@example.com", "senha_atual": "segredo1"})


def test_troca_de_senha(db, usuario):
    with pytest.raises(SenhaAtualIncorreta):
        service.atualizar_perfil(db, usuario, {"nova_senha": "novasenha", "senha_atual": "errada"})
    atualizado = service.atualizar_perfil(db, usuario, {"nova_senha": "novasenha", "senha_atual": "segredo1"})
    assert seguranca.conferir_senha("novasenha", atualizado.senha_hash)


def test_genero_do_aluno_e_apostila_sao_aceitos():
    assert AlunoCriar(nome="Ana", faixa_id=1, genero="Feminino").genero == "Feminino"
    with pytest.raises(ValueError):
        AlunoCriar(nome="Ana", faixa_id=1, genero="Outro")
    assert "Apostila" in CATEGORIAS_ANEXO
