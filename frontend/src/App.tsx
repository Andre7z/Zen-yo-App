import { Fingerprint } from 'lucide-react'
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AutenticacaoPage } from './pages/AutenticacaoPage'
import { InicioPage } from './pages/InicioPage'
import { PerfilPage } from './pages/PerfilPage'
import { AlunosPage } from './pages/AlunosPage'
import { AtividadesPage } from './pages/AtividadesPage'
import { AnexosPage } from './pages/AnexosPage'
import { FaixasPage } from './pages/FaixasPage'
import { TurmasPage } from './pages/TurmasPage'
import { TamanhosPage } from './pages/TamanhosPage'
import { LayoutProtegido } from './components/LayoutProtegido'
import { AutenticacaoProvider } from './autenticacao-contexto'
import { useAutenticacao } from './autenticacao-context'
import { ROTAS } from './routes'
import './App.css'

function App() {
  return (
    <AutenticacaoProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<RotasPublicas />}>
            <Route path={ROTAS.login} element={<AutenticacaoPage tela="login" />} />
            <Route path={ROTAS.cadastro} element={<AutenticacaoPage tela="cadastro" />} />
          </Route>
          <Route element={<RotaProtegida />}>
            <Route element={<LayoutProtegido />}>
              <Route path={ROTAS.inicio} element={<InicioPage />} />
              <Route path={ROTAS.perfil} element={<PerfilPage />} />
              <Route path={ROTAS.alunos} element={<AlunosPage />} />
              <Route path={`${ROTAS.atividades}/*`} element={<AtividadesPage />} />
              <Route path={ROTAS.anexos} element={<AnexosPage />} />
              <Route path={ROTAS.faixas} element={<FaixasPage />} />
              <Route path={ROTAS.turmas} element={<TurmasPage />} />
              <Route path={ROTAS.tamanhos} element={<TamanhosPage />} />
              <Route path={ROTAS.turmaAlunos} element={<AlunosPage />} />
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

export default App
