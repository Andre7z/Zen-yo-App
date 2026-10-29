"""Regras dos tamanhos de kimono e de faixa."""

from . import repository
from .erros import TamanhoDuplicado, TamanhoEmUso, TamanhoNaoEncontrado

PADRAO = {
    "kimono": ["M00", "M0", "M1", "M2", "M3", "A0", "A1", "A2", "A4", "A5"],
    "faixa": ["PP", "P", "N2", "M", "G", "N4", "GG"],
}


def _garantir_padrao(db, usuario):
    """Cada professor comeca com os tamanhos padrao, cadastrados na primeira consulta."""
    existentes = {tamanho.tipo for tamanho in repository.listar(db, usuario.id)}
    novos = [
        {"tipo": tipo, "nome": nome, "ordem": posicao, "dono_id": usuario.id}
        for tipo, nomes in PADRAO.items()
        if tipo not in existentes
        for posicao, nome in enumerate(nomes, start=1)
    ]
    if novos:
        repository.criar_varios(db, novos)


def listar(db, usuario):
    _garantir_padrao(db, usuario)
    return repository.listar(db, usuario.id)


def nomes(db, usuario, tipo):
    return [tamanho.nome for tamanho in listar(db, usuario) if tamanho.tipo == tipo]


def buscar(db, usuario, tamanho_id):
    tamanho = repository.buscar(db, tamanho_id)
    if tamanho is None or tamanho.dono_id != usuario.id:
        raise TamanhoNaoEncontrado(f"Tamanho {tamanho_id} nao esta cadastrado")
    return tamanho


def criar(db, usuario, dados):
    _garantir_padrao(db, usuario)
    if repository.buscar_por_nome(db, usuario.id, dados["tipo"], dados["nome"]):
        raise TamanhoDuplicado(f"O tamanho {dados['nome']} ja existe")
    ordem = repository.proxima_ordem(db, usuario.id, dados["tipo"])
    return repository.criar(db, {**dados, "ordem": ordem, "dono_id": usuario.id})


def atualizar(db, usuario, tamanho_id, mudancas):
    tamanho = buscar(db, usuario, tamanho_id)
    antigo = tamanho.nome
    novo = mudancas.get("nome")
    if novo and novo.upper() != antigo.upper():
        if repository.buscar_por_nome(db, usuario.id, tamanho.tipo, novo):
            raise TamanhoDuplicado(f"O tamanho {novo} ja existe")
        repository.renomear_nos_alunos(db, usuario.id, tamanho.tipo, antigo, novo)
    return repository.atualizar(db, tamanho, {k: v for k, v in mudancas.items() if v is not None})


def apagar(db, usuario, tamanho_id):
    tamanho = buscar(db, usuario, tamanho_id)
    quantidade = repository.contar_alunos(db, usuario.id, tamanho.tipo, tamanho.nome)
    if quantidade:
        raise TamanhoEmUso(
            f"O tamanho {tamanho.nome} e usado por {quantidade} aluno(s). Troque o tamanho deles antes de remover."
        )
    repository.apagar(db, tamanho)
