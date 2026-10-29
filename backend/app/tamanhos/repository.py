from sqlalchemy import func
from sqlalchemy.orm import Session

from ..alunos.models import Aluno
from .models import Tamanho


def listar(db: Session, dono_id: int):
    return (
        db.query(Tamanho)
        .filter(Tamanho.dono_id == dono_id)
        .order_by(Tamanho.tipo, Tamanho.ordem, Tamanho.id)
        .all()
    )


def buscar(db: Session, tamanho_id: int):
    return db.query(Tamanho).filter(Tamanho.id == tamanho_id).first()


def buscar_por_nome(db: Session, dono_id: int, tipo: str, nome: str):
    return (
        db.query(Tamanho)
        .filter(Tamanho.dono_id == dono_id, Tamanho.tipo == tipo, func.upper(Tamanho.nome) == nome.upper())
        .first()
    )


def proxima_ordem(db: Session, dono_id: int, tipo: str) -> int:
    maior = (
        db.query(func.max(Tamanho.ordem))
        .filter(Tamanho.dono_id == dono_id, Tamanho.tipo == tipo)
        .scalar()
    )
    return (maior or 0) + 1


def criar(db: Session, dados: dict):
    tamanho = Tamanho(**dados)
    db.add(tamanho)
    db.commit()
    db.refresh(tamanho)
    return tamanho


def criar_varios(db: Session, itens: list[dict]):
    db.add_all([Tamanho(**dados) for dados in itens])
    db.commit()


def atualizar(db: Session, tamanho: Tamanho, mudancas: dict):
    for campo, valor in mudancas.items():
        setattr(tamanho, campo, valor)
    db.commit()
    db.refresh(tamanho)
    return tamanho


def apagar(db: Session, tamanho: Tamanho):
    db.delete(tamanho)
    db.commit()


def _coluna_do_aluno(tipo: str):
    return Aluno.tamanho_kimono if tipo == "kimono" else Aluno.tamanho_faixa


def contar_alunos(db: Session, dono_id: int, tipo: str, nome: str) -> int:
    coluna = _coluna_do_aluno(tipo)
    return (
        db.query(Aluno)
        .filter(Aluno.dono_id == dono_id, func.upper(coluna) == nome.upper())
        .count()
    )


def renomear_nos_alunos(db: Session, dono_id: int, tipo: str, antigo: str, novo: str):
    coluna = _coluna_do_aluno(tipo)
    db.query(Aluno).filter(Aluno.dono_id == dono_id, func.upper(coluna) == antigo.upper()).update(
        {coluna.key: novo}, synchronize_session=False
    )
