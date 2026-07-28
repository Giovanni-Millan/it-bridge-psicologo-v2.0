import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faFilePdf,
  faFileExcel,
  faUserGraduate,
  faCalendarAlt,
  faChartLine,
  faRobot,
} from "@fortawesome/free-solid-svg-icons";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFDownloadLink
} from "@react-pdf/renderer";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import Swal from "sweetalert2";
import ReactMarkdown from "react-markdown";

export default function ResultadosSeguimiento() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [datos, setDatos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [interpretacion, setInterpretacion] = useState("");
  const [analizando, setAnalizando] = useState(false);

  const stylesPDF = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    lineHeight: 1.6
  },

  titulo: {
    fontSize: 18,
    marginBottom: 10,
    fontWeight: "bold"
  },

  subtitulo: {
    fontSize: 14,
    marginTop: 10,
    marginBottom: 6,
    fontWeight: "bold"
  },

  texto: {
    marginBottom: 4
  },

  tablaHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    paddingBottom: 4,
    marginBottom: 4,
    fontWeight: "bold"
  },

  fila: {
    flexDirection: "row",
    marginBottom: 2
  },

  colNumero: {
    width: "8%"
  },

  colPregunta: {
    width: "72%"
  },

  colRespuesta: {
    width: "20%"
  }
});


  const preguntas = [
    "Me siento triste o deprimido con frecuencia",
    "Tengo dificultades para concentrarme en mis estudios",
    "Me siento cansado o sin energía la mayor parte del tiempo",
    "Me cuesta dormir o descansar adecuadamente",
    "Me siento estresado por mis responsabilidades académicas",
    "Siento ansiedad antes de exámenes o entregas",
    "Me siento desmotivado respecto a mis estudios",
    "Tengo problemas para organizar mi tiempo",
    "Me siento abrumado por la carga de trabajo",
    "Tengo dificultades para relacionarme con compañeros",
    "Me siento apoyado por mis profesores",
    "Me siento apoyado por mi familia",
    "Tengo problemas personales que afectan mi rendimiento",
    "Me siento satisfecho con mi progreso académico",
    "Me cuesta participar en clase",
    "Siento que mis estudios afectan mi bienestar emocional",
    "Me siento confiado en mis habilidades académicas",
    "Me preocupa mi futuro académico",
    "Me siento motivado para continuar mis estudios",
    "Tengo dificultades económicas que afectan mis estudios",
    "Me siento cómodo pidiendo ayuda cuando la necesito",
    "Siento presión por obtener buenas calificaciones",
    "Me siento optimista respecto a mi formación profesional",
    "Considero que mi salud emocional es buena"
  ];

  useEffect(() => {
    cargarResultados();
  }, []);

  async function cargarResultados() {
    const { data, error } = await supabase
      .from("vista_resultados_seguimiento")
      .select("*")
      .eq("id_seguimiento", Number(id))
      .maybeSingle();

    if (error) {
      console.error(error);
    } else {
      setDatos(data);
      if (data) {
        await enviarAN8n(data);
      }
    }
    setLoading(false);
  }

  async function enviarAN8n(datosTest) {
    if (!datosTest) return;
    try {
      setAnalizando(true);
      const respuestas = {};
      for (let i = 1; i <= 24; i++) {
        respuestas[`reactivo_${i}`] = datosTest[`reactivo_${i}`];
      }
      const response = await fetch(
        "https://n8n.gio-webdev.com/webhook/1934d205-d5f1-4d53-8ed6-7e9b3386acd0",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ respuestas })
        }
      );
      const text = await response.text();
      if (!text) {
        setInterpretacion("No se recibió respuesta del servidor.");
        return;
      }
      const resultado = JSON.parse(text);
      let mensajeIA = "";
      if (resultado.resultado) {
        mensajeIA = resultado.resultado;
      }
      else if (resultado.output) {
        mensajeIA = resultado.output;
      }
      else if (resultado.interpretacion) {
        mensajeIA = resultado.interpretacion;
      }
      else if (resultado.generations) {
        mensajeIA = resultado.generations?.[0]?.[0]?.text || "";
      }
      else {
        mensajeIA = JSON.stringify(resultado);
      }
      setInterpretacion(mensajeIA);
    } catch (error) {
      console.error("Error enviando a n8n:", error);
      setInterpretacion("No se pudo obtener la interpretación.");
    } finally {
      setAnalizando(false);
    }
  }

  // Función para obtener color de badge según valor Likert
  const getBadgeColor = (respuesta) => {
    const val = parseInt(respuesta);
    if (isNaN(val)) return "bg-gray-100 text-gray-800";
    if (val <= 2) return "bg-red-100 text-red-800";
    if (val === 3) return "bg-yellow-100 text-yellow-800";
    if (val >= 4) return "bg-green-100 text-green-800";
    return "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <main>
        <Navbar titulo="Procesando resultados" />
        <div className="min-h-[70vh] flex items-center justify-center px-6">
          <div className="bg-white/80 backdrop-blur-sm border border-purple-100 rounded-3xl shadow-xl p-12 max-w-xl w-full text-center">
            {/* Spinner con efecto de pulso */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-purple-200 border-t-purple-700 rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 bg-purple-100 rounded-full animate-ping opacity-75" />
                </div>
              </div>
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-700 to-purple-500 bg-clip-text text-transparent mb-4">
              Generando resultados
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed">
              Estamos procesando el seguimiento emocional y la interpretación con inteligencia artificial.
            </p>
            <p className="text-gray-400 text-sm mt-3">
              Esto puede tomar unos segundos...
            </p>
            <div className="mt-10 w-full bg-purple-100 rounded-full h-2 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-purple-400 h-2 rounded-full animate-pulse w-3/4" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!datos) {
    return (
      <main>
        <Navbar titulo="Resultados no encontrados" />
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
            <p className="text-red-600 text-lg">No se encontraron resultados para este seguimiento.</p>
            <button
              onClick={() => navigate(-1)}
              className="mt-4 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-lg transition"
            >
              Volver
            </button>
          </div>
        </div>
      </main>
    );
  }

  const respuestas = [];
  for (let i = 1; i <= 24; i++) {
    respuestas.push({
      pregunta: preguntas[i - 1],
      respuesta: datos[`reactivo_${i}`]
    });
  }

  const ReportePDF = ({ datos, respuestas, interpretacion }) => {
  const limpiarMarkdown = (texto) => {
    if (!texto) return "";

    return texto
      .replace(/^#+\s?/gm, "")
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/_(.*?)_/g, "$1")
      .replace(/^[>\-\*]\s?/gm, "")
      .replace(/\r\n/g, "\n")
      .trim();
  };

  const textoPlano = limpiarMarkdown(interpretacion);

  return (
    <Document>

      {/* PAGINA 1 */}
      <Page size="A4" style={stylesPDF.page}>

        <Text style={stylesPDF.titulo}>
          Resultados del Seguimiento Emocional
        </Text>

        <Text style={stylesPDF.texto}>
          Alumno: {datos.nombre} {datos.apellido_paterno} {datos.apellido_materno}
        </Text>

        <Text style={stylesPDF.texto}>
          Carrera: {datos.carrera}
        </Text>

        <Text style={stylesPDF.texto}>
          Cuatrimestre: {datos.cuatrimestre}
        </Text>

        <Text style={stylesPDF.texto}>
          Fecha: {new Date(datos.fecha_hora).toLocaleString()}
        </Text>

        <Text style={stylesPDF.subtitulo}>
          Resultados del Test
        </Text>

        <View style={stylesPDF.tablaHeader}>
          <Text style={stylesPDF.colNumero}>#</Text>
          <Text style={stylesPDF.colPregunta}>Pregunta</Text>
          <Text style={stylesPDF.colRespuesta}>Respuesta</Text>
        </View>

        {respuestas.map((r, i) => (
          <View key={i} style={stylesPDF.fila}>
            <Text style={stylesPDF.colNumero}>
              {i + 1}
            </Text>

            <Text style={stylesPDF.colPregunta}>
              {r.pregunta}
            </Text>

            <Text style={stylesPDF.colRespuesta}>
              {r.respuesta ?? "Sin respuesta"}
            </Text>
          </View>
        ))}

      </Page>

      {/* PAGINA 2 */}
      <Page size="A4" style={stylesPDF.page}>

        <Text style={stylesPDF.titulo}>
          Interpretación de la evaluación
        </Text>

        {textoPlano.split("\n").map((linea, index) => (
          <Text key={index} style={stylesPDF.texto}>
            {linea}
          </Text>
        ))}

      </Page>

    </Document>
  );
};

const exportarPDF = () => {
  Swal.fire({
    icon: "success",
    title: "Generando PDF...",
    confirmButtonColor: "#7e22ce"
  });
};

  const exportarExcel = () => {
  if (!datos) return;

  // Limpiar markdown de la interpretación
  const limpiarMarkdown = (texto) => {
    if (!texto) return "";

    return texto
      .replace(/^#+\s?/gm, "")
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/_(.*?)_/g, "$1")
      .replace(/^[>\-\*]\s?/gm, "")
      .replace(/\r\n/g, "\n")
      .trim();
  };

  const interpretacionLimpia = limpiarMarkdown(interpretacion);

  /*
  ============================
  HOJA 1: RESULTADOS
  ============================
  */

  const infoAlumno = [
    ["INFORMACIÓN DEL ALUMNO"],
    [],
    ["Nombre", `${datos.nombre} ${datos.apellido_paterno} ${datos.apellido_materno}`],
    ["Carrera", datos.carrera],
    ["Cuatrimestre", datos.cuatrimestre],
    ["Fecha", new Date(datos.fecha_hora).toLocaleString()],
    [],
    ["RESULTADOS DEL TEST"],
    []
  ];

  const encabezados = [["#", "Pregunta", "Respuesta"]];

  const tablaResultados = respuestas.map((r, i) => [
    i + 1,
    r.pregunta,
    r.respuesta ?? "Sin respuesta"
  ]);

  const datosFinales = [
    ...infoAlumno,
    ...encabezados,
    ...tablaResultados
  ];

  const hojaResultados = XLSX.utils.aoa_to_sheet(datosFinales);

  // Ajustar ancho de columnas
  hojaResultados["!cols"] = [
    { wch: 5 },
    { wch: 80 },
    { wch: 15 }
  ];

  /*
  ============================
  HOJA 2: INTERPRETACIÓN
  ============================
  */

  const lineasInterpretacion = interpretacionLimpia
    .split("\n")
    .map((linea) => [linea]);

  const datosInterpretacion = [
    ["INTERPRETACIÓN DE LA EVALUACIÓN"],
    [],
    ...lineasInterpretacion
  ];

  const hojaInterpretacion = XLSX.utils.aoa_to_sheet(
    datosInterpretacion
  );

  hojaInterpretacion["!cols"] = [
    { wch: 110 }
  ];

  /*
  ============================
  CREAR WORKBOOK
  ============================
  */

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    hojaResultados,
    "Resultados"
  );

  XLSX.utils.book_append_sheet(
    workbook,
    hojaInterpretacion,
    "Interpretación"
  );

  XLSX.writeFile(
    workbook,
    `seguimiento_${datos.nombre}.xlsx`
  );

  Swal.fire({
    icon: "success",
    title: "Excel descargado",
    text: "La interpretación se agregó en una segunda hoja",
    confirmButtonColor: "#7e22ce"
  });
};  

  return (
    <main className="bg-gradient-to-br from-gray-50 via-white to-purple-50/30">
      <Navbar titulo="Resultados del Seguimiento" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 lg:py-12">
        {/* Tarjeta de información del alumno */}
        <div className="bg-white rounded-2xl shadow-lg border border-purple-100 overflow-hidden mb-10 transition-all hover:shadow-xl">
          <div className="bg-gradient-to-r from-purple-700 to-purple-600 px-6 py-4">
            <div className="flex items-center gap-3">
              <FontAwesomeIcon icon={faUserGraduate} className="text-white text-xl" />
              <h2 className="text-xl font-bold text-white">Información del Alumno</h2>
            </div>
          </div>
          <div className="p-6">
            <div className="flex flex-col md:flex-row justify-between gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-gray-700">
                  <span className="font-semibold w-32">Nombre completo:</span>
                  <span>{datos.nombre} {datos.apellido_paterno} {datos.apellido_materno}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <span className="font-semibold w-32">Carrera:</span>
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">{datos.carrera}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <span className="font-semibold w-32">Cuatrimestre:</span>
                  <span>{datos.cuatrimestre}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <FontAwesomeIcon icon={faCalendarAlt} className="text-purple-500" />
                  <span className="font-semibold">Fecha:</span>
                  <span>{new Date(datos.fecha_hora).toLocaleString()}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 items-start">
                <button
                  onClick={() => navigate(-1)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all duration-200 hover:shadow-md"
                >
                  <FontAwesomeIcon icon={faArrowLeft} />
                  Regresar
                </button>
               <PDFDownloadLink
  document={
    <ReportePDF
      datos={datos}
      respuestas={respuestas}
      interpretacion={interpretacion}
    />
  }
  fileName={`seguimiento_${datos.nombre}.pdf`}
  className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all duration-200 hover:shadow-md"
>
  {({ loading }) =>
    loading
      ? "Generando PDF..."
      : (
        <>
          <FontAwesomeIcon icon={faFilePdf} />
          Exportar PDF
        </>
      )
  }
</PDFDownloadLink>
                <button
                  onClick={exportarExcel}
                  className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all duration-200 hover:shadow-md"
                >
                  <FontAwesomeIcon icon={faFileExcel} />
                  Exportar Excel
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabla de respuestas */}
        <div className="bg-white rounded-2xl shadow-lg border border-purple-100 overflow-hidden mb-10">
          <div className="bg-gradient-to-r from-purple-700 to-purple-600 px-6 py-4">
            <div className="flex items-center gap-3">
              <FontAwesomeIcon icon={faChartLine} className="text-white" />
              <h2 className="text-xl font-bold text-white">Detalle de respuestas</h2>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Pregunta</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Respuesta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {respuestas.map((r, i) => (
                  <tr key={i} className="hover:bg-purple-50/50 transition-colors duration-150">
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-600 font-medium">{i + 1}</td>
                    <td className="px-6 py-3 text-sm text-gray-700 leading-relaxed">{r.pregunta}</td>
                    <td className="px-6 py-3 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-semibold ${getBadgeColor(r.respuesta)}`}>
                        {r.respuesta ?? "Sin respuesta"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Interpretación con IA */}
        <div className="bg-white rounded-2xl shadow-lg border border-purple-100 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-700 to-purple-600 px-6 py-4">
            <div className="flex items-center gap-3">
              <FontAwesomeIcon icon={faRobot} className="text-white" />
              <h2 className="text-xl font-bold text-white">Interpretación con IA</h2>
            </div>
          </div>
          <div className="p-6">
            {analizando && (
              <div className="flex items-center gap-3 text-purple-600 bg-purple-50 rounded-xl p-4">
                <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                <p className="font-medium">Analizando resultados con inteligencia artificial...</p>
              </div>
            )}
            {!analizando && interpretacion && (
              <div className="prose prose-purple max-w-none">
                <ReactMarkdown
                  components={{
                    h1: ({ node, ...props }) => <h1 className="text-2xl font-bold text-purple-800 mt-6 mb-3" {...props} />,
                    h2: ({ node, ...props }) => <h2 className="text-xl font-semibold text-purple-700 mt-5 mb-2" {...props} />,
                    p: ({ node, ...props }) => <p className="text-gray-700 leading-relaxed mb-4" {...props} />,
                    ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-4 space-y-1" {...props} />,
                    li: ({ node, ...props }) => <li className="text-gray-700" {...props} />,
                    strong: ({ node, ...props }) => <strong className="font-bold text-purple-800" {...props} />,
                  }}
                >
                  {interpretacion}
                </ReactMarkdown>
              </div>
            )}
          </div>
        </div>

        {/* Footer decorativo */}
        <div className="mt-10 text-center text-xs text-gray-400 border-t border-purple-100 pt-6">
          <p>Reporte generado automáticamente · Sistema de Seguimiento Estudiantil</p>
        </div>
      </div>
    </main>
  );
}