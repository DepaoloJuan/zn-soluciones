import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import CielorrasoPage from './pages/CielorrasoPage'
import TabiquePage from './pages/TabiquePage'
import PresupuestoPage from './pages/PresupuestoPage'
import PresupuestoLibrePage from './pages/PresupuestoLibrePage'
import LoginPage from './pages/LoginPage'
import ProtectedRoute from './components/ProtectedRoute'
import MaterialesAdminPage from './pages/MaterialesAdminPage'
import TrabajosPage from './pages/TrabajosPage'
import TrabajoDetallePage from './pages/TrabajoDetallePage'
import PresupuestoDetallePage from './pages/PresupuestoDetallePage'
import ClientesPage from './pages/ClientesPage'
import ClienteDetallePage from './pages/ClienteDetallePage'
import AgendaPage from './pages/AgendaPage'
import DashboardPage from './pages/DashboardPage'
import AsistenteWidget from './components/AsistenteWidget'


function AppContent() {
  const location = useLocation()
  const hideNavbar = location.pathname === '/login'

  return (
    <>
      {!hideNavbar && <Navbar />}
      {!hideNavbar && <AsistenteWidget />}
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/cielorraso" element={<ProtectedRoute><CielorrasoPage /></ProtectedRoute>} />
        {/* No linkeada desde el navbar hasta que la calculadora de Tabique esté implementada de verdad */}
        <Route path="/tabique" element={<ProtectedRoute><TabiquePage /></ProtectedRoute>} />
        <Route path="/presupuesto" element={<ProtectedRoute><PresupuestoPage /></ProtectedRoute>} />
        <Route path="/presupuesto-libre" element={<ProtectedRoute><PresupuestoLibrePage /></ProtectedRoute>} />
        <Route path="/admin/materiales" element={<ProtectedRoute><MaterialesAdminPage /></ProtectedRoute>} />
        <Route path="/trabajos" element={<ProtectedRoute><TrabajosPage /></ProtectedRoute>} />
        <Route path="/trabajos/:id" element={<ProtectedRoute><TrabajoDetallePage /></ProtectedRoute>} />
        <Route path="/presupuestos/:id" element={<ProtectedRoute><PresupuestoDetallePage /></ProtectedRoute>} />
        <Route path="/clientes" element={<ProtectedRoute><ClientesPage /></ProtectedRoute>} />
        <Route path="/clientes/:id" element={<ProtectedRoute><ClienteDetallePage /></ProtectedRoute>} />
        <Route path="/agenda" element={<ProtectedRoute><AgendaPage /></ProtectedRoute>} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}
