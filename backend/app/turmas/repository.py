from sqlalchemy.orm import Session

from ..associacoes import AlunoTurma
from .models import ChamadaTurma, PresencaTurma, Turma


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


def adicionar_alunos(db: Session, turma: Turma, alunos):
    aluno_ids = {aluno.id for aluno in alunos}
    vinculados = {
        aluno_id
        for (aluno_id,) in db.query(AlunoTurma.aluno_id)
        .filter(
            AlunoTurma.turma_id == turma.id,
            AlunoTurma.aluno_id.in_(aluno_ids),
        )
        .all()
    }
    db.add_all(
        AlunoTurma(aluno=aluno, turma=turma)
        for aluno in alunos
        if aluno.id not in vinculados
    )
    db.commit()


def remover_aluno(db: Session, turma: Turma, aluno):
    db.query(AlunoTurma).filter(
        AlunoTurma.turma_id == turma.id,
        AlunoTurma.aluno_id == aluno.id,
    ).delete(synchronize_session=False)
    db.commit()


def buscar_chamada(db: Session, turma_id: int, data):
    return db.query(ChamadaTurma).filter_by(turma_id=turma_id, data=data).first()


def listar_datas_chamadas(db: Session, turma_id: int):
    return [
        data
        for (data,) in db.query(ChamadaTurma.data)
        .filter(ChamadaTurma.turma_id == turma_id)
        .order_by(ChamadaTurma.data.desc())
        .all()
    ]


def listar_chamadas(db: Session, turma_id: int, inicio, fim):
    return (
        db.query(ChamadaTurma)
        .filter(ChamadaTurma.turma_id == turma_id, ChamadaTurma.data >= inicio, ChamadaTurma.data < fim)
        .order_by(ChamadaTurma.data)
        .all()
    )


def salvar_chamada(db: Session, turma: Turma, data, chamada, marcacoes):
    if chamada is None:
        chamada = ChamadaTurma(turma=turma, data=data)
        chamada.presencas = [
            PresencaTurma(aluno_id=aluno.id, aluno_nome=aluno.nome, presente=marcacoes[aluno.id])
            for aluno in turma.alunos
        ]
        db.add(chamada)
    else:
        for presenca in chamada.presencas:
            presenca.presente = marcacoes[presenca.aluno_id]
    db.commit()
    db.refresh(chamada)
    return chamada
