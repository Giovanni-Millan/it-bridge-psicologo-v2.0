import React, { useState } from 'react';
import logo from './../../assets/logo.png';
import Swal from 'sweetalert2';
import { supabase } from '../../supabaseClient';
import { EnvelopeIcon, LockClosedIcon, ArrowRightIcon } from '@heroicons/react/24/outline'; // opcional, puedes usar otros íconos

export default function Login() {
  const [correo, setCorreo] = useState('');
  const [contraseña, setContraseña] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setCargando(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: correo,
        password: contraseña,
      });

      if (error) {
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: 'Correo o contraseña incorrectos',
          confirmButtonColor: '#7c3aed',
        });
        setCargando(false);
        return;
      }

      if (data.user?.app_metadata?.rol !== 'psicologo') {
        await supabase.auth.signOut();
        Swal.fire({
          icon: 'error',
          title: 'Sin acceso',
          text: 'Esta cuenta no tiene permiso para acceder al Portal del Psicólogo.',
          confirmButtonColor: '#7c3aed',
        });
        setCargando(false);
        return;
      }

      Swal.fire({
        title: '¡Bienvenido al sistema!',
        text: 'Cargando tu espacio terapéutico...',
        icon: 'success',
        confirmButtonColor: '#7c3aed',
        timer: 1500,
        showConfirmButton: false,
      });

      window.location.href = '/Dashboard';
    } catch {
      Swal.fire({
        icon: 'error',
        title: 'Error inesperado',
        text: 'Por favor, intenta de nuevo más tarde.',
        confirmButtonColor: '#7c3aed',
      });
      setCargando(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-950 via-purple-800 to-purple-700 flex items-center justify-center px-4 relative overflow-hidden">
      
      {/* Fondo decorativo con formas orgánicas (sensación de calma) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-400/5 rounded-full blur-3xl"></div>
      </div>

      {/* Tarjeta principal con animación de entrada */}
      <section className="bg-white/90 backdrop-blur-sm w-full max-w-md rounded-3xl shadow-2xl p-8 border border-white/20 transform transition-all duration-500 animate-fade-in-up">
        
        {/* Logo y título */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <img src={logo} alt="Logo Psicólogo" className="h-24 drop-shadow-md transition-transform hover:scale-105 duration-300" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-900 to-purple-600 bg-clip-text text-transparent">
            Portal del Psicólogo
          </h1>
          <p className="text-gray-500 mt-2 text-sm">Espacio seguro para profesionales</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {/* Campo correo institucional */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Correo institucional
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <EnvelopeIcon className="h-5 w-5 text-purple-400" />
              </div>
              <input
                type="email"
                placeholder="tunombre@itbridge.edu.mx"
                className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-200 hover:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                disabled={cargando}
              />
            </div>
          </div>

          {/* Campo contraseña */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Contraseña
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LockClosedIcon className="h-5 w-5 text-purple-400" />
              </div>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-200 hover:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                value={contraseña}
                onChange={(e) => setContraseña(e.target.value)}
                disabled={cargando}
              />
            </div>
          </div>

          {/* Enlaces adicionales */}


          {/* Botón de ingreso con estado de carga */}
          <button
            type="submit"
            disabled={cargando}
            className={`
              w-full py-3 rounded-xl text-white font-semibold text-lg
              bg-gradient-to-r from-purple-800 to-purple-600
              hover:from-purple-700 hover:to-purple-500
              transition-all duration-300 transform hover:scale-[1.02] 
              shadow-lg hover:shadow-xl active:scale-95
              flex items-center justify-center gap-2
              ${cargando ? 'opacity-70 cursor-not-allowed' : ''}
            `}
          >
            {cargando ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Ingresando...
              </>
            ) : (
              <>
                Ingresar al sistema
                <ArrowRightIcon className="h-5 w-5" />
              </>
            )}
          </button>
        </form>

        {/* Pie con mensaje de apoyo */}
        <div className="mt-8 text-center text-xs text-gray-400 border-t border-gray-100 pt-6">
          <p>🌿 Espacio confidencial · Acceso exclusivo para profesionales</p>
        </div>
      </section>

      {/* Animaciones personalizadas - agregar en tu CSS global o aquí con style */}
      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
        }
      `}</style>
    </main>
  );
}