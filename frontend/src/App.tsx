import { useEffect, useState, type FormEvent } from 'react'
import { AlertCircle, ArrowRight, Check, Fingerprint, LockKeyhole, LogOut, Mail, ShieldCheck, UserRound } from 'lucide-react'
import type { Usuario } from './api'
import { autenticacaoFacade } from './autenticacao-dependencias'
import './App.css'

function BeltMark() {
  return <span className="belt-icon" aria-hidden="true"><span /></span>
}

function App() {
  const [tela, setTela] = useState<'login' | 'cadastro' | 'inicio'>('login')
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [verificandoSessao, setVerificandoSessao] = useState(true)

  useEffect(() => {
    let ativo = true
    async function restaurarSessao() {
      const perfil = await autenticacaoFacade.restaurarSessao()
      if (ativo && perfil) {
        setUsuario(perfil)
        setTela('inicio')
      }
      if (ativo) setVerificandoSessao(false)
    }
    void restaurarSessao()
    return () => { ativo = false }
  }, [])

  async function entrar(email: string, senha: string) {
    setUsuario(await autenticacaoFacade.entrar(email, senha))
    setTela('inicio')
  }

  async function cadastrar(nome: string, email: string, senha: string) {
    setUsuario(await autenticacaoFacade.cadastrar(nome, email, senha))
    setTela('inicio')
  }

  function sair() {
    autenticacaoFacade.sair()
    setUsuario(null)
    setTela('login')
  }

  if (verificandoSessao) return <main className="splash" aria-label="Verificando sessão"><span><Fingerprint /></span></main>

  return (
    <div className="app-frame">
      {tela === 'inicio' && usuario ? <Inicio usuario={usuario} onSair={sair} /> : (
        <Autenticacao tela={tela === 'cadastro' ? 'cadastro' : 'login'} onTrocarTela={setTela} onEntrar={entrar} onCadastrar={cadastrar} />
      )}
    </div>
  )
}

type AutenticacaoProps = {
  tela: 'login' | 'cadastro'
  onTrocarTela: (tela: 'login' | 'cadastro' | 'inicio') => void
  onEntrar: (email: string, senha: string) => Promise<void>
  onCadastrar: (nome: string, email: string, senha: string) => Promise<void>
}

function Autenticacao({ tela, onTrocarTela, onEntrar, onCadastrar }: AutenticacaoProps) {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  const cadastro = tela === 'cadastro'

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErro('')
    setEnviando(true)
    try {
      if (cadastro) await onCadastrar(nome.trim(), email.trim(), senha)
      else await onEntrar(email.trim(), senha)
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível concluir o acesso.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <main className="auth-layout">
      <section className="dojo-panel" aria-label="Zen'yo App, gestão de judô">
        <div className="panel-topline"><span className="brand-mark"><BeltMark /></span><span className="brand-name">ZEN&apos;YO APP</span><span className="brand-caption">GERENCIADOR DE ATIVIDADES DE JUDÔ</span></div>
        <div className="panel-copy"><span className="eyebrow"><i /> EFICIÊNCIA</span><h1>SEIRYOKU ZEN'YO</h1><h1>JITA KYOEI</h1><p>Gerenciador de atividades de judô.</p></div>
        <div className="mat-graphic" aria-hidden="true"><span className="mat-ring ring-one" /><span className="mat-ring ring-two" /><span className="mat-ring ring-three" /><span className="mat-center">柔道</span><span className="mat-label">JUDÔ · CAMINHO SUAVE</span></div>
        <div className="panel-footer"><span>DOJO</span><span>RESPEITO · CORAGEM · EQUILÍBRIO</span><span>01 / 03</span></div>
      </section>
      <section className="auth-panel">
        <div className="mobile-brand"><span className="brand-mark"><BeltMark /></span><span className="brand-name">ZEN&apos;YO APP</span></div>
        <div className="auth-content" key={tela}>
          <div className="auth-heading"><span className="auth-step">{cadastro ? 'COMECE SUA JORNADA' : 'BEM-VINDO DE VOLTA'}</span><h2>{cadastro ? 'Crie sua conta' : 'Entre no seu dojo'}</h2><p>{cadastro ? 'Seus treinos começam com um primeiro passo.' : 'Acesse seu espaço de gestão e continue de onde parou.'}</p></div>
          {erro && <div className="form-error" role="alert"><AlertCircle size={17} /><span>{erro}</span></div>}
          <form className="auth-form" onSubmit={handleSubmit}>
            {cadastro && <label className="field"><span>Nome completo</span><span className="input-wrap"><UserRound size={17} /><input autoComplete="name" minLength={2} placeholder="Como podemos chamar você?" required value={nome} onChange={(event) => setNome(event.target.value)} /></span></label>}
            <label className="field"><span>E-mail</span><span className="input-wrap"><Mail size={17} /><input autoComplete="email" type="email" placeholder="voce@exemplo.com" required value={email} onChange={(event) => setEmail(event.target.value)} /></span></label>
            <label className="field"><span>Senha</span><span className="input-wrap"><LockKeyhole size={17} /><input autoComplete={cadastro ? 'new-password' : 'current-password'} minLength={cadastro ? 6 : undefined} placeholder={cadastro ? 'Pelo menos 6 caracteres' : 'Sua senha'} required type="password" value={senha} onChange={(event) => setSenha(event.target.value)} /></span></label>
            <button className="submit-button" type="submit" disabled={enviando}>{enviando ? 'Aguarde...' : cadastro ? 'Criar conta' : 'Entrar'}{!enviando && <ArrowRight size={17} />}</button>
          </form>
          <p className="auth-switch">{cadastro ? 'Já tem uma conta?' : 'Ainda não tem conta?'}{' '}<button type="button" onClick={() => { setErro(''); onTrocarTela(cadastro ? 'login' : 'cadastro') }}>{cadastro ? 'Fazer login' : 'Cadastre-se'}</button></p>
          <div className="auth-assurance"><ShieldCheck size={16} /><span>Acesso protegido por autenticação segura</span></div>
        </div>
        <footer className="auth-footer"><span>ZEN&apos;YO APP</span><span>FEITO PARA O DOJO</span></footer>
      </section>
    </main>
  )
}

function Inicio({ usuario, onSair }: { usuario: Usuario; onSair: () => void }) {
  const primeiroNome = usuario.nome.trim().split(/\s+/)[0]
  return (
    <main className="home-layout">
      <header className="home-header"><a className="home-brand" href="#inicio" aria-label="Zen'yo início"><span className="brand-mark"><BeltMark /></span><span className="brand-name">zen&apos;yo<span>.</span></span></a><div className="header-session"><i /> SESSÃO ATIVA</div><button aria-label="Sair" className="logout-button" onClick={onSair} type="button"><LogOut size={16} /><span>Sair</span></button></header>
      <section className="home-main">
        <div className="home-kicker"><i /> SEU ESPAÇO, SEU CAMINHO</div><h1>Bem-vindo, <em>{primeiroNome}.</em></h1><p className="home-intro">Sua sessão está conectada. Aqui estão os dados da sua conta.</p>
        <div className="welcome-grid">
          <article className="welcome-card"><div className="card-top"><span className="card-icon"><UserRound size={19} /></span><span className="card-status"><Check size={14} /> AUTENTICADO</span></div><span className="card-label">PERFIL DO PROFESSOR</span><h2>{usuario.nome}</h2><div className="profile-line"><Mail size={16} /><span>{usuario.email}</span></div><div className="profile-line"><Fingerprint size={16} /><span>Conta #{usuario.id}</span></div></article>
          <article className="session-card"><div className="session-emblem"><ShieldCheck size={23} /></div><span className="card-label">ACESSO SEGURO</span><h2>Conexão verificada</h2><p>Seu token JWT foi validado pela API. As próximas chamadas autenticadas enviarão essa credencial automaticamente.</p><div className="session-foot"><i /> TOKEN ATIVO <span>JWT <Check size={13} /></span></div></article>
        </div>
        <div className="home-note"><div><strong>Rei</strong><span>Respeito é o começo e o fim do judô.</span></div><span className="note-mark">柔道</span></div>
        <footer className="home-footer"><span>ZEN&apos;YO · GESTÃO DE JUDÔ</span><span>CAMINHO SUAVE, GESTÃO PRESENTE</span></footer>
      </section>
    </main>
  )
}

export default App
