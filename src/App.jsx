import { useState } from 'react'

import './App.css'
import {BrowserRouter as Router , Routes,Route} from 'react-router-dom'
import Dashboard from './pages/Dashboard/Dashboard'
import Login from './pages/Login/Login'
import GruposConsultas from './pages/ConsultarReportes/ConsultarReportes'
import ListarReporteAlumno from './pages/ConsultarReportes/ListarReporteAlumno'
import ResultadosSeguimiento from './pages/ConsultarReportes/ResultadosSeguimiento'
import RutaProtegida from './components/RutaProtegida.jsx'

function App() {
  

  return (
    <Router>
	      <Routes>
	        <Route path='/' Component={Login}/>

          {/* Todo lo de abajo requiere sesión real con rol "psicologo" — si no,
              RutaProtegida regresa al Login en vez de dejar montar la pantalla. */}
          <Route element={<RutaProtegida rol="psicologo" />}>

          <Route path='/Dashboard' Component={Dashboard}/>
          <Route path='/ConsultarReportesDeSeguimiento' Component={GruposConsultas}/>
          <Route path='/ListarReporteAlumno/:id' Component={ListarReporteAlumno}/>
          <Route path="/ResultadosSeguimiento/:id" Component={ResultadosSeguimiento} />

          </Route>
          {/* fin de las rutas protegidas */}

	      </Routes>
	    </Router>
  )
}

export default App
