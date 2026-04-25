import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import GeneratorPage from './pages/GeneratorPage'
import AnalyserPage from './pages/AnalyserPage'
import ValidatorPage from './pages/ValidatorPage'
import EliminatorPage from './pages/EliminatorPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="generator" element={<GeneratorPage />} />
          <Route path="analyser" element={<AnalyserPage />} />
          <Route path="validator" element={<ValidatorPage />} />
          <Route path="eliminator" element={<EliminatorPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
