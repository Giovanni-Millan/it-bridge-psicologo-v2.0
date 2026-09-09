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
import { calcularTMMS24 } from "../../utils/tmms24";
import SeguimientoAlternativoTMMS24 from "../../components/SeguimientoAlternativoTMMS24";

export default function ResultadosSeguimiento() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [datos, setDatos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [interpretacion, setInterpretacion] = useState("");
  const [analizando, setAnalizando] = useState(false);
  const [fallbackTMMS24, setFallbackTMMS24] = useState(null);

  // Tiempo máximo de espera a la IA (n8n) antes de mostrar el cálculo alterno.
  // El flujo de n8n nunca debe dejar al psicólogo sin resultado: si tarda
  // demasiado o falla, se calcula el TMMS-24 localmente con las respuestas
  // ya cargadas (que no dependen de ningún servicio externo).
  const TIMEOUT_IA_MS = 25000;

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


  // Texto exacto del TMMS-24 (debe coincidir con bridge-alumno-front/RealizarSeguimientoEmocional.jsx):
  // reactivo_1 a reactivo_8 = Atención emocional, 9 a 16 = Claridad emocional, 17 a 24 = Reparación emocional.
  const preguntas = [
    "Presto mucha atención a los sentimientos.",
    "Normalmente me preocupo mucho por lo que siento.",
    "Normalmente dedico tiempo a pensar en mis emociones.",
    "Pienso que merece la pena prestar atención a mis emociones y estado de ánimo.",
    "Dejo que mis sentimientos afecten a mis pensamientos.",
    "Pienso en mi estado de ánimo constantemente.",
    "A menudo pienso en mis sentimientos.",
    "Presto mucha atención a cómo me siento.",
    "Tengo claros mis sentimientos.",
    "Frecuentemente puedo definir mis sentimientos.",
    "Casi siempre sé cómo me siento.",
    "Normalmente conozco mis sentimientos sobre las personas.",
    "A menudo me doy cuenta de mis sentimientos en diferentes situaciones.",
    "Siempre puedo decir cómo me siento.",
    "A veces puedo decir cuáles son mis emociones.",
    "Puedo llegar a comprender mis sentimientos.",
    "Aunque a veces me siento triste, suelo tener una visión optimista.",
    "Aunque me sienta mal, procuro pensar en cosas agradables.",
    "Cuando estoy triste, pienso en todos los placeres de la vida.",
    "Intento tener pensamientos positivos aunque me sienta mal.",
    "Si doy demasiadas vueltas a las cosas, complicándolas, trato de calmarme.",
    "Me preocupo por tener un buen estado de ánimo.",
    "Tengo mucha energía cuando me siento feliz.",
    "Cuando estoy enfadado intento cambiar mi estado de ánimo."
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

  // Si la IA no responde bien (o no responde a tiempo), se calcula el
  // TMMS-24 localmente con las mismas respuestas para que el psicólogo
  // nunca se quede sin resultado del seguimiento.
  function activarFallbackTMMS24(datosTest) {
    try {
      const resultado = calcularTMMS24(datosTest);
      setFallbackTMMS24(resultado);
    } catch (calcError) {
      console.error("No se pudo calcular el TMMS-24 alterno:", calcError);
    }
  }

  async function enviarAN8n(datosTest) {
    if (!datosTest) return;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_IA_MS);
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
          body: JSON.stringify({ respuestas }),
          signal: controller.signal
        }
      );
      const text = await response.text();
      if (!response.ok || !text) {
        console.error("Respuesta no válida del webhook de n8n:", response.status, text);
        activarFallbackTMMS24(datosTest);
        return;
      }
      let resultado;
      try {
        resultado = JSON.parse(text);
      } catch (parseErr) {
        console.error("Respuesta del webhook de n8n no es JSON válido:", text);
        activarFallbackTMMS24(datosTest);
        return;
      }
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
      if (!mensajeIA) {
        // El webhook respondió (200 OK, JSON válido) pero sin ninguno de los
        // campos esperados — típicamente un error interno del workflow de n8n
        // (ej. {"message":"Error in workflow"}), nunca se debe mostrar ese
        // JSON crudo al psicólogo.
        console.error("Respuesta de n8n sin campo de interpretación reconocido:", resultado);
        activarFallbackTMMS24(datosTest);
        return;
      }
      setInterpretacion(mensajeIA);
    } catch (error) {
      if (error?.name === "AbortError") {
        console.error(`El webhook de n8n no respondió en ${TIMEOUT_IA_MS / 1000}s, se usa el cálculo alterno.`);
      } else {
        console.error("Error enviando a n8n:", error);
      }
      activarFallbackTMMS24(datosTest);
    } finally {
      clearTimeout(timeoutId);
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
            {!analizando && !interpretacion && fallbackTMMS24 && (
              <SeguimientoAlternativoTMMS24 resultado={fallbackTMMS24} />
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