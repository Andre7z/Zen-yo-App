import { UserRound } from 'lucide-react'
import { useAutenticacao } from '../autenticacao-context'

export function InicioPage() {
  const { usuario } = useAutenticacao()
  if (!usuario) return null
  const primeiroNome = usuario.nome.trim().split(/\s+/)[0]

  return (
    <section className="home-main">
      <h1>Bem-vindo, <em>{primeiroNome}.</em></h1>
      <p className="home-intro">Sua sessão está conectada. Aqui estão os dados da sua conta.</p>
      <div className="welcome-grid">
        <article className="welcome-card"><div className="card-top"><span className="card-icon"><UserRound size={19} /></span></div><span className="card-label">PERFIL DO PROFESSOR</span><h2>{usuario.nome}</h2></article>
        
      </div>
      <div className="home-note"><span className="note-mark">柔道</span></div>
      <footer className="home-footer"><span>ZEN'YO · GESTÃO DE JUDÔ</span></footer>
    </section>
  )
}
