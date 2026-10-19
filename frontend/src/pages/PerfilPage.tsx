import { Check, Fingerprint, Mail, UserRound } from 'lucide-react'
import { useAutenticacao } from '../autenticacao-context'

export function PerfilPage() {
  const { usuario } = useAutenticacao()
  if (!usuario) return null

  return (
    <section className="home-main profile-main">
      <div className="home-kicker"><i />CONTA DO DOJÔ</div>
      <h1>Seu <em>perfil.</em></h1>
      <p className="home-intro">Dados associados à sua conta de gestão.</p>
      <article className="welcome-card profile-card">
        <div className="card-top"><span className="card-icon"><UserRound size={19} /></span><span className="card-status"><Check size={14} /> AUTENTICADO</span></div>
        <span className="card-label">PERFIL DO PROFESSOR</span>
        <h2>{usuario.nome}</h2>
        <div className="profile-line"><Mail size={16} /><span>{usuario.email}</span></div>
        <div className="profile-line"><Fingerprint size={16} /><span>Conta #{usuario.id}</span></div>
      </article>
      <footer className="home-footer"><span>ZEN'YO · GESTÃO DE JUDÔ</span><span>CAMINHO SUAVE, GESTÃO PRESENTE</span></footer>
    </section>
  )
}
