import { Check, Fingerprint, Mail, ShieldCheck, UserRound } from 'lucide-react'
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
        <article className="welcome-card"><div className="card-top"><span className="card-icon"><UserRound size={19} /></span><span className="card-status"><Check size={14} /> AUTENTICADO</span></div><span className="card-label">PERFIL DO PROFESSOR</span><h2>{usuario.nome}</h2><div className="profile-line"><Mail size={16} /><span>{usuario.email}</span></div><div className="profile-line"><Fingerprint size={16} /><span>Conta #{usuario.id}</span></div></article>
        <article className="session-card"><div className="session-emblem"><ShieldCheck size={23} /></div><span className="card-label">ACESSO SEGURO</span><h2>Conexão verificada</h2><p>Seu token JWT foi validado pela API. As próximas chamadas autenticadas enviarão essa credencial automaticamente.</p><div className="session-foot"><i /> TOKEN ATIVO <span>JWT <Check size={13} /></span></div></article>
      </div>
      <div className="home-note"><span className="note-mark">柔道</span></div>
      <footer className="home-footer"><span>ZEN'YO · GESTÃO DE JUDÔ</span></footer>
    </section>
  )
}
