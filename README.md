# Coordinación TSA - Calendario de Operaciones de Vuelo

Este es un sistema web interactivo diseñado para la gestión, visualización y coordinación de operaciones de vuelo en zonas segregadas temporalmente (TSA). La aplicación permite planificar vuelos, evitar colisiones horarias y gestionar múltiples calendarios y zonas de manera eficiente.

## 🚀 Características Principales

- **Gestión de Calendarios**: Creación, renombrado y eliminación de calendarios independientes (por ejemplo, mensuales o anuales).
- **Vista de Gantt Interactiva**:
  - Visualización en modo **Semanal** o **Mensual**.
  - Navegación temporal sencilla (Anterior, Hoy, Siguiente).
  - Haz clic en cualquier celda para añadir una nueva operación en la fecha y zona correspondientes.
- **Gestor de Zonas de Vuelo**: Añade, edita y elimina zonas de vuelo personalizadas para cada calendario.
- **Formulario de Operaciones (Vuelos)**:
  - Información detallada: operador, fechas y horas de inicio y fin, notas sobre la situación actual.
  - Selección de estado de coordinación: **Confirmado**, **Pendiente** o **Anulada**.
- **Sistema de Advertencia de Colisiones**: Detección en tiempo real de solapamientos horarios y espaciales entre dos vuelos activos en la misma zona de vuelo.
- **Diseño Ultra Responsivo**: Interfaz optimizada con CSS puro y media queries para una experiencia excelente en teléfonos móviles, tablets y ordenadores.

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
│   └── schema.prisma          # Definición de modelos (Calendar, Zone, Flight)
├── src/
│   ├── app/
│   │   ├── actions.ts         # Server Actions de Next.js para base de datos (Prisma CRUD)
│   │   ├── globals.css        # Estilos globales y variables de diseño
│   │   ├── layout.tsx         # Diseño estructural raíz (Fuentes Outfit/Geist)
│   │   ├── page.tsx           # Página principal del dashboard (Server Component)
│   │   └── page.module.css    # Estilos específicos de la página de inicio
│   ├── components/
│   │   ├── CalendarCreator.tsx  # Modal para creación de calendarios y zonas iniciales
│   │   ├── CollisionWarnings.tsx # Lógica de detección de colisiones de vuelo
│   │   ├── DashboardClient.tsx  # Control de pestañas y selección de calendario activo
│   │   ├── FlightModal.tsx      # Formulario para añadir, editar o eliminar vuelos
│   │   ├── FlightTable.tsx      # Listado de vuelos en formato tabla clásica
│   │   ├── GanttView.tsx        # Renderizado de la cuadrícula Gantt
│   │   └── ZoneManagerModal.tsx # Dialogo para añadir o cambiar nombres de zonas
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

Crea un archivo `.env` en la raíz del proyecto (basado en `.env` actual):

```env
DATABASE_URL="file:../data/database.sqlite"
```

### 3. Instalar Dependencias y Preparar Base de Datos

```bash
# Instalar dependencias
npm install

# Generar el cliente de Prisma y ejecutar migraciones pendientes
npx prisma generate
npx prisma db push
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

Esto compilará la aplicación y creará un archivo de base de datos persistido en el volumen `./data`. La aplicación escuchará por defecto en el puerto expuesto de Docker (o mediante la red segura de Tailscale configurada en `serve.json`).
