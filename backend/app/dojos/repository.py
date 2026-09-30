from sqlalchemy.orm import Session

from .models import Dojo


def listar(db: Session):
    return db.query(Dojo).order_by(Dojo.nome.asc()).all()


def buscar(db: Session, dojo_id: int):
    return db.query(Dojo).filter(Dojo.id == dojo_id).first()


def criar(db: Session, dados: dict):
    dojo = Dojo(**dados)
    db.add(dojo)
    db.commit()
    db.refresh(dojo)
    return dojo


def atualizar(db: Session, dojo: Dojo, mudancas: dict):
    for campo, valor in mudancas.items():
        setattr(dojo, campo, valor)

    db.commit()
    db.refresh(dojo)
    return dojo


def apagar(db: Session, dojo: Dojo):
    db.delete(dojo)
    db.commit()
