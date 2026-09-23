# Coordinación TSA - Calendario de Operaciones de Vuelo

Este es un sistema web interactivo diseñado para la gestión, visualización y coordinación de operaciones de vuelo en zonas segregadas temporalmente (TSA). La aplicación permite planificar vuelos, evitar colisiones horarias, gestionar operadores (pilotos) y coordinar operativamente los vuelos diarios con múltiples sitios de llamada de manera eficiente.

## 🚀 Características Principales

- **Gestión de Calendarios**: Creación, edición, y eliminación de calendarios independientes. Ajustes globales desde un único modal de configuración (Zonas, Permisos, Llamadas, etc.).
- **Vista de Gantt Interactiva**:
  - Visualización en modo **Semanal** o **Mensual**.
  - Navegación temporal sencilla (Anterior, Hoy, Siguiente).
  - Actualización automática en segundo plano cada 5 minutos para mantener siempre la información sincronizada.
- **Base de Operadores (Pilotos)**: Listado global y centralizado de pilotos accesibles desde la cabecera principal en cualquier momento.
- **Formulario de Operaciones (Vuelos)**:
  - Información detallada: operador, fechas y horas de inicio y fin, notas sobre la situación actual.
  - Selección de estado de coordinación: **Confirmado**, **Pendiente** o **Anulada**.
- **Coordinación Operativa Diaria (Banner Global)**:
  - Posibilidad de definir múltiples **"Sitios a llamar"** (ej: Torrejón, Aeródromos) por calendario.
  - Banner global para hacer seguimiento de las llamadas de Apertura y Cierre operativas de hoy.
  - Firmas de apertura/cierre rápidas con registro de hora, responsable y sistema de anulación.
  - Notas del día específicas para cada sitio de llamada.
- **Sistema de Advertencia de Colisiones**: Detección en tiempo real de solapamientos horarios y espaciales entre dos vuelos activos en la misma zona de vuelo.
- **Navegación Histórica Segura**: Sistema de visualización de datos pasados con recarga forzada (hard-reload) para garantizar precisión y un **banner de alerta visual (rojo)** para evitar confusiones operativas.
- **Bloqueo Global de Ubicaciones**: Permite deshabilitar temporalmente un calendario/ubicación entera, inhabilitando las firmas y operaciones, mostrándolo en gris opaco con un letrero llamativo del motivo. El bloqueo es permanente hasta que se deshabilita manualmente.
- **Seguridad por PIN Global**: Sistema de acceso blindado por contraseña (PIN) utilizando el proxy/middleware de Next.js. Autenticación con cookies HTTP-only (duración de 1 año) que protege la plataforma contra accesos no autorizados.
- **Diseño Ultra Responsivo**: Interfaz optimizada con CSS puro y media queries para una experiencia excelente en teléfonos móviles, tablets y ordenadores.
- **Estética Glassmorphism**: Nueva interfaz principal con un aspecto premium, elegante, semitransparente y oscuro, para contrastar de manera profesional la coordinación diaria de los espacios.
- **Integración Meteorológica y Alertas en Tiempo Real**: Autocompletado geográfico inteligente (vía *Nominatim OpenStreetMap*) al crear ubicaciones y sincronización del clima con el sistema automático de refresco de la web. Consulta la API gratuita de *Open-Meteo* para visualizar clima, viento, temperatura y **% de probabilidad de lluvia**, incorporando un sistema dinámico de alertas visuales en los paneles (bordes parpadeantes amarillos y rojos según la intensidad del viento o presencia de precipitaciones/tormentas).

---

## 🛠️ Stack Tecnológico

- **Framework**: [Next.js 16](https://nextjs.org/) con App Router y Server Actions.
- **Biblioteca de UI**: React 19.
- **Estilos**: Vanilla CSS Modules (diseño adaptativo y componentes modulares).
- **Base de Datos y ORM**: Prisma con base de datos SQLite (almacenada localmente en `/data/database.sqlite` para persistencia).
- **Contenedores**: Docker y Docker Compose (soporta despliegue inmediato con integración en red y proxy de acceso seguro).
- **Red Segura**: Configuración opcional con Tailscale en `docker-compose.yml` para acceso seguro remoto.

---

## 📁 Estructura del Proyecto

```text
├── data/                      # Directorio de datos persistidos (Base de Datos SQLite)
├── prisma/                    # Esquema y migraciones de Prisma
│   └── schema.prisma          # Definición de modelos (Calendar, Zone, Flight, Operator, CallTarget, DailyCallStatus)
├── src/
│   ├── app/
│   │   ├── actions.ts         # Server Actions de Next.js para base de datos (Prisma CRUD)
│   │   ├── globals.css        # Estilos globales y variables de diseño
│   │   ├── proxy.ts           # Interceptor de seguridad global y validación de cookies
│   │   ├── auth.ts            # Server Actions para validación del PIN de seguridad
│   │   ├── layout.tsx         # Diseño estructural raíz
│   │   ├── page.tsx           # Página principal del dashboard (Server Component)
│   │   └── page.module.css    # Estilos específicos de la página de inicio
│   ├── login/                 # Interfaz de acceso restringido
│   │   ├── page.tsx
│   │   └── login.module.css
│   ├── components/
│   │   ├── DashboardClient.tsx      # Control principal interactivo de la interfaz
│   │   ├── GanttView.tsx            # Renderizado de la cuadrícula Gantt
│   │   ├── FlightModal.tsx          # Formulario para añadir, editar o eliminar vuelos
│   │   ├── GlobalTodayBanner.tsx    # Banner de coordinación operativa diaria y firmas
│   │   ├── CalendarSettingsModal.tsx# Ajustes centralizados del calendario (Zonas, Permisos, Llamadas)
│   │   ├── GlobalHeaderActions.tsx  # Cabecera global para acciones (ej. Gestión de pilotos)
│   │   └── PilotsModal.tsx          # Gestor de base de datos de operadores/pilotos
│   └── lib/
│       └── db.ts              # Cliente singleton de Prisma
├── docker-compose.yml         # Orquestación de contenedores (App y Tailscale VPN)
├── Dockerfile                 # Construcción de la imagen Docker de producción
└── package.json               # Dependencias y scripts de ejecución de Node.js
```

---

## 💻 Desarrollo Local

### 1. Requisitos Previos

Asegúrate de tener instalado:
- **Node.js** (versión 18 o superior recomendada)
- **npm**, **yarn**, **pnpm** o **bun**

### 2. Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto (basado en `.env.example`):

```env
DATABASE_URL="file:../data/database.sqlite"
TS_AUTHKEY="your-tailscale-auth-key-here"
ACCESS_PIN="1234"
```

### 3. Instalar Dependencias y Preparar Base de Datos

```bash
# Instalar dependencias
npm install

# Generar el cliente de Prisma y ejecutar migraciones pendientes (acepta pérdida de datos si hay cambios estructurales fuertes)
npx prisma generate
npx prisma db push --accept-data-loss
```

### 4. Iniciar Servidor de Desarrollo

```bash
npm run dev
```

El servidor estará disponible en [http://localhost:3000](http://localhost:3000).

---

## 🐳 Despliegue en Producción (Docker)

El proyecto incluye un `Dockerfile` de múltiples etapas para optimizar el tamaño y rendimiento en producción.

### Con Docker Compose

Para arrancar todo el ecosistema (aplicación web y túnel Tailscale opcional):

```bash
docker compose up -d --build
```

Esto compilará la aplicación y creará un archivo de base de datos persistido en el volumen `./data`. La aplicación escuchará por defecto en el puerto expuesto de Docker. Si realizas cambios en el esquema de Prisma en producción, recuerda aplicar los cambios a la base de datos dentro del contenedor:

```bash
docker compose run --rm app npx prisma db push --accept-data-loss
```
