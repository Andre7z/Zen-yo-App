import { Activity, Award, CalendarDays, House, Layers, LogOut, Menu, Paperclip, UserRound, X } from 'lucide-react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAutenticacao } from '../autenticacao-context'
import { ROTAS } from '../routes'
import { Marca } from './Marca'

export function LayoutProtegido() {
  const { usuario, sair } = useAutenticacao()
  const navigate = useNavigate()
  const [menuAberto, setMenuAberto] = useState(false)
  if (!usuario) return null

  function encerrarSessao() {
    sair()
    navigate(ROTAS.login, { replace: true })
  }

  return (
    <div className="home-layout">
      <header className="home-header">
        <button className="mobile-menu-trigger" type="button" aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'} aria-expanded={menuAberto} aria-controls="menu-lateral" onClick={() => setMenuAberto((aberto) => !aberto)}>
          {menuAberto ? <X size={20} /> : <Menu size={20} />}
        </button>
        <Link className="home-brand" to={ROTAS.inicio} aria-label="Zen'yo início"><span className="brand-mark"><Marca /></span><span className="brand-name">zen'yo<span>.</span></span></Link>
        <div className="header-session"><i /> SESSÃO ATIVA</div>
        <button aria-label="Sair" className="logout-button" onClick={encerrarSessao} type="button"><LogOut size={16} /><span>Sair</span></button>
      </header>
      {menuAberto && <button className="mobile-nav-backdrop" type="button" aria-label="Fechar menu lateral" onClick={() => setMenuAberto(false)} />}
      <aside id="menu-lateral" className={`dojo-sidebar${menuAberto ? ' is-open' : ''}`}>
        <div className="sidebar-account"><span className="sidebar-avatar"><UserRound size={19} /></span><span><strong>{usuario.nome}</strong><small>{usuario.email}</small></span></div>
        <span className="sidebar-label">JUDÔ</span>
        <nav className="sidebar-nav" aria-label="Navegação principal" onClick={() => setMenuAberto(false)}>
          <NavLink end to={ROTAS.inicio} className={({ isActive }) => `sidebar-link${isActive ? ' is-active' : ''}`}><House size={17} />Início</NavLink>
          <NavLink to={ROTAS.perfil} className={({ isActive }) => `sidebar-link${isActive ? ' is-active' : ''}`}><UserRound size={17} />Perfil</NavLink>
          <NavLink to={ROTAS.turmas} className={({ isActive }) => `sidebar-link${isActive ? ' is-active' : ''}`}><Layers size={17} />Turmas</NavLink>
          <NavLink to={ROTAS.atividades} className={({ isActive }) => `sidebar-link${isActive ? ' is-active' : ''}`}><Activity size={17} />Atividades</NavLink>
          <NavLink to={ROTAS.anexos} className={({ isActive }) => `sidebar-link${isActive ? ' is-active' : ''}`}><Paperclip size={17} />Anexos</NavLink>
          <NavLink to={ROTAS.calendario} className={({ isActive }) => `sidebar-link${isActive ? ' is-active' : ''}`}><CalendarDays size={17} />Calendário</NavLink>
        </nav>
        <span className="sidebar-label sidebar-label-spaced">CADASTROS</span>
        <nav className="sidebar-nav" aria-label="Cadastros" onClick={() => setMenuAberto(false)}>
          <NavLink to={ROTAS.faixas} className={({ isActive }) => `sidebar-link${isActive ? ' is-active' : ''}`}><Award size={17} />Faixas</NavLink>
        </nav>
        <button className="sidebar-logout" onClick={encerrarSessao} type="button"><LogOut size={16} />Sair da conta</button>
      </aside>
      <div className="protected-content"><Outlet /></div>
      <nav className="mobile-primary-nav" aria-label="Acesso rápido">
        <NavLink end to={ROTAS.inicio} className={({ isActive }) => `mobile-primary-link${isActive ? ' is-active' : ''}`}><House size={18} /><span>Início</span></NavLink>
        <NavLink to={ROTAS.atividades} className={({ isActive }) => `mobile-primary-link${isActive ? ' is-active' : ''}`}><Activity size={18} /><span>Atividades</span></NavLink>
        <NavLink to={ROTAS.turmas} className={({ isActive }) => `mobile-primary-link${isActive ? ' is-active' : ''}`}><Layers size={18} /><span>Turmas</span></NavLink>
        <NavLink to={ROTAS.anexos} className={({ isActive }) => `mobile-primary-link${isActive ? ' is-active' : ''}`}><Paperclip size={18} /><span>Anexos</span></NavLink>
        <NavLink to={ROTAS.calendario} className={({ isActive }) => `mobile-primary-link${isActive ? ' is-active' : ''}`}><CalendarDays size={18} /><span>Calendário</span></NavLink>
      </nav>
    </div>
  )
}
