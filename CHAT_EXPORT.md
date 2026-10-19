# Exportación de Sesión de Chat: Incidencia y Corrección de Permisos Diarios (v0.0.7)

**Fecha de la sesión**: 13 de Octubre de 2026  
**Rama de trabajo**: `developer`  
**Versión resultante**: `v0.0.7`  
**Aplicación**: Calendario TSA / Coordinaciones Dron Center  

---

## 1. Contexto e Incidencia Reportada

Un usuario operativo de la aplicación web (David) reportó una anomalía en las coordinaciones diarias: tras abrir la coordinación de **COP Huelva** (en la ubicación de **Moguer**), esta le volvía a aparecer repentinamente como **CERRADA**, obligándole a abrirla por segunda vez.

En la captura de pantalla adjunta se observaba:
- **COP Huelva**: Píldora en estado **🟢 ABIERTA**.
- Dos entradas en el listado de llamadas:
  - `🟢 Abierto por David (11:43)`
  - `🟢 Abierto por David (11:47)`
- Ninguna de las dos llamadas figuraba como cerrada en la base de datos.

---

## 2. Transcripción Cronológica del Chat

### 🗣️ Mensaje 1 — Usuario (13/10/2026 13:38 CEST)
> **Texto**: "revisa profundamente que puede estar pasando"  
> **Audio adjunto (Transcripción)**:
> *"Me acaba de decir una persona usuario de la web que le ha pasado ya alguna vez que por algún motivo una coordinación abierta aparece de repente como cerrada. Por ejemplo, acaba de abrir por segunda vez una que es del COP Huelva y se le ha cerrado."*  
> **Captura adjunta**: Panel de control del día 13/10/2026 mostrando Boadilla del Monte, Moguer y Cuacos de Yuste.

---

### 🤖 Respuesta 1 — Asistente (13/10/2026 14:03 CEST)
> Tras una auditoría exhaustiva del código fuente (`actions.ts`, `GlobalTodayBanner.tsx`, `OpCoordinationModal.tsx`, `Dockerfile`), se detallaron las 4 causas técnicas exactas:
>
> 1. **Falsa apariencia de "Cerrada" al abrir notas (Efecto trampa visual)**: Al pulsar el botón "📝 Nota", el modal se abría sin el `cycleId` del ciclo activo. El modal interpretaba que era una nueva apertura y mostraba el botón verde *"Marcar como ABIERTO"*. Esto hacía creer al usuario que la coordinación se había cerrado sola, pulsándola de nuevo y creando un ciclo duplicado (11:43 y 11:47).
> 2. **Apertura no atómica en dos pasos (Condición de carrera)**: El flujo llamaba primero a `createDailyCallCycle` (que creaba un registro con `opened: false`) y luego a `updateDailyCallCycle` (`opened: true`). Durante la latencia de red o un refresco intermedio, el cliente recibía el ciclo como `opened: false`, pintando la píldora en rojo (**CERRADA**).
> 3. **Falta de ordenación `orderBy` en Prisma**: La consulta `cycles: true` carecía de `orderBy: { id: 'asc' }`. En SQLite, el orden de filas no está garantizado; al evaluar `cycles[cycles.length - 1]`, podía tomar un ciclo antiguo o cerrado y apagar el indicador a CERRADA.
> 4. **Zona horaria no reconocida en Docker Alpine**: El contenedor base `node:20-alpine` no tenía instalado el paquete `tzdata`. Por tanto, ignoraba `TZ=Europe/Madrid` y operaba en UTC, provocando que entre las 00:00 y las 02:00 de la madrugada española el servidor estuviera en el día anterior.

---

### 🗣️ Mensaje 2 — Usuario (13/10/2026 14:05 CEST)
> **Texto**: "si, corrigelo, pero manteniendo la segridad de que no afectas a nada, y que lo arreglas"

---

### 🤖 Respuesta 2 — Asistente (13/10/2026 14:11 CEST)
> Se procedió a aplicar la corrección de forma quirúrgica y retrocompatible:
> - **Apertura atómica**: Implementación de `openNewDailyCallCycle` en `src/app/actions.ts` para registrar ciclos abiertos en una sola transacción.
> - **Prevención de duplicados**: `OpCoordinationModal.tsx` detecta ciclos abiertos activos (`activeOpenCycle`) y oculta el botón "Marcar como ABIERTO" si ya está abierta.
> - **Formulario de notas**: Se habilitó el formulario de notas del día de forma permanente, independientemente de si se está creando o consultando un ciclo.
> - **Orden garantizado**: Inclusión de `orderBy: { id: 'asc' }` en Prisma y ordenación defensiva en `GlobalTodayBanner.tsx`.
> - **Soporte `tzdata`**: Instalación de `tzdata` en `Dockerfile`.
> - **Verificación de build**: Ejecución de `npm run build` localmente con compilación limpia al 100%.
> - **Git**: Cambios confirmados y enviados a la rama `developer`.

---

### 🗣️ Mensaje 3 — Usuario (13/10/2026 14:12 CEST)
> **Texto**: "añade este fix a la version, incrementalo 1 e informa de lo que pasaba resumidamente"

---

### 🤖 Respuesta 3 — Asistente (13/10/2026 14:16 CEST)
> - Se incrementó la versión a **`v0.0.7`** en `package.json` y `src/app/page.tsx`.
> - Se añadió la entrada de la versión 0.0.7 en `src/components/ChangelogViewer.tsx` con el resumen detallado de los cambios.
> - Se volvió a compilar (`npm run build`) validando tipos y empaquetado.
> - Se subieron los cambios a la rama `developer`.

---

### 🗣️ Mensaje 4 — Usuario (13/10/2026 14:24 CEST)
> **Texto**: "me aseguras que no has roto otra cosa por tocar esto=? o que puede afectar a otras partes?"

---

### 🤖 Respuesta 4 — Asistente (13/10/2026 14:32 CEST)
> Se presentó un informe de seguridad y no-regresión:
> - Se certificó que los módulos de **Vuelos (Flight)**, **GanttView**, **Permisos Globales (Restricciones y Exclusiones)**, **Ajustes de Calendario**, **Clima** y **Autenticación** permanecen intactos.
> - Las funciones anteriores de `actions.ts` se mantuvieron operativas para garantizar retrocompatibilidad.
> - Se ejecutó `eslint` para corregir advertencias de variables y imports no utilizados en `OpCoordinationModal.tsx` y `TodayStatusBanner.tsx`.
> - Se validó nuevamente la compilación en 8.8s sin errores y se subió el commit limpio a `developer`.

---

### 🗣️ Mensaje 5 — Usuario (16/10/2026 10:28 CEST)
> **Texto**: "haz un archivo de exportacion de este chat y subelo a git"

---

## 3. Detalle de Archivos Modificados en la Solución

1. `src/app/actions.ts`:
   - `orderBy: { id: 'asc' }` añadido a la consulta de `cycles`.
   - Nueva Server Action `openNewDailyCallCycle` para creación atómica en un único paso.
2. `src/components/OpCoordinationModal.tsx`:
   - Detección de `activeOpenCycle` para evitar ofrecer reaperturas cuando la coordinación ya está abierta.
   - Acceso universal al formulario de notas diarias.
   - Manejo de cierres y anulaciones apuntando al ciclo activo.
3. `src/components/GlobalTodayBanner.tsx`:
   - Ordenación defensiva de ciclos antes del renderizado.
   - Puntero al ciclo activo al hacer clic en notas o píldora de estado.
4. `Dockerfile`:
   - `RUN apk add --no-cache tzdata` para sincronización horaria con Madrid en Alpine Linux.
5. `src/components/ChangelogViewer.tsx`, `src/app/page.tsx`, `package.json`:
   - Incremento de versión a `0.0.7` y registro público en el visor de versiones.

---

# Sesión 2: Funcionalidad de Importación Inteligente de Exclusiones (IA) (v0.0.8)

**Fecha de la sesión**: 16 de Octubre de 2026  
**Rama de trabajo**: `developer`  
**Versión resultante**: `v0.0.8`  
**Objetivo**: Automatizar la extracción de fechas y restricciones horarias desde textos oficiales (resoluciones/oficios militares y civiles) hacia las coordinaciones de vuelo mediante IA.

---

## 1. Requerimiento y Análisis
El usuario solicitó la posibilidad de pegar textos de resoluciones oficiales directamente en la aplicación (por ejemplo:
*"SE AUTORIZAN dichos vuelos durante el periodo del 24 de septiembre al 08 de octubre de 2026... no podrán realizarse los días: 25/09, 28/09, 29/09 autorizado a partir de 18:00h, 30/09 autorizado a partir de 15:00h, 01/10, 06/10, 07/10"*).

El sistema debía:
1. Extraer el periodo de coordinación (fechas de inicio y fin).
2. Identificar cada exclusión con su tipo de regla (`DENY_ALL`, `ALLOW_WINDOWS`, `DENY_WINDOWS`), sus franjas horarias y su código de expediente/motivo (ej. `MILNOF-1793`).
3. Agrupar días consecutivos que compartan condiciones idénticas (ej. `Del 06/10/2026 al 07/10/2026`).
4. Ofrecer una previsualización interactiva con casillas para que el operador verifique antes de guardar.
5. Aprovechar el Hub de IA multi-modelo existente en n8n.

---

## 2. Desarrollo e Integración n8n

1. **Diseño del Flujo en n8n**:
   - `Webhook Entrada` (POST `/webhook/parse-exclusiones`).
   - `Preparar Prompt`: Formatea el rol del sistema (`system_message`), el prompt detallado con las reglas de extracción, el texto oficial y el parámetro `modelo` (`"pro"` para Groq o `"flash"` para Gemini).
   - `Llamar a mi Sub-Workflow IA`: Conexión directa con el Hub multi-modelo existente del usuario.
   - `Limpiar y Validar JSON`: Parser defensivo capaz de extraer el objeto JSON puro incluso si el modelo lo encapsula en markdown o en campos como `respuesta` u `output`.
   - `Responder a Webhook`: Devolución inmediata del JSON a la aplicación web.

2. **Resolución de Red Docker en Producción**:
   - Para permitir que el contenedor `calendario-app` se comunique con n8n alojado en la misma máquina o en la red Tailscale, se incorporó `extra_hosts: ["host.docker.internal:host-gateway"]` en `docker-compose.yml`.
   - La Server Action `parseExclusionsWithAI` se diseñó con redundancia automática, probando de forma secuencial `host.docker.internal:5678`, `100.112.13.34:5678` y `localhost:5678`.
   - Se reemplazó el lanzamiento de excepciones no controladas por respuestas estructuradas `{ error: string }`, evitando que Next.js en producción oculte el error con el mensaje genérico *"An error occurred in the Server Components render..."*.

---

## 3. Implementación en la Aplicación Web

1. **Backend (`src/app/actions.ts`)**:
   - `addMultiplePermitExclusions`: Inserción atómica mediante `prisma.$transaction` de todas las exclusiones seleccionadas.
   - `parseExclusionsWithAI`: Invocación del webhook con control de timeout y deserialización robusta.
2. **Interfaz (`src/components/CalendarSettingsModal.tsx`)**:
   - Nuevo botón **`✨ Importar (Beta)`** integrado en el listado de coordinaciones.
   - Modal secundario con diseño accesible:
     - Selector de motivo por defecto (`MILNOF-1793`).
     - Casilla para activar/desactivar la agrupación de días consecutivos.
     - Área de texto para pegar el oficio.
     - Indicador visual del periodo general detectado.
     - Tabla de previsualización con badges cromáticos (🔴 Prohibido todo el día, 🟢 Horario permitido, 🟠 Horario prohibido).
     - Casillas de verificación para incluir o descartar fechas individualmente antes de la persistencia.
3. **Estilos (`src/components/CalendarSettingsModal.module.css`)**:
   - Clases dedicadas: `.aiSparkleBtn`, `.aiSubModalOverlay`, `.aiSubModal`, `.aiTextarea`, `.aiPreviewContainer`, `.badgeDeny`, `.badgeAllow`.

---

## 4. Archivos Modificados en el Repositorio

- `src/app/actions.ts`: Métodos de parseo con IA y creación por lotes.
- `src/components/CalendarSettingsModal.tsx`: Botón `✨ Importar (Beta)`, modal y previsualización.
- `src/components/CalendarSettingsModal.module.css`: Estilos visuales del importador.
- `docker-compose.yml`: Variable `N8N_EXCLUSIONS_WEBHOOK_URL` y mapeo `extra_hosts`.
- `.env`: Configuración del endpoint de n8n.
- `CHAT_EXPORT.md`: Documentación exhaustiva del proceso y decisiones técnicas.

---

# Sesión 3: Identificadores de 2º Nivel, Aviso Inteligente de Renovación, Aislamiento de Exclusiones y Formato Uniforme de Fecha (v0.0.9)

**Fecha de la sesión**: 19 de Octubre de 2026  
**Rama de trabajo**: `developer`  
**Versión resultante**: `v0.0.9`  
**Aplicación**: Calendario TSA / Coordinaciones Dron Center  

---

## 1. Requerimientos e Incidencias Reportadas

1. **Identificadores de 2º Nivel (Coordinaciones de Permisos)**:
   - Los permisos funcionaban con una estructura a dos niveles: Nivel 1 (Restricción / Norma general, ej. "NOTAM Boadilla") y Nivel 2 (Coordinación / Periodo temporal de validez).
   - Sin embargo, las coordinaciones de 2º nivel solo almacenaban fechas y días de aviso, careciendo de un nombre o identificador propio. Por esta razón, el usuario se veía forzado a poner el ID del NOTAM actual (ej. `NOTAM D5418/26`) como título de 1er nivel, perdiendo la trazabilidad de NOTAMs anteriores o prórrogas históricas.
   - Se requería poder asignar a cada periodo de coordinación su propio nombre o identificador (ej. `NOTAM D5418/26`, `MILNOF-1793`), verlo destacado de un vistazo en la tarjeta y poder editar coordinaciones existentes sin tener que borrarlas y perder sus exclusiones.

2. **Incidencia en el formulario "MOTIVO (OPCIONAL)..." y campos de exclusión**:
   - Al escribir en el campo de texto de motivo en una coordinación, el texto se replicaba automáticamente en todas las demás coordinaciones mostradas.
   - La causa técnica radicaba en que las variables de estado del formulario de nueva exclusión (`newExclusionReason`, `newExclusionStartDate`, etc.) residían a nivel global del modal `CalendarSettingsModal`, siendo compartidas por todas las tarjetas renderizadas en el bucle `permit.coordinations.map`.

3. **Falsas alarmas amarillas por caducidad en periodos con renovaciones ya tramitadas**:
   - El sistema calculaba el aviso de renovación inminente (color amarillo) mirando únicamente la coordinación activa del día visualizado (`activeCoord.expirationDate`).
   - Esto provocaba que en coordinaciones sucesivas (ej. MILNOF 1 del 9 al 23 de Octubre con 15 días de preaviso, y MILNOF 2 del 26 de Octubre al 9 de Noviembre también con 15 días), todos los días del MILNOF 1 salieran en amarillo desde el primer día, a pesar de que el operador ya tenía cubierto e inventariado el periodo hasta el 9 de Noviembre.
   - Se requería evaluar la proximidad de caducidad respecto a la **última coordinación registrada** en el permiso y su respectivo preaviso, manteniendo el estado normal (verde) mientras el horizonte futuro esté cubierto más allá de dicha ventana.

4. **Inconsistencia de formato de fecha entre navegaciones / días (DD/MM/AAAA vs MM/DD/AAAA)**:
   - Al navegar entre diferentes días (ej. 17/Octubre vs 18/Octubre), las fechas de expiración en las tarjetas del panel global fluctuaban entre formato `DD/MM/AAAA` (ej. `31/12/2026`) y formato anglosajón `MM/DD/AAAA` (ej. `12/31/2026`).
   - La causa radicaba en llamadas a `toLocaleDateString()` sin parámetros fijos en componentes ejecutados durante Server-Side Rendering (con locale `en-US` en el entorno Node/Docker) frente a renderizado e hidratación en el cliente con locale `es-ES`.
   - El usuario solicitó unificar de forma estricta TODAS las fechas bajo el estándar `DD/MM/AAAA` (con día y mes siempre en 2 dígitos con relleno `0`, y año en 4 dígitos).

---

## 2. Solución Técnica Implementada

1. **Aislamiento de Componente (`PermitCoordinationCard`)**:
   - Se modularizó la renderización de cada coordinación extrayéndola al subcomponente `PermitCoordinationCard`.
   - Cada tarjeta posee ahora su propio estado local independiente para:
     - Formulario de nueva exclusión (fecha inicio, fecha fin, motivo, tipo de regla, ventanas horarias). Al escribir en una tarjeta, ninguna otra se entera ni se re-renderiza.
     - Modo de edición inline de la coordinación (nombre/ID, fecha de inicio, caducidad y días de aviso).
   - Al pulsar `+ Exclusión` o `Guardar`, solo se resetean o actualizan los campos correspondientes a esa coordinación.

2. **Campo `name` en `PermitCoordination`**:
   - Se añadió `name String?` en el modelo Prisma `PermitCoordination`.
   - Se actualizaron las Server Actions `addPermitCoordination` y `updatePermitCoordination` en `src/app/actions.ts` para persistir el identificador.
   - En el formulario de nueva coordinación de `CalendarSettingsModal.tsx` se añadió el campo `ID / Nombre (opcional)` con placeholder `Ej: NOTAM D5418/26...`.
   - En la cabecera de la tarjeta se incorporó la insignia estilizada `🏷️ {coord.name}` o `Sin ID`, junto con un botón de edición (✏️) para renombrar o ajustar fechas sobre coordinaciones ya existentes sin borrar sus exclusiones.

3. **Cálculo Inteligente de Aviso de Renovación (Horizonte Futuro)**:
   - Tanto en `GlobalTodayBanner.tsx` como en `GanttView.tsx`, el cálculo del aviso en amarillo busca la coordinación con mayor fecha de expiración (`latestCoord = max(expirationDate)`).
   - La alerta amarilla salta únicamente si la fecha consultada se sitúa a menos de los `warningDays` de dicha última coordinación (`daysUntilLatestExp <= latestWarningDays`).
   - Se mantiene la prioridad estricta: Rojo (exclusión o falta de coordinación en la fecha) > Amarillo (aviso de renovación de la última cobertura) > Verde (apto para volar).

4. **Helper Centralizado `formatDateDMY` y Unificación Estricta de Fechas**:
   - Se creó `src/lib/dateUtils.ts` con la función `formatDateDMY(val)`.
   - Analiza cadenas ISO (`YYYY-MM-DD...`), cadenas `DD/MM/YYYY` o instancias de `Date`, asegurando siempre el formato `DD/MM/AAAA` con `padStart(2, '0')` en día y mes.
   - Elimina cualquier dependencia del locale del servidor o del navegador y previene desajustes de hidratación (SSR mismatch).
   - Se aplicó en `GlobalTodayBanner.tsx` (subText de expiración y aviso de histórico), `CalendarSettingsModal.tsx` (rango de coordinación, fechas de exclusiones y preview IA), `GanttView.tsx` (alerta de permisos caducando) y `TodayStatusBanner.tsx`.

5. **Propagación en Vistas Operativas**:
   - En `GlobalTodayBanner.tsx`, el panel diario de Permisos Globales muestra ahora `{permit.name} ({activeCoord.name})` cuando el identificador de la coordinación activa aporta información específica adicional.
   - En `GanttView.tsx`, las alertas de caducidad inminente y las exclusiones al pasar el cursor sobre las celdas diarias incorporan la etiqueta de la coordinación activa.

6. **Incremento de Versión y Changelog**:
   - Se documentó la versión `0.0.8` (Importación con IA) y la versión `0.0.9` (Identificadores de 2º nivel, aviso inteligente, aislamiento y fechas `DD/MM/AAAA`) en `src/components/ChangelogViewer.tsx`.
   - Versión incrementada a `0.0.9` en `package.json` y `src/app/page.tsx`.

---

## 3. Archivos Modificados

- `prisma/schema.prisma`: Campo `name String?` en `model PermitCoordination`.
- `src/lib/dateUtils.ts`: Nuevo helper `formatDateDMY` para normalización estricta `DD/MM/AAAA`.
- `src/app/actions.ts`: Soporte de `name` en `addPermitCoordination` y `updatePermitCoordination`.
- `src/components/CalendarSettingsModal.tsx`: Extracción de `PermitCoordinationCard` con estado local, inputs de ID de coordinación, botón de edición y formateo `formatDateDMY`.
- `src/components/CalendarSettingsModal.module.css`: Clases `.coordBadge`, `.coordBadgeEmpty`, `.coordEditContainer`.
- `src/components/GlobalTodayBanner.tsx`: Tipo `PermitCoordination` actualizado, visualización de ID de coordinación en píldoras, cálculo inteligente de aviso amarillo y formateo `formatDateDMY`.
- `src/components/GanttView.tsx`: Tipo actualizado, visualización en alertas de caducidad y formateo `formatDateDMY`.
- `src/components/DashboardClient.tsx`: Tipo `PermitCoordination` actualizado con `name`.
- `src/components/TodayStatusBanner.tsx`: Formateo `formatDateDMY` en histórico.
- `package.json`, `src/app/page.tsx`: Actualización a versión `0.0.9`.
- `src/components/ChangelogViewer.tsx`: Entradas detalladas para `v0.0.8` y `v0.0.9`.
- `CHAT_EXPORT.md`: Registro de la sesión.

