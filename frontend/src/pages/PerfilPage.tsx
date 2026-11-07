import { useState, type SubmitEvent } from 'react'
import { Mail, Pencil, UserRound } from 'lucide-react'
import { useAutenticacao } from '../autenticacao-context'
import { CampoModulo } from '../components/PaginaModulo'
import { ModalDetalhes } from '../components/ModalDetalhes'
import { CampoSenha } from '../components/CampoSenha'
import { useNotificacao } from '../notificacoes-context'

const formularioVazio = { nome: '', email: '', senha_atual: '', nova_senha: '', confirmar: '' }

export function PerfilPage() {
  const { usuario, atualizarPerfil } = useAutenticacao()
  const notificacao = useNotificacao()
  const [editando, setEditando] = useState(false)
  const [dados, setDados] = useState(formularioVazio)
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)
  if (!usuario) return null

  function abrirEdicao() {
    setDados({ ...formularioVazio, nome: usuario?.nome ?? '', email: usuario?.email ?? '' })
    setErro('')
    setEditando(true)
  }

  async function salvar(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (dados.nova_senha && dados.nova_senha !== dados.confirmar) {
      setErro('A confirmação da nova senha não confere.')
      return
    }
    setSalvando(true)
    setErro('')
    try {
      await atualizarPerfil({
        nome: dados.nome.trim(),
        email: dados.email.trim(),
        ...(dados.nova_senha ? { nova_senha: dados.nova_senha } : {}),
        ...(dados.senha_atual ? { senha_atual: dados.senha_atual } : {}),
      })
      setEditando(false)
      notificacao.sucesso('Perfil atualizado com sucesso.')
    } catch (falha) {
      const mensagem = falha instanceof Error ? falha.message : 'Não foi possível salvar o perfil.'
      setErro(mensagem)
      notificacao.erro(mensagem)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <section className="home-main profile-main">
      <h1>Perfil</h1>
      <p className="home-intro">Dados associados à sua conta de gestão.</p>
      <article className="welcome-card profile-card">
        <div className="card-top"><span className="card-icon"><UserRound size={19} /></span></div>
        <h2>Sensei {usuario.nome}</h2>
        <div className="profile-line"><Mail size={16} /><span>{usuario.email}</span></div>
        <button className="module-primary" type="button" onClick={abrirEdicao}><Pencil size={16} />Editar perfil</button>
      </article>

      {editando && (
        <ModalDetalhes contexto="CADASTRO" titulo="Editar perfil" aoFechar={() => setEditando(false)}>
          <form className="module-form" onSubmit={(event) => void salvar(event)}>
            <div className="module-form-grid">
              <CampoModulo rotulo="Nome"><input required minLength={2} maxLength={80} value={dados.nome} onChange={(event) => setDados({ ...dados, nome: event.target.value })} /></CampoModulo>
              <CampoModulo rotulo="E-mail"><input required type="email" value={dados.email} onChange={(event) => setDados({ ...dados, email: event.target.value })} /></CampoModulo>
              <CampoSenha rotulo="Senha atual" dica="Necessária para alterar e-mail ou senha." autoComplete="current-password" value={dados.senha_atual} onChange={(event) => setDados({ ...dados, senha_atual: event.target.value })} />
              <CampoSenha rotulo="Nova senha" minLength={6} autoComplete="new-password" value={dados.nova_senha} onChange={(event) => setDados({ ...dados, nova_senha: event.target.value })} />
              <CampoSenha rotulo="Confirmar nova senha" autoComplete="new-password" value={dados.confirmar} onChange={(event) => setDados({ ...dados, confirmar: event.target.value })} />
            </div>
            {erro && <p className="module-error" role="alert">{erro}</p>}
            <div className="module-form-actions">
              <button className="module-primary" type="submit" disabled={salvando}>Salvar perfil</button>
              <button className="module-secondary" type="button" onClick={() => setEditando(false)}>Cancelar</button>
            </div>
          </form>
        </ModalDetalhes>
      )}
      <footer className="home-footer"><span>ZEN'YO APP</span></footer>
    </section>
  )
}
