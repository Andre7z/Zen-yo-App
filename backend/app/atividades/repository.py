from sqlalchemy import update
from sqlalchemy.orm import Session

from ..associacoes import atividade_alunos
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
    valores = dict(dados)
    aluno_ids_pagos = valores.pop("aluno_ids_pagos", [])
    atividade = Atividade(**valores)

    db.add(atividade)
    db.flush()
    _salvar_pagamentos(db, atividade.id, aluno_ids_pagos)
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
    valores = dict(mudancas)
    aluno_ids_pagos = valores.pop("aluno_ids_pagos", None)
    # Aplica somente os campos que foram enviados para alteração.
    for campo, valor in valores.items():
        setattr(atividade, campo, valor)

    db.flush()
    if aluno_ids_pagos is not None:
        _salvar_pagamentos(db, atividade.id, aluno_ids_pagos)
    db.commit()
    db.refresh(atividade)

    return atividade

def apagar(db: Session, atividade: Atividade):
    db.delete(atividade)
    db.commit()


def _salvar_pagamentos(db: Session, atividade_id: int, aluno_ids_pagos: list[int]):
    vinculos = atividade_alunos.update().where(
        atividade_alunos.c.atividade_id == atividade_id
    )
    db.execute(vinculos.values(pago=False))
    if aluno_ids_pagos:
        db.execute(
            vinculos.where(atividade_alunos.c.aluno_id.in_(aluno_ids_pagos)).values(pago=True)
        )