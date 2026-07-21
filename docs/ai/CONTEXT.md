# CONTEXT.md — NZ Soluciones
_Última actualización: 2026-07-17_

## Qué es esto
App de gestión interna para NZ Soluciones, empresa de construcción en seco y mantenimiento (dueño: Nico Zarate). Permite calcular materiales, armar presupuestos, gestionar trabajos y clientes, y tiene un asistente IA integrado con voz.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 19, React Router 7, Tailwind CSS v4, Recharts, Vite 8, PWA (vite-plugin-pwa) |
| Auth frontend | `@neondatabase/neon-js` (BetterAuth) — `VITE_NEON_AUTH_URL` |
| Backend | Hono 4 sobre Cloudflare Workers, TypeScript |
| Base de datos | Neon (PostgreSQL serverless) via `@neondatabase/serverless` |
| Auth backend | JWT verificado con JWKS de Neon (`jose`), tabla `allowed_emails` como whitelist |
| IA chat | Gemini 2.5 Flash (`generateContent`) vía REST |
| IA voz | Gemini 2.5 Flash Native Audio Preview (`BidiGenerateContent`) vía WebSocket |
| Push | Web Push API, claves VAPID propias, `@pushforge/builder` |
| Deploy frontend | Firebase Hosting (`nz-soluciones-calc.web.app`) |
| Deploy backend | Cloudflare Workers (`wrangler deploy`) |
| Scheduled | Cloudflare Workers Cron — chequeos diarios de recordatorios |

## Arquitectura

```
calculadoras/ (frontend React/Vite)
├── src/
│   ├── App.jsx              — Router raíz con todas las rutas protegidas
│   ├── lib/
│   │   ├── api.js           — Todas las llamadas al backend (fetch + Bearer token)
│   │   ├── auth.ts          — authClient (BetterAuth/Neon)
│   │   └── push.js          — activarNotificaciones() con Web Push API
│   ├── hooks/
│   │   └── useVozLive.js    — WebSocket a /api/voz, captura mic, reproduce PCM de Gemini
│   ├── components/
│   │   ├── Navbar.jsx       — Navbar con dropdowns (desktop) y hamburguesa (mobile)
│   │   ├── AsistenteWidget.jsx — Widget de chat flotante + modo voz
│   │   ├── ProtectedRoute.jsx
│   │   └── ConfirmModal.jsx
│   └── pages/               — Una page por sección (ver rutas abajo)

backend/ (Cloudflare Worker, Hono)
├── src/
│   ├── index.ts             — App Hono, monta todas las rutas, expone scheduled hook
│   ├── types.ts             — Bindings (env vars del Worker)
│   ├── materiales.ts        — Lógica de cálculo de materiales, recomendadores de masilla/cinta
│   ├── push.ts              — enviarPushATodos() — itera suscripciones y envía notifs
│   ├── scheduled.ts         — Cron: recordatorio día siguiente + alerta trabajos vencidos
│   ├── middleware/auth.ts   — requireAuth: verifica JWT Neon + whitelist allowed_emails
│   ├── routes/              — Un archivo por recurso
│   └── tools/               — Herramientas para Gemini (chat + voz comparten el mismo set)
```

**`landing/`**: sitio estático de marketing (landing page pública de NZ Soluciones), separado de `calculadoras/` y `backend/`, deployado también vía Firebase Hosting.

**Flujo auth:** El frontend usa BetterAuth/Neon para sign-in. Cada request al backend lleva `Authorization: Bearer <token>`. El middleware verifica el JWT contra el JWKS de Neon y luego chequea que el email esté en `allowed_emails`.

**Flujo asistente (chat):** POST /api/asistente → guarda mensaje en BD → llama Gemini con historial + tools → loop de function calling (max 5 vueltas) → guarda respuesta → devuelve texto.

**Flujo asistente (voz):** GET /api/voz (upgrade a WS) → Worker abre WS saliente a Gemini Live → bidireccional: mic del browser → Gemini → audio PCM de vuelta. Cuando Gemini llama a `ver_trabajo`, el Worker manda un evento `nzEvento` al frontend para mostrar tarjetas en pantalla.

## Rutas del frontend

| Path | Componente | Descripción |
|---|---|---|
| `/login` | LoginPage | Sin navbar |
| `/` | DashboardPage | Resumen KPIs, chart por estado, próximos trabajos |
| `/cielorraso` | CielorrasoPage | Calculadora de materiales cielorraso |
| `/tabique` | TabiquePage | Calculadora de materiales tabique |
| `/presupuesto` | PresupuestoPage | Presupuesto guiado (usa calculadoras) |
| `/presupuesto-libre` | PresupuestoLibrePage | Presupuesto libre (items manuales) |
| `/trabajos` | TrabajosPage | Lista de trabajos |
| `/trabajos/:id` | TrabajoDetallePage | Detalle, presupuestos, gastos, estado |
| `/presupuestos/:id` | PresupuestoDetallePage | Vista de presupuesto guardado |
| `/clientes` | ClientesPage | Lista de clientes |
| `/clientes/:id` | ClienteDetallePage | Historial de trabajos del cliente |
| `/agenda` | AgendaPage | Calendario mensual + notas por día |
| `/admin/materiales` | MaterialesAdminPage | ABM de materiales y precios |

## API del backend

| Método | Path | Descripción |
|---|---|---|
| GET | `/api/me` | Datos del usuario autenticado |
| POST | `/api/presupuesto` | Cálculo de presupuesto sin guardar (preview, stateless) |
| GET/PUT | `/api/settings/:key` | Configuración clave-valor (ej: precio mano de obra) |
| GET/POST/PATCH/DELETE | `/api/materials/:category[/:id]` | Materiales por categoría |
| GET/POST/PATCH | `/api/trabajos[/:id]` | CRUD trabajos |
| GET/POST/PATCH | `/api/presupuestos[/:id]` | CRUD presupuestos |
| POST | `/api/presupuestos/:id/enviar` | Marca enviado, cambia estado trabajo |
| GET/POST/PATCH/DELETE | `/api/clientes[/:id]` | CRUD clientes |
| GET | `/api/gastos/trabajo/:id` | Gastos de un trabajo |
| POST/DELETE | `/api/gastos[/:id]` | Crear/borrar gasto |
| GET | `/api/dashboard` | KPIs: pendientes, próximos, ganancia neta, estados |
| GET/POST/DELETE | `/api/asistente[/historial][/nueva]` | Historial y envío al asistente IA |
| GET/POST | `/api/notas/mes/:y/:m`, `/api/notas/:fecha` | Notas de agenda |
| GET | `/api/push/vapid-public-key` | Clave pública VAPID |
| POST | `/api/push/suscribir` | Registrar suscripción push |
| WS | `/api/voz` | WebSocket de voz en tiempo real (Gemini Live) |
| GET/POST | `/api/precios/buscar`, `/api/precios` | Historial de precios de items |

## Estructura de la Base de Datos

_Inferida del código (no existe db_schema_dump.sql aún). Pedile a Juanma que genere el dump desde pgAdmin y lo guarde en `docs/ai/db_schema_dump.sql` para tener la fuente de verdad._

### clientes
| Columna | Tipo | Notas |
|---|---|---|
| id | serial | PK |
| nombre | text | NOT NULL |
| telefono | text | nullable |
| email | text | nullable |
| direccion | text | nullable |

### trabajos
| Columna | Tipo | Notas |
|---|---|---|
| id | serial | PK |
| cliente_id | int | FK → clientes.id |
| descripcion | text | nullable |
| estado | text | evaluado / cotizado / enviado / aceptado / por_cobrar / cobrado / rechazado |
| fecha_trabajo | date | nullable |
| forma_pago | text | efectivo / transferencia / mercadopago |
| monto_cobrado | numeric | nullable |
| sena_pagada | boolean | nullable |
| created_at | timestamptz | default NOW() |
| updated_at | timestamptz | default NOW() |

### presupuestos
| Columna | Tipo | Notas |
|---|---|---|
| id | serial | PK |
| trabajo_id | int | FK → trabajos.id |
| category | text | cielorraso / tabique |
| m2 | numeric | |
| waste | numeric | decimal, ej: 0.10 |
| materials | jsonb | array de materiales calculados con qty y recommendations |
| total | numeric | |
| enviado_at | timestamptz | nullable; se llena al marcar enviado |
| created_at | timestamptz | |

### gastos
| Columna | Tipo | Notas |
|---|---|---|
| id | serial | PK |
| trabajo_id | int | FK → trabajos.id |
| concepto | text | NOT NULL |
| monto | numeric | NOT NULL |
| categoria | text | nullable |
| created_at | timestamptz | |

### materials
| Columna | Tipo | Notas |
|---|---|---|
| id | text | PK (slug, ej: "masilla") |
| category | text | PK compuesta con id (cielorraso / tabique) |
| name | text | |
| unit | text | ud / kg / mt / etc. |
| color | text | hex para UI |
| per_m2 | numeric | cantidad por m2 |
| round_type | text | ceil / decimal |
| sort_order | int | orden en pantalla |

### settings
| Columna | Tipo | Notas |
|---|---|---|
| key | text | PK |
| value | text | |

### conversaciones
| Columna | Tipo | Notas |
|---|---|---|
| id | serial | PK |
| created_at | timestamptz | |

### mensajes
| Columna | Tipo | Notas |
|---|---|---|
| id | serial | PK |
| conversacion_id | int | FK → conversaciones.id |
| rol | text | usuario / asistente |
| contenido | text | |
| created_at | timestamptz | |

### notas_agenda
| Columna | Tipo | Notas |
|---|---|---|
| id | serial | PK |
| fecha | date | UNIQUE |
| nota | text | |
| updated_at | timestamptz | |

### push_subscriptions
| Columna | Tipo | Notas |
|---|---|---|
| id | serial | PK |
| endpoint | text | UNIQUE |
| p256dh | text | |
| auth | text | |

### allowed_emails
| Columna | Tipo | Notas |
|---|---|---|
| email | text | PK — whitelist de acceso |

### precios_items
| Columna | Tipo | Notas |
|---|---|---|
| id | serial | PK |
| descripcion | text | UNIQUE (case-insensitive en búsquedas) |
| ultimo_precio | numeric | |
| updated_at | timestamptz | |

## Decisiones de diseño relevantes

- **Un solo usuario activo** (Nico). La auth es whitelist por email, no hay roles ni multi-tenant.
- **Estados del trabajo como pipeline unidireccional** (a grandes rasgos): evaluado → cotizado → enviado → aceptado → por_cobrar → cobrado. Las transiciones automáticas las maneja el backend: crear presupuesto avanza de evaluado a cotizado; marcar enviado avanza a enviado.
- **Asistente IA con tools compartidas entre chat y voz**: el mismo `allTools` se pasa a Gemini en ambos modos. Los tools viven en `backend/src/tools/` separados por dominio.
- **Gemini no recibe IDs de Nico**: el system prompt instruye explícitamente al asistente a resolver IDs usando las tools de búsqueda, nunca pidiéndole al usuario que los escriba.
- **Modo voz con tarjetas en pantalla**: cuando Gemini llama a `ver_trabajo` en el WebSocket, el Worker inyecta un mensaje `nzEvento` extra al cliente React, que lo renderiza como tarjeta clicable — la respuesta de voz y la UI se sincronizan sin estado compartido.
- **Cálculo de materiales en el backend**: la lógica de `perM2`, redondeo y recomendadores de baldes/rollos vive en `materiales.ts` y es llamada tanto desde las routes REST como desde los tools del asistente.
- **No hay ORM**: queries con template literals de `@neondatabase/serverless` (`sql\`...\``). Updates dinámicos usan `sql.query()` con placeholders `$N` para construir el SET dinámicamente.
- **`materials` en presupuestos es JSONB**: guarda el snapshot completo de materiales+cantidades al momento de presupuestar, no referencias. Así el precio no cambia si después se edita un material.

## Estado actual

**En producción:**
- Calculadoras de cielorraso y tabique
- Gestión completa de trabajos, clientes, presupuestos y gastos
- Presupuesto libre (PresupuestoLibrePage): items manuales, crea cliente/trabajo/presupuesto vía API
- Dashboard con KPIs y gráfico de estados
- Agenda con calendario mensual y notas por día
- Asistente IA (chat texto + modo voz en tiempo real)
- PWA instalable (manifest + service worker)
- Push notifications con cron de recordatorios diarios

**Pendiente / en progreso:**
- `precios_items` / `/api/precios`: ruta y tools creadas, pero no hay UI dedicada aún (el asistente puede usarlo por voz)
- El modelo de voz (`gemini-2.5-flash-native-audio-preview-09-2025`) tiene el string hardcodeado con comentario de que cambia seguido — verificar contra docs de Google antes de probar

**Deuda técnica conocida:**
- `useVozLive.js` usa `ScriptProcessorNode` (deprecado); hay un comentario interno indicando migrar a AudioWorklet si aparecen glitches
- No existe dump de schema en `docs/ai/db_schema_dump.sql`; el esquema de este documento fue inferido del código

## Convenciones del proyecto

- **Español rioplatense** en UI, comentarios del código y mensajes del asistente
- Todos los handlers de rutas: `requireAuth` antes de la lógica, respuesta siempre con `{ ok: true, ... }` o `{ error: '...' }`
- Colores de tema en Tailwind con tokens `nz-*` (`nz-bg`, `nz-surface`, `nz-green`, `nz-border`, `nz-text`, `nz-text2`, `nz-green-glow`)
- Estados de trabajos: siempre snake_case (`por_cobrar`, no `porCobrar`)
- Nuevas rutas del backend: crear archivo en `backend/src/routes/`, montarlo en `index.ts` con `app.route()`
- Nuevos tools del asistente: crear en `backend/src/tools/`, exportar array de definiciones y función `execute*`, registrar en `tools/index.ts`
- El frontend consume `VITE_BACKEND_URL` para todas las llamadas; no hay calls directas a Neon desde el cliente
