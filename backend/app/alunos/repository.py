from sqlalchemy.orm import Session

from .models import Aluno

# A UNICA parte do sistema que sabe que existe um banco.
# Se aparecer um `db.query` fora daqui, a camada vazou.


def listar(db: Session, dono_id: int):
    return db.query(Aluno).filter(Aluno.dono_id == dono_id).all()


def buscar(db: Session, aluno_id: int):
    return db.query(Aluno).filter(Aluno.id == aluno_id).first()


def buscar_por_ids(db: Session, dono_id: int, aluno_ids: list[int]):
    if not aluno_ids:
        return []

    return (
        db.query(Aluno)
        .filter(Aluno.dono_id == dono_id, Aluno.id.in_(aluno_ids))
        .all()
    )


def criar(db: Session, dados: dict):
    aluno = Aluno(**dados)
    db.add(aluno)
    db.commit()
    db.refresh(aluno)
    return aluno


def buscar_por_nome(db: Session, nome: str):
    return db.query(Aluno).filter(Aluno.nome == nome).first()


def atualizar(db: Session, aluno: Aluno, mudancas: dict):
    for campo, valor in mudancas.items():
        setattr(aluno, campo, valor)

    db.commit()
    db.refresh(aluno)
    return aluno


def apagar(db: Session, aluno: Aluno):
    db.delete(aluno)
    db.commit()