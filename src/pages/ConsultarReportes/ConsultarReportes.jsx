import React, { useEffect, useState, useMemo } from "react";
import Navbar from "../../components/Navbar";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faEye, faSearch, faTimes, faFilter } from "@fortawesome/free-solid-svg-icons";
import { supabase } from "../../supabaseClient";

export default function ConsultarReportes() {
  const [alumnos, setAlumnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCareer, setSelectedCareer] = useState("");

  useEffect(() => {
    obtenerAlumnos();
  }, []);

  const obtenerAlumnos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("vista_alumnos_con_seguimiento")
      .select("*")
      .gt("total_seguimientos", 0);

    if (error) {
      console.error("Error cargando alumnos:", error.message);
      setLoading(false);
      return;
    }

    setAlumnos(data || []);
    setLoading(false);
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return "Sin registro";
    try {
      return new Date(fecha).toLocaleDateString("es-MX", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Fecha inválida";
    }
  };

  // Obtener lista única de carreras para el filtro
  const carrerasUnicas = useMemo(() => {
    const carreras = alumnos.map((alumno) => alumno.carrera).filter(Boolean);
    return [...new Set(carreras)].sort();
  }, [alumnos]);

  // Filtrar alumnos por búsqueda (nombre completo) y carrera
  const alumnosFiltrados = useMemo(() => {
    let filtrados = [...alumnos];

    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase().trim();
      filtrados = filtrados.filter((alumno) => {
        const nombreCompleto = `${alumno.nombre || ""} ${alumno.apellido_paterno || ""} ${alumno.apellido_materno || ""}`.toLowerCase();
        return nombreCompleto.includes(term);
      });
    }

    if (selectedCareer !== "") {
      filtrados = filtrados.filter((alumno) => alumno.carrera === selectedCareer);
    }

    return filtrados;
  }, [alumnos, searchTerm, selectedCareer]);

  const limpiarFiltros = () => {
    setSearchTerm("");
    setSelectedCareer("");
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar titulo="Consultar Seguimiento Académico" />

      <section className="px-4 py-8 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Botón Regresar */}
        <Link to="/dashboard">
          <button className="group flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-5 py-2.5 rounded-xl shadow-sm hover:bg-gray-50 hover:shadow transition-all duration-200 mb-6">
            <FontAwesomeIcon icon={faArrowLeft} className="text-sm group-hover:-translate-x-0.5 transition-transform" />
            <span>Regresar al Dashboard</span>
          </button>
        </Link>

        {/* Encabezado */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Alumnos con Seguimiento</h1>
          <p className="text-gray-500 mt-1">Visualiza y gestiona los reportes de seguimiento académico</p>
        </div>

        {/* Filtros y búsqueda */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Búsqueda */}
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FontAwesomeIcon icon={faSearch} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar por nombre completo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition outline-none"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              )}
            </div>

            {/* Filtro por carrera */}
            <div className="w-full md:w-64 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FontAwesomeIcon icon={faFilter} className="text-gray-400" />
              </div>
              <select
                value={selectedCareer}
                onChange={(e) => setSelectedCareer(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition outline-none appearance-none bg-white"
              >
                <option value="">Todas las carreras</option>
                {carrerasUnicas.map((carrera) => (
                  <option key={carrera} value={carrera}>
                    {carrera}
                  </option>
                ))}
              </select>
            </div>

            {/* Botón limpiar */}
            {(searchTerm || selectedCareer) && (
              <button
                onClick={limpiarFiltros}
                className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faTimes} /> Limpiar filtros
              </button>
            )}
          </div>

          {/* Resultados count */}
          {!loading && (
            <div className="mt-4 text-sm text-gray-500 border-t pt-3">
              Mostrando {alumnosFiltrados.length} de {alumnos.length} alumnos
            </div>
          )}
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-purple-800 to-purple-900">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Nombre completo
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Carrera
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Cuatrimestre
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Último seguimiento
                  </th>
                  <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-white uppercase tracking-wider">
                    Total reportes
                  </th>
                  <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-white uppercase tracking-wider">
                    Acción
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-700 mb-3"></div>
                        <p className="text-gray-500">Cargando alumnos...</p>
                      </div>
                    </td>
                  </tr>
                ) : alumnosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        <svg className="w-16 h-16 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-lg font-medium">No se encontraron alumnos</p>
                        <p className="text-sm">Intenta con otros filtros o verifica los registros</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  alumnosFiltrados.map((alumno, idx) => (
                    <tr key={alumno.id} className="hover:bg-purple-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-9 w-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-800 font-semibold">
                            {(alumno.nombre?.charAt(0) || '?')}
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {`${alumno.nombre || ''} ${alumno.apellido_paterno || ''} ${alumno.apellido_materno || ''}`.trim() || 'Sin nombre'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {alumno.carrera || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                          {alumno.cuatrimestre || '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatearFecha(alumno.ultimo_seguimiento)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-800 font-bold text-sm">
                          {alumno.total_seguimientos || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <Link to={`/ListarReporteAlumno/${alumno.id}`}>
                          <button className="group inline-flex items-center gap-2 px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white text-sm font-medium rounded-xl shadow-sm transition-all duration-200 hover:shadow-md">
                            <FontAwesomeIcon icon={faEye} className="text-sm" />
                            <span>Ver reportes</span>
                          </button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}