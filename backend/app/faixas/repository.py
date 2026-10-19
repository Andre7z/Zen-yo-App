from sqlalchemy import func
from sqlalchemy.orm import Session

from .models import Faixa


def listar(db: Session, dono_id: int):
    return (
        db.query(Faixa)
        .filter(Faixa.dono_id == dono_id)
        .order_by(Faixa.ordem.asc(), Faixa.nome.asc())
        .all()
    )


def buscar(db: Session, faixa_id: int):
    return db.query(Faixa).filter(Faixa.id == faixa_id).first()


def maior_ordem(db: Session, dono_id: int) -> int:
    return (
        db.query(func.max(Faixa.ordem)).filter(Faixa.dono_id == dono_id).scalar() or 0
    )


def criar(db: Session, dados: dict):
    faixa = Faixa(**dados)
    db.add(faixa)
    db.commit()
    db.refresh(faixa)
    return faixa


def criar_varias(db: Session, lista: list[dict]):
    db.add_all(Faixa(**dados) for dados in lista)
    db.commit()


def atualizar(db: Session, faixa: Faixa, mudancas: dict):
    for campo, valor in mudancas.items():
        setattr(faixa, campo, valor)

    db.commit()
    db.refresh(faixa)
    return faixa


def apagar(db: Session, faixa: Faixa):
    db.delete(faixa)
    db.commit()
