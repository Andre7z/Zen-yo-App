"""As estrategias de relatorio: o padrao Strategy dentro das atividades.

Cada tipo de atividade tem um jeito proprio de gerar seu relatorio.
Aqui cada jeito vira um objeto, e todos respondem a MESMA pergunta:
como gerar o relatorio da atividade.

O Service recebe uma estrategia e pergunta como gerar o relatorio.
Ele nao precisa saber qual tipo de atividade esta sendo tratado.

A pergunta "que tipo de atividade e'?" existe no sistema inteiro uma vez so':
na fabrica abaixo.
"""
from .erros import TipoDeAtividadeDesconhecido


class EstrategiaRelatorio:
    """O contrato: toda estrategia sabe gerar um relatorio."""

    def gerar(self, atividade):
        """Gera o relatorio da atividade."""
        raise NotImplementedError


def _alunos_da_atividade(atividade):
    alunos = getattr(atividade, "alunos", None)
    if alunos is not None:
        return list(alunos)

    aluno = getattr(atividade, "aluno", None)
    return [aluno] if aluno is not None else []


class RelatorioTrocaDeFaixa(EstrategiaRelatorio):
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


class RelatorioEntregaKimono(EstrategiaRelatorio):
    def gerar(self, atividade):
        return [
            {
                "aluno": aluno.nome,
                "turma": getattr(aluno, "turma", None),
                "tamanho_kimono": getattr(aluno, "tamanho_kimono", None),
            }
            for aluno in _alunos_da_atividade(atividade)
        ]


class RelatorioFrequencia(EstrategiaRelatorio):
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


class RelatorioCampeonato(EstrategiaRelatorio):
    def gerar(self, atividade):
        return [
            {
                "aluno": aluno.nome,
                "idade": getattr(aluno, "idade", None),
                "peso": getattr(aluno, "peso", None),
                "codigo_zempo": getattr(aluno, "codigo_zempo", None),
            }
            for aluno in _alunos_da_atividade(atividade)
        ]


class RelatorioFactory:
    """Cria a estrategia correta conforme o tipo de atividade."""

    @staticmethod
    def criar(tipo_atividade):
        estrategias = {
            "troca_de_faixa": RelatorioTrocaDeFaixa(),
            "entrega_de_kimono": RelatorioEntregaKimono(),
            "frequencia": RelatorioFrequencia(),
            "campeonato": RelatorioCampeonato(),
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
    return RelatorioFactory.criar(tipo_atividade)