"""As regras de conta e de login, e mais nada.

Nenhum HTTP, nenhum SQL e nenhum JWT aqui: o hash e o token vem de
app/seguranca.py; a consulta vem do repository. O service so' decide.
"""
from .. import seguranca
from ..faixas import service as faixas_service
from . import repository
from .erros import CredenciaisInvalidas, EmailJaCadastrado, SenhaAtualIncorreta


def buscar(db, usuario_id):
    return repository.buscar(db, usuario_id)


def cadastrar(db, dados):
    # RN04: um e-mail, uma conta.
    if repository.buscar_por_email(db, dados["email"]):
        raise EmailJaCadastrado(f"Ja existe uma conta com o e-mail {dados['email']}")

    # A senha em texto chega ate' aqui e NAO passa deste ponto: o que vai
    # para o banco e' o hash.
    senha = dados.pop("senha")
    usuario = repository.criar(db, {**dados, "senha_hash": seguranca.gerar_hash(senha)})
    faixas_service.semear_padrao(db, usuario)
    return usuario


def atualizar_perfil(db, usuario, dados):
    mudancas = {}
    if dados.get("nome") is not None:
        mudancas["nome"] = dados["nome"].strip()

    novo_email = dados.get("email")
    troca_email = novo_email is not None and novo_email != usuario.email
    nova_senha = dados.get("nova_senha")

    if troca_email or nova_senha:
        senha_atual = dados.get("senha_atual")
        if not senha_atual or not seguranca.conferir_senha(senha_atual, usuario.senha_hash):
            raise SenhaAtualIncorreta("Informe corretamente a senha atual para alterar e-mail ou senha")

    if troca_email:
        # RN04: um e-mail, uma conta.
        existente = repository.buscar_por_email(db, novo_email)
        if existente and existente.id != usuario.id:
            raise EmailJaCadastrado(f"Ja existe uma conta com o e-mail {novo_email}")
        mudancas["email"] = novo_email
    if nova_senha:
        mudancas["senha_hash"] = seguranca.gerar_hash(nova_senha)

    return repository.atualizar(db, usuario, mudancas) if mudancas else usuario


def autenticar(db, email, senha):
    usuario = repository.buscar_por_email(db, email)
    if usuario is None or not seguranca.conferir_senha(senha, usuario.senha_hash):
        raise CredenciaisInvalidas("E-mail ou senha incorretos")
    return usuario
