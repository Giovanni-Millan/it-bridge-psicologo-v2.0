import React, { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFaceLaughWink, faArrowRightFromBracket, faBell, faSpinner, faChartLine } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import Swal from 'sweetalert2';
import Avatar from '../../components/Avatar.jsx';

export default function Dashboard() {
  const [avisos, setAvisos] = useState([]);
  const [psicologo, setPsicologo] = useState(null);
  const [nombrePsicologo, setNombrePsicologo] = useState('');
  const [correo, setCorreo] = useState('');
  const [cargando, setCargando] = useState(true);
  const [seguimientoHabilitado, setSeguimientoHabilitado] = useState(true);
  const [actualizandoToggle, setActualizandoToggle] = useState(false);

  useEffect(() => {
    const init = async () => {
      await fetchUserData();
      await fetchAvisos();
      await fetchConfiguracion();
      setCargando(false);
    };
    init();
  }, []);

  // Obtener usuario y datos de alumno
  const fetchUserData = async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) {
      window.location.href = '/';
      return;
    }
    const userId = data.user.id;
    setCorreo(data.user.email);

    const { data: psicologoData, error: psicologoError } = await supabase
      .from('psicologos')
      .select('nombre, apellido_paterno, apellido_materno, foto_url')
      .eq('id', userId)
      .single();

    if (!psicologoError && psicologoData) {
      setPsicologo(psicologoData);
      setNombrePsicologo(`${psicologoData.nombre} ${psicologoData.apellido_paterno} ${psicologoData.apellido_materno}`);
    }
  };

  // Obtener avisos
  const fetchAvisos = async () => {
    const { data, error } = await supabase.from('avisos').select('*');
    if (!error) setAvisos(data || []);
  };

  // Obtener el estado actual del interruptor de Seguimiento Emocional
  const fetchConfiguracion = async () => {
    const { data, error } = await supabase
      .from('configuracion_sistema')
      .select('seguimiento_emocional_habilitado')
      .eq('id', 1)
      .single();

    if (!error && data) {
      setSeguimientoHabilitado(data.seguimiento_emocional_habilitado);
    }
  };

  // Habilitar/deshabilitar el módulo de Seguimiento Emocional para los alumnos
  const handleToggleSeguimiento = async () => {
    const nuevoValor = !seguimientoHabilitado;
    setActualizandoToggle(true);

    const { data: userData } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('configuracion_sistema')
      .update({
        seguimiento_emocional_habilitado: nuevoValor,
        actualizado_por: userData?.user?.id ?? null,
        actualizado_en: new Date().toISOString(),
      })
      .eq('id', 1);

    setActualizandoToggle(false);

    if (error) {
      console.error('Error al actualizar configuración:', error);
      Swal.fire({
        icon: 'error',
        title: 'No se pudo actualizar',
        text: 'Ocurrió un error al guardar el cambio. Intenta de nuevo.',
        confirmButtonColor: '#7c3aed',
      });
      return;
    }

    setSeguimientoHabilitado(nuevoValor);
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: nuevoValor
        ? 'Seguimiento emocional habilitado para los alumnos'
        : 'Seguimiento emocional deshabilitado para los alumnos',
      showConfirmButton: false,
      timer: 2200,
      timerProgressBar: true,
    });
  };

  // Mostrar aviso en SweetAlert2 mejorado visualmente
  const mostrarAviso = (aviso) => {
    const fecha = aviso.fecha_publicacion || aviso.created_at;
    const fechaFormateada = fecha ? new Date(fecha).toLocaleString('es-MX') : 'Fecha no disponible';

    Swal.fire({
      title: aviso.titulo,
      html: `
        <div style="text-align:left; font-family:'Inter',system-ui;">
          <div style="background:#f3e8ff; padding:12px; border-radius:16px; margin-top:8px;">
            <p style="margin:0; color:#4c1d95;"><strong>📄 Descripción</strong></p>
            <p style="margin-top:8px; color:#374151;">${aviso.descripcion}</p>
          </div>
          <p style="margin-top:16px; font-size:0.85rem; color:#6b7280;">
            <strong>📅 Publicado:</strong> ${fechaFormateada}
          </p>
        </div>
      `,
      icon: 'info',
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#7c3aed',
      background: '#ffffff',
      borderRadius: '1rem',
      width: '540px',
    });
  };

  // Cerrar sesión
  const handleLogOut = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch (e) {
      console.error(e);
    }
  };

  if (cargando) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100 flex items-center justify-center">
        <div className="text-center">
          <FontAwesomeIcon icon={faSpinner} spin size="3x" className="text-purple-600 mb-4" />
          <p className="text-gray-600">Cargando tu espacio terapéutico...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50">
      <Navbar titulo="Instituto Tecnológico Bridge" />

      {/* Contenedor principal con padding */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Tarjeta de perfil / bienvenida */}
        <div className="bg-white rounded-2xl shadow-lg border border-purple-100 overflow-hidden mb-10">
          <div className="bg-gradient-to-r from-purple-800 to-purple-600 px-6 py-4">
            <h2 className="text-white text-xl font-semibold flex items-center gap-2">
              <span>👋</span> Panel de Bienvenida
            </h2>
          </div>
          <div className="p-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar
                fotoUrl={psicologo?.foto_url}
                nombre={psicologo?.nombre}
                apellidoPaterno={psicologo?.apellido_paterno}
                apellidoMaterno={psicologo?.apellido_materno}
                size={56}
              />
              <div>
                <p className="text-gray-800 text-2xl font-bold">{nombrePsicologo || 'Psicólogo(a)'}</p>
                <p className="text-gray-500 mt-1 flex items-center gap-1">
                  <span className="text-sm">📧</span> {correo}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogOut}
              className="flex items-center gap-2 bg-red-100 hover:bg-red-200 text-red-700 px-5 py-2.5 rounded-xl transition-all duration-200 font-medium shadow-sm hover:shadow"
            >
              <FontAwesomeIcon icon={faArrowRightFromBracket} />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </div>

        {/* Sección de acciones principales */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-purple-900 mb-6 flex items-center gap-2">
            <span className="w-1 h-8 bg-purple-600 rounded-full"></span>
            Acciones rápidas
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link
              to="/ConsultarReportesDeSeguimiento"
              className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-purple-100 hover:border-purple-300 transform hover:-translateY-1 flex flex-col items-center text-center"
            >
              <div className="bg-purple-100 rounded-full p-4 mb-4 group-hover:bg-purple-200 transition">
                <FontAwesomeIcon icon={faFaceLaughWink} className="text-5xl text-purple-700" />
              </div>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">Reportes de seguimiento</h4>
              <p className="text-gray-500 text-sm">Consulta la evolución emocional de tus pacientes</p>
            </Link>

            {/* Interruptor: habilitar/deshabilitar el Seguimiento Emocional del alumno */}
            <div className="bg-white rounded-2xl shadow-md p-6 border border-purple-100 flex flex-col items-center text-center">
              <div
                className={`rounded-full p-4 mb-4 transition-colors duration-300 ${
                  seguimientoHabilitado ? 'bg-green-100' : 'bg-gray-100'
                }`}
              >
                <FontAwesomeIcon
                  icon={faChartLine}
                  className={`text-5xl transition-colors duration-300 ${
                    seguimientoHabilitado ? 'text-green-600' : 'text-gray-400'
                  }`}
                />
              </div>
              <h4 className="text-lg font-semibold text-gray-800 mb-1">Seguimiento emocional</h4>
              <p className="text-gray-500 text-sm mb-4">
                {seguimientoHabilitado
                  ? 'Los alumnos pueden realizar el seguimiento emocional.'
                  : 'El botón está oculto para los alumnos.'}
              </p>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={seguimientoHabilitado}
                  disabled={actualizandoToggle}
                  onChange={handleToggleSeguimiento}
                />
                <div className="w-14 h-8 bg-gray-300 rounded-full peer peer-checked:bg-green-500 transition-colors duration-300 peer-disabled:opacity-60"></div>
                <div className="absolute left-1 top-1 w-6 h-6 bg-white rounded-full shadow transition-transform duration-300 peer-checked:translate-x-6"></div>
              </label>
              <span className="mt-2 text-xs font-medium text-gray-500">
                {actualizandoToggle ? 'Guardando...' : seguimientoHabilitado ? 'Habilitado' : 'Deshabilitado'}
              </span>
            </div>
          </div>
        </div>

        {/* Sección de avisos */}
        <div>
          <h3 className="text-2xl font-bold text-purple-900 mb-6 flex items-center gap-2">
            <FontAwesomeIcon icon={faBell} className="text-purple-600" />
            Avisos importantes
          </h3>
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-purple-50 px-6 py-3 border-b border-purple-100">
              <p className="text-purple-800 font-medium">Comunicados oficiales del departamento de psicología</p>
            </div>
            <div className="p-6">
              {avisos.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-3">📭</div>
                  <p className="text-gray-500">No hay avisos disponibles en este momento.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {avisos.map((aviso, idx) => (
                    <div
                      key={idx}
                      onClick={() => mostrarAviso(aviso)}
                      className="bg-white border border-purple-200 rounded-xl p-4 cursor-pointer transition-all duration-200 hover:shadow-md hover:border-purple-400 hover:bg-purple-50/30 transform hover:-translateY-1"
                    >
                      <div className="flex items-start justify-between">
                        <h4 className="font-bold text-purple-800 text-base line-clamp-1">{aviso.titulo}</h4>
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                          {aviso.fecha_publicacion ? new Date(aviso.fecha_publicacion).toLocaleDateString('es-MX') : 'Nuevo'}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mt-2 line-clamp-3">{aviso.descripcion}</p>
                      <div className="mt-3 text-purple-600 text-xs font-medium flex items-center gap-1">
                        <span>Leer más</span>
                        <span>→</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pie de página decorativo */}
        <footer className="mt-16 text-center text-gray-400 text-sm border-t border-purple-100 pt-6">
          <p>🌿 Espacio confidencial · Todos los derechos reservados · Bridge Psicología</p>
        </footer>
      </div>
    </main>
  );
}