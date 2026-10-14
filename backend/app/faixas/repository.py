from sqlalchemy.orm import Session

from .models import Faixa


def listar(db: Session):
    return db.query(Faixa).order_by(Faixa.ordem.asc(), Faixa.nome.asc()).all()


def buscar(db: Session, faixa_id: int):
    return db.query(Faixa).filter(Faixa.id == faixa_id).first()


def buscar_por_nome(db: Session, nome: str):
    return db.query(Faixa).filter(Faixa.nome == nome).first()


def criar(db: Session, dados: dict):
    faixa = Faixa(**dados)
    db.add(faixa)
    db.commit()
    db.refresh(faixa)
    return faixa


def atualizar(db: Session, faixa: Faixa, mudancas: dict):
    for campo, valor in mudancas.items():
        setattr(faixa, campo, valor)

    db.commit()
    db.refresh(faixa)
    return faixa


def apagar(db: Session, faixa: Faixa):
    db.delete(faixa)
    db.commit()
