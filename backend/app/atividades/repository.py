from sqlalchemy.orm import Session

from .models import Atividade


# A UNICA parte do sistema que sabe que existe um banco.
# Se aparecer um `db.query` fora daqui, a camada vazou.


def listar(
    db: Session,
    dono_id: int,
    tipo: str | None = None,
    nome: str | None = None,
):
    # A consulta começa filtrando pelo dono.
    # Os filtros só entram quando forem informados.
    consulta = db.query(Atividade).filter(
        Atividade.dono_id == dono_id
    )

    if tipo:
        consulta = consulta.filter(Atividade.tipo == tipo)

    if nome:
        consulta = consulta.filter(Atividade.nome == nome)

    return consulta.order_by(Atividade.data).all()

def buscar(db: Session, atividade_id: int):
    # Busca uma atividade pelo seu ID.
    return (
        db.query(Atividade)
        .filter(Atividade.id == atividade_id)
        .first()
    )


def criar(db: Session, dados: dict):
    atividade = Atividade(**dados)

    db.add(atividade)
    db.commit()
    db.refresh(atividade)  # O id nasce no banco; sem isto ele pode não estar atualizado.

    return atividade

def buscar_por_nome(db: Session, dono_id: int, nome: str):
    # O nome pode se repetir entre donos diferentes.
    # Por isso, a busca considera o dono da atividade.
    return (
        db.query(Atividade)
        .filter(
            Atividade.dono_id == dono_id,
            Atividade.nome == nome
        )
        .first()
    )

def atualizar(db: Session, atividade: Atividade, mudancas: dict):
    # Aplica somente os campos que foram enviados para alteração.
    for campo, valor in mudancas.items():
        setattr(atividade, campo, valor)

    db.commit()
    db.refresh(atividade)

    return atividade

def apagar(db: Session, atividade: Atividade):
    db.delete(atividade)
    db.commit()