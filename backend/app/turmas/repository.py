from sqlalchemy.orm import Session

from .models import Turma


def listar(db: Session, dono_id: int):
    return db.query(Turma).filter(Turma.dono_id == dono_id).order_by(Turma.nome.asc()).all()


def buscar(db: Session, turma_id: int):
    return db.query(Turma).filter(Turma.id == turma_id).first()


def criar(db: Session, dados: dict):
    turma = Turma(**dados)
    db.add(turma)
    db.commit()
    db.refresh(turma)
    return turma


def atualizar(db: Session, turma: Turma, mudancas: dict):
    for campo, valor in mudancas.items():
        setattr(turma, campo, valor)

    db.commit()
    db.refresh(turma)
    return turma


def apagar(db: Session, turma: Turma):
    db.delete(turma)
    db.commit()
