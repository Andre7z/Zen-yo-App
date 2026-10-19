"""Regras do dominio das faixas. Cada usuario tem o seu proprio catalogo."""

from . import repository
from .erros import ErroFaixa, FaixaNaoEncontrada
from .padrao import FAIXAS_PADRAO


def calcular_ordem(tipo, grau):
    """Iniciante primeiro, depois Kyu (12 ... 1) e por fim Dan (1 ... 10)."""
    tipo = normalizar_tipo(tipo)
    if tipo == "Kyu":
        return 1000 - grau
    if tipo == "Dan":
        return 1000 + grau
    return 0


def normalizar_tipo(tipo):
    return {"INICIANTE": "Iniciante", "KYU": "Kyu", "DAN": "Dan"}.get(str(tipo).strip().upper(), tipo)


def _normalizar(tipo, grau):
    if normalizar_tipo(tipo) == "Iniciante":
        return None
    if grau is None or grau < 1:
        raise ErroFaixa(f"Informe o numero do {tipo} (1 ou mais)")
    return grau


def listar(db, usuario):
    return repository.listar(db, usuario.id)


def buscar(db, usuario, faixa_id):
    faixa = repository.buscar(db, faixa_id)
    if faixa is None or faixa.dono_id != usuario.id:
        raise FaixaNaoEncontrada(f"Faixa {faixa_id} nao esta cadastrada")
    return faixa


def criar(db, usuario, dados):
    grau = _normalizar(dados["tipo"], dados.get("grau"))
    return repository.criar(
        db,
        {
            **dados,
            "grau": grau,
            "ordem": calcular_ordem(dados["tipo"], grau),
            "dono_id": usuario.id,
        },
    )


def atualizar(db, usuario, faixa_id, mudancas):
    faixa = buscar(db, usuario, faixa_id)
    tipo = mudancas.get("tipo", faixa.tipo)
    grau = _normalizar(tipo, mudancas.get("grau", faixa.grau))
    return repository.atualizar(
        db, faixa, {**mudancas, "grau": grau, "ordem": calcular_ordem(tipo, grau)}
    )


def apagar(db, usuario, faixa_id):
    faixa = buscar(db, usuario, faixa_id)
    repository.apagar(db, faixa)


def semear_padrao(db, usuario):
    repository.criar_varias(
        db,
        [
            {
                "nome": nome,
                "tipo": normalizar_tipo(tipo),
                "grau": grau,
                "ordem": calcular_ordem(tipo, grau),
                "dono_id": usuario.id,
            }
            for nome, tipo, grau in FAIXAS_PADRAO
        ],
    )
