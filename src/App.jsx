import { useState } from 'react'

import './App.css'
import {BrowserRouter as Router , Routes,Route} from 'react-router-dom'
import Dashboard from './pages/Dashboard/Dashboard'
import Login from './pages/Login/Login'
import GruposConsultas from './pages/ConsultarReportes/ConsultarReportes'
import ListarReporteAlumno from './pages/ConsultarReportes/ListarReporteAlumno'
import ResultadosSeguimiento from './pages/ConsultarReportes/ResultadosSeguimiento'

function App() {
  

  return (
    <Router>
	      <Routes>
	        <Route path='/' Component={Login}/>
          <Route path='/Dashboard' Component={Dashboard}/>
          <Route path='/ConsultarReportesDeSeguimiento' Component={GruposConsultas}/>
          <Route path='/ListarReporteAlumno/:id' Component={ListarReporteAlumno}/>
          <Route path="/ResultadosSeguimiento/:id" Component={ResultadosSeguimiento} />
	        
	      </Routes>
	    </Router>
  )
}

export default App
