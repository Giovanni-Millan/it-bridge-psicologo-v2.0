# Versiones — Bridge Psicólogo

Convención de numeración: `MAYOR.FUNCIÓN.CAMBIO`

- **MAYOR** (1er número): se incrementa solo en hitos grandes, a criterio manual.
- **FUNCIÓN** (2do número): se incrementa al implementar una función nueva. Al subir este número, **CAMBIO se reinicia a 0**.
- **CAMBIO** (3er número): se incrementa con cada corrección/ajuste dentro de la función actual (bugs, retoques, mejoras menores).

Cada versión se documenta aquí con lo que trae, de la más reciente a la más antigua.

**Nota:** el número de versión se sincroniza entre los 4 portales web (admin, docente, alumno, psicólogo) cuando el cambio toca a todos por igual — cada repo mantiene su propio `versiones.md`.

---

## 1.3.1 — 2026-11-21

Corrección: el pie de página se queda siempre abajo.

- En pantallas con poco contenido (ej. "Seguimientos emocionales" de un alumno) el pie quedaba flotando a media pantalla con un espacio en blanco debajo.
- `RutaProtegida.jsx` ahora envuelve el contenido en un contenedor de al menos el alto de la pantalla (`min-h-screen flex flex-col`, contenido en `flex-1`), así el pie queda pegado al fondo. En pantallas largas no cambia nada: el pie sigue apareciendo al final del contenido.

## 1.3.0 — 2026-09-30

Pie de página del sistema, con la autoría, en los 4 portales web (admin, docente, alumno, psicólogo).

- Texto: "Sistema Bridge · Creado por Ing. Giovanni Millán Guevara · Todos los derechos reservados © {año}".
- Fondo morado de marca (`bg-purple-950`, el mismo tono del Navbar), aparece al final del contenido de cada página (no fijo/flotante).
- Se monta en `RutaProtegida.jsx`, justo después del `<Outlet/>` — por diseño **nunca aparece en el Login**, solo una vez que hay sesión válida y se renderizan las rutas protegidas.
- Componente nuevo `components/Footer.jsx`, igual en los 4 repos.
