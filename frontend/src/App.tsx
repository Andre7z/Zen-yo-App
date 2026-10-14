import { useState, type FormEvent } from 'react'
import { BrowserRouter, Link, Navigate, NavLink, Outlet, Route, Routes, useNavigate } from 'react-router-dom'
import { Activity, AlertCircle, ArrowRight, CalendarDays, Check, Fingerprint, House, LockKeyhole, LogOut, Mail, Paperclip, ShieldCheck, UserRound, UsersRound } from 'lucide-react'
import { useAutenticacao } from './autenticacao-context'
import { AutenticacaoProvider } from './autenticacao-contexto'
import { ROTAS } from './routes'
import './App.css'

function BeltMark() {
  return <img className="belt-symbol" src="/zenyo-mark.svg" alt="" aria-hidden="true" />
}

function App() {
  return (
    <AutenticacaoProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<RotasPublicas />}>
            <Route path={ROTAS.login} element={<Autenticacao tela="login" />} />
            <Route path={ROTAS.cadastro} element={<Autenticacao tela="cadastro" />} />
          </Route>
          <Route element={<RotaProtegida />}>
            <Route element={<LayoutProtegido />}>
              <Route path={ROTAS.inicio} element={<Inicio />} />
              <Route path={ROTAS.perfil} element={<Perfil />} />
              <Route path={ROTAS.alunos} element={<AreaReservada titulo="Alunos" />} />
              <Route path={ROTAS.novoAluno} element={<AreaReservada titulo="Novo aluno" />} />
              <Route path={ROTAS.detalheAluno} element={<AreaReservada titulo="Perfil do aluno" />} />
              <Route path={ROTAS.editarAluno} element={<AreaReservada titulo="Editar aluno" />} />
              <Route path={ROTAS.atividades} element={<AreaReservada titulo="Atividades" />} />
              <Route path={ROTAS.novaAtividade} element={<AreaReservada titulo="Nova atividade" />} />
              <Route path={ROTAS.detalheAtividade} element={<AreaReservada titulo="Detalhe da atividade" />} />
              <Route path={ROTAS.anexos} element={<AreaReservada titulo="Anexos" />} />
              <Route path={ROTAS.calendario} element={<AreaReservada titulo="Calendário" />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to={ROTAS.inicio} replace />} />
        </Routes>
      </BrowserRouter>
    </AutenticacaoProvider>
  )
}

function TelaCarregando() {
  return <main className="splash" aria-label="Verificando sessão"><span><Fingerprint /></span></main>
}

function RotasPublicas() {
  const { usuario, carregando } = useAutenticacao()
  if (carregando) return <TelaCarregando />
  return usuario ? <Navigate to={ROTAS.inicio} replace /> : <Outlet />
}

function RotaProtegida() {
  const { usuario, carregando } = useAutenticacao()
  if (carregando) return <TelaCarregando />
  return usuario ? <Outlet /> : <Navigate to={ROTAS.login} replace />
}

function Autenticacao({ tela }: { tela: 'login' | 'cadastro' }) {
  const { entrar, cadastrar } = useAutenticacao()
  const navigate = useNavigate()
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
      if (cadastro) await cadastrar(nome.trim(), email.trim(), senha)
      else await entrar(email.trim(), senha)
      navigate(ROTAS.inicio, { replace: true })
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível concluir o acesso.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <main className="auth-layout">
      <section className="dojo-panel" aria-label="Zen'yo App, gestão de judô">
        <div className="panel-topline"><span className="brand-mark"><BeltMark /></span><span className="brand-name">ZEN'YO APP</span><span className="brand-caption">GERENCIADOR DE ATIVIDADES DE JUDÔ</span></div>
        <div className="panel-copy"><h1>SEIRYOKU ZEN'YO</h1><h1>JITA KYOEI</h1></div>
        <div className="mat-graphic" aria-hidden="true"><span className="mat-ring ring-one" /><span className="mat-ring ring-two" /><span className="mat-ring ring-three" /><span className="mat-center">柔道</span><span className="mat-label">JUDÔ · CAMINHO SUAVE</span></div>
      </section>
      <section className="auth-panel">
        <div className="mobile-brand"><span className="brand-mark"><BeltMark /></span><span className="brand-name">ZEN'YO APP</span></div>
        <div className="auth-content" key={tela}>
          <div className="auth-heading"><h2>{cadastro ? 'Cadastro' : 'Login'}</h2></div>
          {erro && <div className="form-error" role="alert"><AlertCircle size={17} /><span>{erro}</span></div>}
          <form className="auth-form" onSubmit={handleSubmit}>
            {cadastro && <label className="field"><span>Nome completo</span><span className="input-wrap"><UserRound size={17} /><input autoComplete="name" minLength={2} placeholder="Como podemos chamar você?" required value={nome} onChange={(event) => setNome(event.target.value)} /></span></label>}
            <label className="field"><span>E-mail</span><span className="input-wrap"><Mail size={17} /><input autoComplete="email" type="email" placeholder="voce@exemplo.com" required value={email} onChange={(event) => setEmail(event.target.value)} /></span></label>
            <label className="field"><span>Senha</span><span className="input-wrap"><LockKeyhole size={17} /><input autoComplete={cadastro ? 'new-password' : 'current-password'} minLength={cadastro ? 6 : undefined} placeholder={cadastro ? 'Pelo menos 6 caracteres' : 'Sua senha'} required type="password" value={senha} onChange={(event) => setSenha(event.target.value)} /></span></label>
            <button className="submit-button" type="submit" disabled={enviando}>{enviando ? 'Aguarde...' : cadastro ? 'Criar conta' : 'Entrar'}{!enviando && <ArrowRight size={17} />}</button>
          </form>
          <p className="auth-switch">{cadastro ? 'Já tem uma conta?' : 'Ainda não tem conta?'}{' '}<button type="button" onClick={() => { setErro(''); navigate(cadastro ? ROTAS.login : ROTAS.cadastro) }}>{cadastro ? 'Fazer login' : 'Cadastre-se'}</button></p>
          <div className="auth-assurance"><ShieldCheck size={16} /><span>Acesso protegido por autenticação segura</span></div>
        </div>
        <footer className="auth-footer"><span>ZEN'YO APP</span></footer>
      </section>
    </main>
  )
}

function LayoutProtegido() {
  const { usuario, sair } = useAutenticacao()
  const navigate = useNavigate()
  if (!usuario) return null
  function encerrarSessao() {
    sair()
    navigate(ROTAS.login, { replace: true })
  }

  return (
    <div className="home-layout">
      <header className="home-header">
        <Link className="home-brand" to={ROTAS.inicio} aria-label="Zen'yo início"><span className="brand-mark"><BeltMark /></span><span className="brand-name">zen'yo<span>.</span></span></Link>
        <div className="header-session"><i /> SESSÃO ATIVA</div>
        <button aria-label="Sair" className="logout-button" onClick={encerrarSessao} type="button"><LogOut size={16} /><span>Sair</span></button>
      </header>
      <aside className="dojo-sidebar">
        <div className="sidebar-account"><span className="sidebar-avatar"><UserRound size={19} /></span><span><strong>{usuario.nome}</strong><small>{usuario.email}</small></span></div>
        <span className="sidebar-label">SEU DOJÔ</span>
        <nav className="sidebar-nav" aria-label="Navegação principal">
          <NavLink end to={ROTAS.inicio} className={({ isActive }) => `sidebar-link${isActive ? ' is-active' : ''}`}><House size={17} />Início</NavLink>
          <NavLink to={ROTAS.perfil} className={({ isActive }) => `sidebar-link${isActive ? ' is-active' : ''}`}><UserRound size={17} />Perfil</NavLink>
          <NavLink to={ROTAS.alunos} className={({ isActive }) => `sidebar-link${isActive ? ' is-active' : ''}`}><UsersRound size={17} />Alunos</NavLink>
          <NavLink to={ROTAS.atividades} className={({ isActive }) => `sidebar-link${isActive ? ' is-active' : ''}`}><Activity size={17} />Atividades</NavLink>
          <NavLink to={ROTAS.anexos} className={({ isActive }) => `sidebar-link${isActive ? ' is-active' : ''}`}><Paperclip size={17} />Anexos</NavLink>
          <NavLink to={ROTAS.calendario} className={({ isActive }) => `sidebar-link${isActive ? ' is-active' : ''}`}><CalendarDays size={17} />Calendário</NavLink>
        </nav>
        <button className="sidebar-logout" onClick={encerrarSessao} type="button"><LogOut size={16} />Sair da conta</button>
      </aside>
      <div className="protected-content"><Outlet /></div>
    </div>
  )
}

function Inicio() {
  const { usuario } = useAutenticacao()
  if (!usuario) return null
  const primeiroNome = usuario.nome.trim().split(/\s+/)[0]
  return (
      <section className="home-main">
        <div className="home-kicker"></div><h1>Bem-vindo, <em>{primeiroNome}.</em></h1><p className="home-intro">Sua sessão está conectada. Aqui estão os dados da sua conta.</p>
        <div className="welcome-grid">
          <article className="welcome-card"><div className="card-top"><span className="card-icon"><UserRound size={19} /></span><span className="card-status"><Check size={14} /> AUTENTICADO</span></div><span className="card-label">PERFIL DO PROFESSOR</span><h2>{usuario.nome}</h2><div className="profile-line"><Mail size={16} /><span>{usuario.email}</span></div><div className="profile-line"><Fingerprint size={16} /><span>Conta #{usuario.id}</span></div></article>
          <article className="session-card"><div className="session-emblem"><ShieldCheck size={23} /></div><span className="card-label">ACESSO SEGURO</span><h2>Conexão verificada</h2><p>Seu token JWT foi validado pela API. As próximas chamadas autenticadas enviarão essa credencial automaticamente.</p><div className="session-foot"><i /> TOKEN ATIVO <span>JWT <Check size={13} /></span></div></article>
        </div>
        <div className="home-note"><span className="note-mark">柔道</span></div>
        <footer className="home-footer"><span>ZEN'YO · GESTÃO DE JUDÔ</span></footer>
      </section>
  )
}

function Perfil() {
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

function AreaReservada({ titulo }: { titulo: string }) {
  return (
    <section className="home-main profile-main">
      <div className="home-kicker"><i />ÁREA DO DOJÔ</div>
      <h1>{titulo}</h1>
      <p className="home-intro">Área reservada para o módulo de {titulo.toLowerCase()}.</p>
    </section>
  )
}

export default App
