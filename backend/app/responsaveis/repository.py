from sqlalchemy.orm import Session

from .models import Responsavel


def buscar_por_aluno(db: Session, aluno_id: int):
    return db.query(Responsavel).filter(Responsavel.aluno_id == aluno_id).first()


def criar(db: Session, aluno, dados: dict):
    responsavel = Responsavel(aluno=aluno, **dados)
    db.add(responsavel)
    db.flush()
    return responsavel


def atualizar(db: Session, responsavel: Responsavel, mudancas: dict):
    for campo, valor in mudancas.items():
        setattr(responsavel, campo, valor)
    db.flush()
    return responsavel


def apagar(db: Session, responsavel: Responsavel):
    db.delete(responsavel)
    db.flush()


def confirmar(db: Session):
    db.commit()
