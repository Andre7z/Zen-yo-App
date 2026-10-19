import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, ArrowRight, LockKeyhole, Mail, ShieldCheck, UserRound } from 'lucide-react'
import { useAutenticacao } from '../autenticacao-context'
import { ROTAS } from '../routes'
import { Marca } from '../components/Marca'

export function AutenticacaoPage({ tela }: { tela: 'login' | 'cadastro' }) {
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
        <div className="panel-topline"><span className="brand-mark"><Marca /></span><span className="brand-name">ZEN'YO APP</span><span className="brand-caption">GERENCIADOR DE ATIVIDADES DE JUDÔ</span></div>
        <div className="panel-copy"><h1>SEIRYOKU ZEN'YO</h1><h1>JITA KYOEI</h1></div>
        <div className="mat-graphic" aria-hidden="true"><span className="mat-ring ring-one" /><span className="mat-ring ring-two" /><span className="mat-ring ring-three" /><span className="mat-center">柔道</span><span className="mat-label">JUDÔ · CAMINHO SUAVE</span></div>
      </section>
      <section className="auth-panel">
        <div className="mobile-brand"><span className="brand-mark"><Marca /></span><span className="brand-name">ZEN'YO APP</span></div>
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
