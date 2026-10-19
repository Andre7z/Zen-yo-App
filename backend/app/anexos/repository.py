from sqlalchemy.orm import Session

from .models import Anexo


def listar(db: Session, dono_id: int):
    return db.query(Anexo).filter(Anexo.dono_id == dono_id).order_by(Anexo.criado_em.desc()).all()


def buscar(db: Session, anexo_id: int):
    return db.query(Anexo).filter(Anexo.id == anexo_id).first()


def buscar_por_url(db: Session, dono_id: int, arquivo_url: str):
    return (
        db.query(Anexo)
        .filter(Anexo.dono_id == dono_id, Anexo.arquivo_url == arquivo_url)
        .first()
    )


def criar(db: Session, dados: dict):
    anexo = Anexo(**dados)
    db.add(anexo)
    db.commit()
    db.refresh(anexo)
    return anexo


def atualizar(db: Session, anexo: Anexo, mudancas: dict):
    for campo, valor in mudancas.items():
        setattr(anexo, campo, valor)

    db.commit()
    db.refresh(anexo)
    return anexo


def apagar(db: Session, anexo: Anexo):
    db.delete(anexo)
    db.commit()
