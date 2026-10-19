"""Coordena casos de uso de atividade que dependem de outros modulos."""

class AtividadeFacade:
    """Simplifica a criacao e edicao de atividades com alunos associados."""

    def __init__(self, atividades_service, alunos_service):
        self.atividades_service = atividades_service
        self.alunos_service = alunos_service

    def criar(self, db, usuario, dados):
        dados_atividade = dict(dados)
        aluno_ids = dados_atividade.pop("aluno_ids", [])
        dados_atividade["alunos"] = self.alunos_service.buscar_por_ids(db, usuario, aluno_ids)

        return self.atividades_service.criar(db, usuario, dados_atividade)

    def atualizar(self, db, usuario, atividade_id, mudancas):
        dados_atualizacao = dict(mudancas)

        if "aluno_ids" in dados_atualizacao:
            aluno_ids = dados_atualizacao.pop("aluno_ids") or []
            dados_atualizacao["alunos"] = self.alunos_service.buscar_por_ids(
                db,
                usuario,
                aluno_ids,
            )

        return self.atividades_service.atualizar(
            db,
            usuario,
            atividade_id,
            dados_atualizacao,
        )