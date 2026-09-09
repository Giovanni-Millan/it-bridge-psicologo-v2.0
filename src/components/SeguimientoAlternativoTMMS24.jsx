import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTriangleExclamation,
  faEye,
  faLightbulb,
  faHeartPulse,
} from "@fortawesome/free-solid-svg-icons";

const ESTILOS_NIVEL = {
  baja: "bg-red-50 text-red-700 border-red-200",
  excesiva: "bg-red-50 text-red-700 border-red-200",
  adecuada: "bg-green-50 text-green-700 border-green-200",
  excelente: "bg-green-50 text-green-700 border-green-200",
};

const ESTILOS_RIESGO = {
  bajo: "bg-green-100 text-green-800",
  moderado: "bg-yellow-100 text-yellow-800",
  alto: "bg-red-100 text-red-800",
};

const ETIQUETAS_RIESGO = {
  bajo: "Bajo riesgo emocional",
  moderado: "Riesgo moderado",
  alto: "Alto riesgo emocional",
};

function TarjetaDimension({ icono, titulo, dimension }) {
  return (
    <div className={`rounded-xl border p-5 ${ESTILOS_NIVEL[dimension.nivel]}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 font-bold">
          <FontAwesomeIcon icon={icono} />
          {titulo}
        </div>
        <span className="text-sm font-semibold">
          {dimension.puntaje}/40 · {dimension.etiqueta}
        </span>
      </div>
      <p className="text-sm leading-relaxed">{dimension.descripcion}</p>
    </div>
  );
}

export default function SeguimientoAlternativoTMMS24({ resultado }) {
  if (!resultado) return null;

  return (
    <div>
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 mb-6">
        <FontAwesomeIcon icon={faTriangleExclamation} className="mt-1" />
        <div className="text-sm leading-relaxed">
          <p className="font-semibold">
            La interpretación con inteligencia artificial no está disponible en este momento.
          </p>
          <p>
            Se muestra un cálculo automático basado en el estándar TMMS-24 (Atención,
            Claridad y Reparación emocional) a partir de las respuestas del alumno.
            {resultado.esAproximado && (
              <>
                {" "}
                Los rangos usados son una aproximación general, ya que el sistema aún no
                captura el sexo del alumno (el TMMS-24 oficial usa tablas distintas por sexo).
              </>
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-5">
        <span className="font-semibold text-gray-700">Nivel general:</span>
        <span
          className={`px-3 py-1 rounded-full text-sm font-semibold ${ESTILOS_RIESGO[resultado.riesgoGeneral]}`}
        >
          {ETIQUETAS_RIESGO[resultado.riesgoGeneral]}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <TarjetaDimension icono={faEye} titulo="Atención emocional" dimension={resultado.atencion} />
        <TarjetaDimension icono={faLightbulb} titulo="Claridad emocional" dimension={resultado.claridad} />
        <TarjetaDimension icono={faHeartPulse} titulo="Reparación emocional" dimension={resultado.reparacion} />
      </div>
    </div>
  );
}
