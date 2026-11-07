"""As estrategias de planilha: o padrao Strategy dentro das atividades.

Cada tipo de atividade tem um jeito proprio de gerar seu planilha.
Aqui cada jeito vira um objeto, e todos respondem a MESMA pergunta:
como gerar a planilha da atividade.

O Service recebe uma estrategia e pergunta como gerar a planilha.
Ele nao precisa saber qual tipo de atividade esta sendo tratado.

A pergunta "que tipo de atividade e'?" existe no sistema inteiro uma vez so':
na fabrica abaixo.
"""
from .erros import TipoDeAtividadeDesconhecido
from ..ordenacao import ordenar_alunos_por_nome


class EstrategiaPlanilha:
    """O contrato: toda estrategia sabe gerar uma planilha."""

    def gerar(self, atividade):
        """Gera a planilha da atividade."""
        raise NotImplementedError


def _alunos_da_atividade(atividade):
    alunos = getattr(atividade, "alunos", None)
    if alunos is not None:
        return ordenar_alunos_por_nome(alunos)

    aluno = getattr(atividade, "aluno", None)
    return [aluno] if aluno is not None else []


class PlanilhaTrocaDeFaixa(EstrategiaPlanilha):
    def gerar(self, atividade):
        return [
            {
                "aluno": aluno.nome,
                "faixa_atual": aluno.faixa_obj.nome,
                "nova_faixa": atividade.nova_faixa,
                "tamanho_faixa": getattr(aluno, "tamanho_faixa", None),
            }
            for aluno in _alunos_da_atividade(atividade)
        ]


class PlanilhaEntregaKimono(EstrategiaPlanilha):
    def gerar(self, atividade):
        return [
            {
                "aluno": aluno.nome,
                "turma": getattr(aluno, "turma", None),
                "tamanho_kimono": getattr(aluno, "tamanho_kimono", None),
            }
            for aluno in _alunos_da_atividade(atividade)
        ]


class PlanilhaFrequencia(EstrategiaPlanilha):
    def gerar(self, atividade):
        alunos_presentes = set(getattr(atividade, "aluno_ids_pagos", []) or [])
        return [
            {
                "aluno": aluno.nome,
                "presenca": aluno.id in alunos_presentes,
                "data": atividade.data,
            }
            for aluno in _alunos_da_atividade(atividade)
        ]


class PlanilhaCampeonato(EstrategiaPlanilha):
    def gerar(self, atividade):
        return [
            {
                "aluno": aluno.nome,
                "idade": getattr(aluno, "idade", None),
                "genero": getattr(aluno, "genero", None),
                "peso": getattr(aluno, "peso", None),
                "codigo_zempo": getattr(aluno, "codigo_zempo", None),
            }
            for aluno in _alunos_da_atividade(atividade)
        ]


class PlanilhaFactory:
    """Cria a estrategia correta conforme o tipo de atividade."""

    @staticmethod
    def criar(tipo_atividade):
        estrategias = {
            "troca_de_faixa": PlanilhaTrocaDeFaixa(),
            "entrega_de_kimono": PlanilhaEntregaKimono(),
            "frequencia": PlanilhaFrequencia(),
            "campeonato": PlanilhaCampeonato(),
        }

        if tipo_atividade not in estrategias:
            aceitos = ", ".join(estrategias)
            raise TipoDeAtividadeDesconhecido(
                f"Tipo de atividade desconhecido: {tipo_atividade!r} "
                f"(aceitos: {aceitos})"
            )

        return estrategias[tipo_atividade]


def estrategia_para(tipo_atividade):
    """Compatibilidade com o codigo antigo: delega para a fabrica."""
    return PlanilhaFactory.criar(tipo_atividade)