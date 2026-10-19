"""Coordena o vinculo de professores e dojos nos casos de uso de turma."""

class TurmaFacade:
    """Simplifica criacao e edicao de turma com validacao do professor."""

    def __init__(self, turmas_service, usuarios_service):
        self.turmas_service = turmas_service
        self.usuarios_service = usuarios_service

    def _buscar_professor(self, db, professor_id):
        if professor_id is None:
            return None
        return self.usuarios_service.buscar(db, professor_id)

    def criar(self, db, usuario, dados):
        dados_turma = dict(dados)
        professor = self._buscar_professor(
            db,
            dados_turma.get("professor_id"),
        )
        return self.turmas_service.criar(db, usuario, dados_turma, professor)

    def atualizar(self, db, usuario, turma_id, mudancas):
        dados_atualizacao = dict(mudancas)
        turma = self.turmas_service.buscar(db, usuario, turma_id)
        professor_id = dados_atualizacao.get(
            "professor_id",
            turma.professor_id,
        )
        professor = self._buscar_professor(db, professor_id)

        return self.turmas_service.atualizar(
            db,
            turma,
            dados_atualizacao,
            professor,
        )
