// Cálculo alterno del TMMS-24 (Trait Meta-Mood Scale, adaptación española de
// Fernández-Berrocal, Extremera y Ramos, 2004).
//
// Se usa como respaldo SOLO cuando la interpretación con IA (n8n) no está
// disponible o falla, para que el psicólogo siempre reciba algún resultado
// del seguimiento emocional del alumno, aunque sea el cálculo estadístico
// en vez de la redacción de la IA.
//
// El cuestionario (24 reactivos, Likert 1-5) mide 3 dimensiones de 8 ítems
// cada una, en este orden exacto:
//   reactivo_1  a reactivo_8  -> Atención emocional
//   reactivo_9  a reactivo_16 -> Claridad emocional
//   reactivo_17 a reactivo_24 -> Reparación emocional
// Cada dimensión se puntúa sumando sus 8 ítems (rango posible: 8 a 40).
//
// LIMITACIÓN CONOCIDA: los puntos de corte oficiales del TMMS-24 son
// distintos para hombres y mujeres. Hoy el sistema no captura el sexo del
// alumno (tabla `alumnos` no tiene esa columna), así que aquí se usa una
// tabla "general" (aproximación razonable entre ambas tablas oficiales).
// Si en el futuro se agrega `alumnos.sexo`, pasar 'H' o 'M' como segundo
// argumento de `calcularTMMS24` para usar los puntos de corte oficiales
// exactos (ya están implementados abajo, solo hay que conectarlos).

const TABLAS_CORTE = {
  general: {
    atencion: [
      { max: 22, nivel: "baja" },
      { max: 33, nivel: "adecuada" },
      { max: Infinity, nivel: "excesiva" },
    ],
    claridad: [
      { max: 24, nivel: "baja" },
      { max: 35, nivel: "adecuada" },
      { max: Infinity, nivel: "excelente" },
    ],
    reparacion: [
      { max: 23, nivel: "baja" },
      { max: 35, nivel: "adecuada" },
      { max: Infinity, nivel: "excelente" },
    ],
  },
  // Tablas oficiales exactas, listas para usar si se captura el sexo del alumno.
  H: {
    atencion: [
      { max: 21, nivel: "baja" },
      { max: 32, nivel: "adecuada" },
      { max: Infinity, nivel: "excesiva" },
    ],
    claridad: [
      { max: 25, nivel: "baja" },
      { max: 35, nivel: "adecuada" },
      { max: Infinity, nivel: "excelente" },
    ],
    reparacion: [
      { max: 23, nivel: "baja" },
      { max: 35, nivel: "adecuada" },
      { max: Infinity, nivel: "excelente" },
    ],
  },
  M: {
    atencion: [
      { max: 24, nivel: "baja" },
      { max: 35, nivel: "adecuada" },
      { max: Infinity, nivel: "excesiva" },
    ],
    claridad: [
      { max: 23, nivel: "baja" },
      { max: 34, nivel: "adecuada" },
      { max: Infinity, nivel: "excelente" },
    ],
    reparacion: [
      { max: 23, nivel: "baja" },
      { max: 34, nivel: "adecuada" },
      { max: Infinity, nivel: "excelente" },
    ],
  },
};

const DESCRIPCIONES = {
  atencion: {
    baja: "Presta poca atención a sus propios sentimientos. Podría beneficiarse de espacios que fomenten la introspección y el reconocimiento de sus emociones en el día a día.",
    adecuada: "Presta una atención saludable a sus emociones: ni las ignora ni se enfoca en ellas en exceso.",
    excesiva: "Presta una atención muy alta a sus emociones, lo cual en algunos casos puede derivar en preocupación excesiva o rumiación sobre lo que siente.",
  },
  claridad: {
    baja: "Le cuesta identificar y distinguir con precisión lo que siente. Trabajar su vocabulario emocional podría ayudarle a reconocer mejor sus estados de ánimo.",
    adecuada: "Reconoce e identifica sus propias emociones con claridad la mayor parte del tiempo.",
    excelente: "Tiene una capacidad muy desarrollada para comprender con precisión sus propios estados emocionales.",
  },
  reparacion: {
    baja: "Le cuesta regular o mejorar su estado de ánimo cuando se siente mal. Podría beneficiarse de estrategias de regulación emocional.",
    adecuada: "Cuenta con estrategias adecuadas para regular su estado de ánimo ante situaciones difíciles.",
    excelente: "Tiene una gran capacidad para regular sus emociones y mantener una actitud positiva incluso ante contratiempos.",
  },
};

const ETIQUETAS_NIVEL = {
  baja: "Baja",
  adecuada: "Adecuada",
  excesiva: "Excesiva",
  excelente: "Excelente",
};

function clasificar(puntaje, tabla) {
  const encontrada = tabla.find((rango) => puntaje <= rango.max);
  return encontrada ? encontrada.nivel : tabla[tabla.length - 1].nivel;
}

function sumarRango(valores, inicio, fin) {
  let suma = 0;
  for (let i = inicio; i < fin; i++) {
    const n = Number(valores[i]);
    suma += Number.isFinite(n) ? n : 0;
  }
  return suma;
}

/**
 * Calcula el resultado del TMMS-24 a partir de las 24 respuestas (1-5).
 * @param {number[]|Object} respuestas - array de 24 números en orden
 *   (reactivo_1..reactivo_24), o un objeto con esas claves.
 * @param {'H'|'M'|null} sexo - opcional, para usar la tabla oficial exacta.
 *   Si no se provee, usa la tabla general aproximada.
 */
export function calcularTMMS24(respuestas, sexo = null) {
  const valores = Array.isArray(respuestas)
    ? respuestas
    : Array.from({ length: 24 }, (_, i) => respuestas[`reactivo_${i + 1}`]);

  const tabla = TABLAS_CORTE[sexo] || TABLAS_CORTE.general;

  const puntajeAtencion = sumarRango(valores, 0, 8);
  const puntajeClaridad = sumarRango(valores, 8, 16);
  const puntajeReparacion = sumarRango(valores, 16, 24);

  const nivelAtencion = clasificar(puntajeAtencion, tabla.atencion);
  const nivelClaridad = clasificar(puntajeClaridad, tabla.claridad);
  const nivelReparacion = clasificar(puntajeReparacion, tabla.reparacion);

  // Nivel de riesgo emocional general: cuenta cuántas dimensiones cayeron
  // en zona de alerta (baja capacidad, o atención emocional excesiva).
  const alertas = [
    nivelAtencion === "baja" || nivelAtencion === "excesiva",
    nivelClaridad === "baja",
    nivelReparacion === "baja",
  ].filter(Boolean).length;

  const riesgoGeneral =
    alertas === 0 ? "bajo" : alertas === 1 ? "moderado" : "alto";

  return {
    esAproximado: !sexo,
    riesgoGeneral,
    atencion: {
      puntaje: puntajeAtencion,
      nivel: nivelAtencion,
      etiqueta: ETIQUETAS_NIVEL[nivelAtencion],
      descripcion: DESCRIPCIONES.atencion[nivelAtencion],
    },
    claridad: {
      puntaje: puntajeClaridad,
      nivel: nivelClaridad,
      etiqueta: ETIQUETAS_NIVEL[nivelClaridad],
      descripcion: DESCRIPCIONES.claridad[nivelClaridad],
    },
    reparacion: {
      puntaje: puntajeReparacion,
      nivel: nivelReparacion,
      etiqueta: ETIQUETAS_NIVEL[nivelReparacion],
      descripcion: DESCRIPCIONES.reparacion[nivelReparacion],
    },
  };
}
