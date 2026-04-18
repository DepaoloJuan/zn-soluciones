import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import CielorrasoPage from './pages/CielorrasoPage'
import TabiquePage from './pages/TabiquePage'
import PresupuestoPage from './pages/PresupuestoPage'
import PresupuestoLibrePage from './pages/PresupuestoLibrePage'

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/cielorraso" element={<CielorrasoPage />} />
        <Route path="/tabique" element={<TabiquePage />} />
        <Route path="/presupuesto" element={<PresupuestoPage />} />
        <Route path="/presupuesto-libre" element={<PresupuestoLibrePage />} />
      </Routes>
    </BrowserRouter>
  )
}
