# SP1 Frontend — Angular BPM

Frontend web del sistema BPM (Business Policy Manager).

**Stack:** Angular 21 · TypeScript · PrimeNG 21 · Chart.js · diagram-js · SCSS

**Roles:** Administrador (diseña procesos) · Supervisor (monitorea trámites) · Funcionario (ejecuta tareas)

---

## Requisitos previos

- Node.js 20+
- npm 10+
- Backend corriendo en `http://localhost:8080` (ver README del backend)

---

## Instalación y arranque

### 1. Clonar e instalar dependencias

```bash
git clone <repo-url>
cd sp1-frontend
npm install
```

### 2. Levantar en modo desarrollo

```bash
npm start
# o equivalente:
ng serve
```

Disponible en: `http://localhost:4200`

El servidor se recarga automáticamente al guardar cambios.

---

## Configuración del backend

El archivo `src/environments/environment.ts` apunta al backend:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api',
};
```

Si el backend corre en otro host o puerto, modificar `apiUrl` acá.

---

## Credenciales de prueba

Crear usuarios desde MongoDB Compass o Atlas (ver README del backend). Roles disponibles:

| Rol | Acceso |
|---|---|
| `ADMINISTRADOR` | Todo — diseñador de políticas, usuarios, supervisión, reportes |
| `SUPERVISOR` | Monitor de trámites, métricas, análisis inteligente, reportes |
| `FUNCIONARIO` | Bandeja de tareas, ejecutar y completar formularios |

---

## Módulos del sistema

```
src/app/modules/
├── auth/          → Login
├── modelador/     → Canvas UML para diseñar políticas de negocio
├── motor/         → Bandeja de tareas del funcionario
├── supervisor/    → Monitor, métricas, análisis inteligente
├── documentos/    → Repositorio de documentos con editor colaborativo
├── reportes/      → Chatbot para generar Excel/Word por prompt
└── usuarios/      → CRUD de usuarios y departamentos (solo admin)
```

### Modelador (canvas)

El admin diseña procesos BPM como diagramas UML con swim lanes. Puede crear nodos (inicio, actividad, decisión, fork/join), conectarlos, configurar formularios dinámicos por actividad, y pedirle a la IA que genere el diagrama desde texto. Cuando el diagrama es válido, lo publica para que el motor pueda usarlo.

### Motor (bandeja de tareas)

El funcionario ve las tareas pendientes/activas de su departamento, toma una tarea, completa el formulario y avanza el flujo. El workflow engine en el backend decide el próximo nodo.

### Supervisor

- **Monitor** — lista de trámites activos con filtros por estado y política
- **Métricas** — gráficos de bottlenecks y performance por nodo
- **Análisis Inteligente** — riesgos de demora, anomalías detectadas, priorización de tareas
- **Reportes** — chatbot: describe en texto qué reporte querés y la IA genera un Excel o Word

### Documentos

Árbol jerárquico política → trámite → documentos. Subida con drag & drop, previsualización de PDFs e imágenes inline. Edición colaborativa de Word/Excel via OnlyOffice (requiere el Docker del backend levantado en puerto 8088).

---

## WebSocket en tiempo real

| Canal | Para qué |
|---|---|
| `/ws/canvas/{versionId}` | Varios admins editan el mismo diagrama simultáneamente |
| `/ws/tramites/{tramiteId}` | El supervisor ve cambios de estado del trámite al instante |
| `/ws/tareas/{departamentoId}` | El funcionario recibe notificación cuando le asignan una tarea |

---

## Build de producción

```bash
ng build --configuration=production
# Archivos en: dist/sp1-frontend/browser/
```

Para servir el build localmente:

```bash
npx http-server dist/sp1-frontend/browser -p 4200
```

---

## Estructura de carpetas

```
src/app/
├── core/
│   ├── auth/           → AuthService, guards, JWT en localStorage
│   ├── interceptors/   → Agrega Bearer token a cada request + manejo de errores HTTP
│   └── services/       → WebSocket, MIRA, Reporte (servicios de infraestructura)
├── layout/
│   ├── header/         → Navbar con usuario y notificaciones
│   └── sidebar/        → Menú lateral filtrado por rol del usuario
├── modules/            → Módulos lazy-loaded (un chunk JS por módulo)
└── shared/
    ├── components/     → Badge, pipes, componentes reutilizables
    ├── models/         → Interfaces TypeScript (Tramite, Task, Politica, etc.)
    └── pipes/          → Pipes de estado, prioridad y formato
```
