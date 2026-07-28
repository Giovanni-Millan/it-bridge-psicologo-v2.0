import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { useParams, useNavigate, Link } from "react-router-dom";
import Navbar from "../../components/Navbar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faBook } from "@fortawesome/free-solid-svg-icons";

export default function SeguimientosPorAlumno() {

  const { id } = useParams();
  const navigate = useNavigate();

  const [seguimientos, setSeguimientos] = useState([]);
  const [alumno, setAlumno] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const cargarSeguimientos = async () => {

      setLoading(true);

      const { data, error } = await supabase
        .from("vista_seguimientos_alumnos")
        .select("*")
        .eq("id_alumno", id)
        .order("fecha_hora", { ascending: false });

      if (!error && data.length > 0) {

        setSeguimientos(data);

        setAlumno({
          nombre: data[0].nombre,
          apellido_paterno: data[0].apellido_paterno,
          apellido_materno: data[0].apellido_materno,
          carrera: data[0].carrera,
          cuatrimestre: data[0].cuatrimestre
        });

      }

      setLoading(false);

    };

    cargarSeguimientos();

  }, [id]);

  return (

    <main>

      <Navbar titulo="Seguimientos emocionales" />

      <div className="max-w-6xl mx-auto px-6 py-10">

        {/* BOTON REGRESAR */}

        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg shadow mb-6"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
          Regresar
        </button>


        {/* INFORMACION DEL ALUMNO */}

        {alumno && (

          <div className="bg-white border border-purple-200 rounded-xl shadow-md p-6 mb-10">

            <h2 className="text-2xl font-bold text-purple-800 mb-2">

              {alumno.nombre} {alumno.apellido_paterno} {alumno.apellido_materno}

            </h2>

            <div className="flex flex-wrap gap-8 text-gray-700">

              <p>
                <span className="font-semibold text-purple-700">Carrera:</span>{" "}
                {alumno.carrera}
              </p>

              <p>
                <span className="font-semibold text-purple-700">Cuatrimestre:</span>{" "}
                {alumno.cuatrimestre}
              </p>

            </div>

          </div>

        )}


        {/* TABLA DE SEGUIMIENTOS */}

        <div className="bg-white border border-purple-200 rounded-xl shadow-md overflow-hidden">

          <table className="min-w-full">

            <thead className="bg-purple-700 text-white">

              <tr>

                <th className="px-6 py-3 text-left">#</th>

                <th className="px-6 py-3 text-left">
                  Fecha del seguimiento
                </th>

                <th className="px-6 py-3 text-center">
                  Ver resultados
                </th>

              </tr>

            </thead>

            <tbody>

              {loading ? (

                <tr>

                  <td
                    colSpan="3"
                    className="text-center py-6 text-gray-500"
                  >
                    Cargando seguimientos...
                  </td>

                </tr>

              ) : seguimientos.length === 0 ? (

                <tr>

                  <td
                    colSpan="3"
                    className="text-center py-6 text-gray-500"
                  >
                    Este alumno no tiene seguimientos registrados
                  </td>

                </tr>

              ) : (

                seguimientos.map((seg, index) => (

                  <tr
                    key={seg.id_seguimiento}
                    className="border-b hover:bg-purple-50"
                  >

                    <td className="px-6 py-3 font-medium">
                      {index + 1}
                    </td>

                    <td className="px-6 py-3">
                      {new Date(seg.fecha_hora).toLocaleString("es-MX")}
                    </td>

                    <td className="px-6 py-3 text-center">

                      <Link
                        to={`/ResultadosSeguimiento/${seg.id_seguimiento}`}
                        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg"
                      >

                        <FontAwesomeIcon icon={faBook} />

                        Ver reporte

                      </Link>

                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>

      </div>

    </main>

  );

}