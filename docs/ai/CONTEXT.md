# CONTEXT.md — NZ Soluciones
_Última actualización: 2026-07-21_

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
| IA chat | Gemini 3.6 Flash (`generateContent`) vía REST |
| IA voz | Gemini 2.5 Flash Native Audio Preview (`BidiGenerateContent`) vía WebSocket, autenticado con token en query string |
| Push | Web Push API, claves VAPID propias, `@pushforge/builder` |
| Testing | Vitest en ambos paquetes; frontend con Testing Library + jsdom |
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
│   │   ├── estados.js       — ESTADOS_TRABAJO / ESTADOS_TRABAJO_ABIERTOS (fuente única del pipeline de estados)
│   │   └── push.js          — activarNotificaciones() con Web Push API
│   ├── hooks/
│   │   └── useVozLive.js    — WebSocket a /api/voz (con token), captura mic, reproduce PCM de Gemini, expone estado `error` con timeout de conexión (12s)
│   ├── components/
│   │   ├── Navbar.jsx               — Navbar agrupada: Trabajos / Clientes / Agenda / Herramientas▾ (Cielorraso, Presupuesto libre, Materiales)
│   │   ├── AsistenteWidget.jsx      — Widget de chat flotante + modo voz
│   │   ├── GuardarPresupuestoModal.jsx — Modal único de "guardar presupuesto" (cliente/trabajo existente o nuevo), usado por Calculator y PresupuestoLibrePage
│   │   ├── ProtectedRoute.jsx
│   │   └── ConfirmModal.jsx
│   ├── setupTests.js        — jest-dom para Vitest+RTL
│   └── pages/               — Una page por sección (ver rutas abajo)

backend/ (Cloudflare Worker, Hono)
├── src/
│   ├── index.ts             — App Hono, monta todas las rutas, expone scheduled hook
│   ├── types.ts             — Bindings (env vars del Worker)
│   ├── materiales.ts        — Lógica de cálculo de materiales, recomendadores de masilla/cinta
│   ├── push.ts              — enviarPushATodos() — itera suscripciones y envía notifs
│   ├── scheduled.ts         — Cron: recordatorio día siguiente + alerta trabajos vencidos (cada bloque con try/catch propio)
│   ├── middleware/auth.ts   — requireAuth (header) + verifyAuthToken() extraída y reusable (también la usa la ruta de voz, con token por query string)
│   ├── routes/              — Un archivo por recurso (incluye agenda.ts, flujoCompleto.ts)
│   └── tools/               — Herramientas para Gemini (chat + voz comparten el mismo set; incluye agenda.ts, flujoCompleto.ts)
```

**`landing/`**: sitio estático de marketing (landing page pública de NZ Soluciones), separado de `calculadoras/` y `backend/`, deployado también vía Firebase Hosting.

**Flujo auth:** El frontend usa BetterAuth/Neon para sign-in. Cada request al backend lleva `Authorization: Bearer <token>`. El middleware verifica el JWT contra el JWKS de Neon y luego chequea que el email esté en `allowed_emails`. La ruta de voz (WebSocket) no puede usar ese header porque el navegador no manda headers custom en el handshake: el token viaja por query string y pasa por la misma `verifyAuthToken()` antes de aceptar el upgrade.

**Flujo asistente (chat):** POST /api/asistente → guarda mensaje en BD → llama Gemini con historial + tools → loop de function calling (max 5 vueltas, con try/catch alrededor para no romper la respuesta si algo falla a mitad de camino) → guarda respuesta → devuelve texto.

**Flujo asistente (voz):** GET /api/voz (valida token por query string, upgrade a WS) → Worker abre WS saliente a Gemini Live → bidireccional: mic del browser → Gemini → audio PCM de vuelta. Cuando Gemini llama a `ver_trabajo`, el Worker manda un evento `nzEvento` al frontend para mostrar tarjetas en pantalla.

**Flujo "todo en uno" (crear_flujo_completo):** tanto el asistente (chat/voz) como el frontend web (`GuardarPresupuestoModal` → `POST /api/flujo-completo`) pueden crear cliente + trabajo + presupuesto + agenda en una sola sentencia SQL atómica con CTEs encadenados. Ver detalle en Decisiones de diseño.

## Rutas del frontend

| Path | Componente | Descripción |
|---|---|---|
| `/login` | LoginPage | Sin navbar |
| `/` | DashboardPage | Resumen KPIs, chart por estado, próximos trabajos |
| `/cielorraso` | CielorrasoPage | Calculadora de materiales cielorraso |
| `/tabique` | TabiquePage | Calculadora de materiales tabique (placeholder, no linkeada desde el navbar) |
| `/presupuesto` | PresupuestoPage | Vista previa para imprimir (no linkeada desde el navbar, se llega vía botón "Vista previa" del Calculator) |
| `/presupuesto-libre` | PresupuestoLibrePage | Presupuesto libre (items manuales) |
| `/trabajos` | TrabajosPage | Lista de trabajos, con buscador de clientes al crear uno nuevo |
| `/trabajos/:id` | TrabajoDetallePage | Detalle, presupuestos, gastos, estado; link a la ficha del cliente |
| `/presupuestos/:id` | PresupuestoDetallePage | Vista de presupuesto guardado |
| `/clientes` | ClientesPage | Lista de clientes |
| `/clientes/:id` | ClienteDetallePage | Historial de trabajos del cliente; botón "+ Nuevo trabajo" (preselecciona el cliente en TrabajosPage) |
| `/agenda` | AgendaPage | Calendario mensual + ítems de agenda por día (alta/borrado, con hora y trabajo asociado opcional) |
| `/admin/materiales` | MaterialesAdminPage | ABM de materiales, precios y ratios por m² |

`HomePage` y `AsistentePage` se eliminaron (código muerto, no tenían ruta activa).

## API del backend

| Método | Path | Descripción |
|---|---|---|
| GET | `/api/me` | Datos del usuario autenticado |
| POST | `/api/presupuesto` | Cálculo de presupuesto sin guardar (preview, stateless) |
| GET/PUT | `/api/settings/:key` | Configuración clave-valor (ej: precio mano de obra) |
| GET/POST/PATCH/DELETE | `/api/materials/:category[/:id]` | Materiales por categoría (incluye `price`) |
| GET/POST/PATCH | `/api/trabajos[/:id]` | CRUD trabajos |
| GET/POST/PATCH | `/api/presupuestos[/:id]` | CRUD presupuestos |
| POST | `/api/presupuestos/:id/enviar` | Marca enviado, cambia estado trabajo |
| GET/POST/PATCH/DELETE | `/api/clientes[/:id]` | CRUD clientes |
| GET | `/api/gastos/trabajo/:id` | Gastos de un trabajo |
| POST/DELETE | `/api/gastos[/:id]` | Crear/borrar gasto |
| GET | `/api/dashboard` | KPIs: pendientes, próximos, ganancia neta, estados |
| GET/POST/DELETE | `/api/asistente[/historial][/nueva]` | Historial y envío al asistente IA |
| GET | `/api/agenda/mes/:year/:month` | Ítems de agenda de un mes (para pintar el calendario) |
| GET/POST | `/api/agenda[/:fecha]` | Listar ítems de un día / crear ítem de agenda |
| PATCH/DELETE | `/api/agenda/:id` | Actualizar/borrar un ítem de agenda puntual |
| POST | `/api/flujo-completo` | Crea, atómicamente, cualquier combinación de cliente+trabajo+presupuesto+agenda en un solo request |
| GET | `/api/push/vapid-public-key` | Clave pública VAPID |
| POST | `/api/push/suscribir` | Registrar suscripción push |
| WS | `/api/voz?token=...` | WebSocket de voz en tiempo real (Gemini Live), token de auth por query string |
| GET/POST | `/api/precios/buscar`, `/api/precios` | Historial de precios de items |

## Estructura de la Base de Datos

_Inferida del código (no existe `db_schema_dump.sql` aún). Pedile a Juanma que genere el dump desde pgAdmin y lo guarde en `docs/ai/db_schema_dump.sql` para tener la fuente de verdad — esta sección puede tener detalles menores desactualizados hasta entonces._

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
| category | text | cielorraso / tabique / libre |
| m2 | numeric | 0 para presupuestos "libre" |
| waste | numeric | decimal, ej: 0.10 (0 para "libre") |
| materials | jsonb | array de materiales calculados con qty y recommendations, o ítems armados a mano si category = libre |
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
| price | numeric | **nueva columna** — precio unitario, default global del catálogo (antes vivía solo en localStorage del navegador) |

### agenda_items
| Columna | Tipo | Notas |
|---|---|---|
| id | serial | PK |
| fecha | date | NOT NULL — puede haber varios ítems por fecha |
| hora | text | nullable, formato HH:MM validado en backend |
| texto | text | NOT NULL |
| trabajo_id | int | FK → trabajos.id, nullable |
| created_at | timestamptz | usada para ordenar ítems sin hora |

**Reemplaza a la vieja tabla `notas_agenda`** (una nota de texto por día, fecha UNIQUE). El modelo nuevo permite múltiples anotaciones por día, cada una con hora opcional y trabajo asociado opcional. `notas_agenda` ya no se usa en el código (rutas y tools `notas.ts` borrados).

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
- **Estados del trabajo como pipeline unidireccional** (a grandes rasgos): evaluado → cotizado → enviado → aceptado → por_cobrar → cobrado. Fuente única en `calculadoras/src/lib/estados.js` (`ESTADOS_TRABAJO` / `ESTADOS_TRABAJO_ABIERTOS`). Las transiciones automáticas las maneja el backend: crear presupuesto avanza de evaluado a cotizado; marcar enviado avanza a enviado.
- **Asistente IA con tools compartidas entre chat y voz**: el mismo `allTools` se pasa a Gemini en ambos modos. Los tools viven en `backend/src/tools/` separados por dominio.
- **Gemini no recibe IDs de Nico**: el system prompt instruye explícitamente al asistente a resolver IDs usando las tools de búsqueda, nunca pidiéndole al usuario que los escriba.
- **Tools destructivos sin restricción adicional en modo voz**: es decisión de producto deliberada — el dueño quiere control total por voz, incluso para acciones como `borrar_cliente`. Solo se le pide confirmación conversacional antes de ejecutar, no hay un gate técnico extra.
- **Modo voz con tarjetas en pantalla**: cuando Gemini llama a `ver_trabajo` en el WebSocket, el Worker inyecta un mensaje `nzEvento` extra al cliente React, que lo renderiza como tarjeta clicable — la respuesta de voz y la UI se sincronizan sin estado compartido.
- **Auth de la ruta de voz vía query string**: el WebSocket del navegador no puede mandar headers custom en el handshake, así que `verifyAuthToken()` (extraída de `requireAuth`) se llama también ahí, pero leyendo el token de `?token=` en vez de `Authorization`.
- **`crear_flujo_completo` con CTEs encadenados, no `sql.transaction()`**: el driver `@neondatabase/serverless` es HTTP-based (sin conexión TCP persistente); su `.transaction()` arma todas las queries en JS antes de ejecutar la primera, así que no puede tomar un id generado por `RETURNING` de una query y usarlo en la siguiente dentro de la misma llamada. La solución es una única sentencia `WITH ... AS (INSERT ... RETURNING ...), ...` con CTEs encadenados: atómica por definición en Postgres (si algo falla, se revierte todo), sin BEGIN/COMMIT manual. Cliente, trabajo, presupuesto y agenda son todos opcionales e independientes entre sí en el input; solo se ejecuta lo que tenga datos.
- **`crear_flujo_completo` soporta categoría "libre"**: para el caso del frontend web (presupuesto libre / items manuales), recibe `materials`+`total` ya armados y los guarda tal cual, sin recalcular contra el catálogo (a diferencia de categoria cielorraso/tabique, que sí dispara `calcularPresupuestoCore`).
- **Cálculo de materiales en el backend**: la lógica de `perM2`, redondeo y recomendadores de baldes/rollos vive en `materiales.ts`. `calcularPresupuestoCore()` (extraída en `tools/presupuestos.ts`) es compartida por el tool suelto `calcular_presupuesto` y por `crear_flujo_completo`, para no duplicar la lógica.
- **Precio de materiales persistente en `materials.price`** (ya no en localStorage): el Calculator tiene override en memoria por cálculo puntual, con un botón "💾 Catálogo" para persistir ese valor como default global. Se trackea con dos estados separados (`prices` = valor actual editado, `catalogPrices` = último valor confirmado guardado) para saber cuándo mostrar el botón sin depender de un refetch del prop original.
- **No hay ORM**: queries con template literals de `@neondatabase/serverless` (`sql\`...\``). Updates dinámicos usan `sql.query()` con placeholders `$N` para construir el SET dinámicamente. Las queries dinámicas de `crear_flujo_completo` arman placeholders con un helper `ph()` que empuja a un array de params compartido.
- **`materials` en presupuestos es JSONB**: guarda el snapshot completo de materiales+cantidades al momento de presupuestar, no referencias. Así el precio no cambia si después se edita un material.
- **Agenda con múltiples ítems por día**: reemplaza el modelo viejo de "una nota de texto por día" (`notas_agenda`, fecha UNIQUE). Ahora se puede llamar `crear_agenda_item` varias veces para el mismo día; cada ítem tiene hora opcional y trabajo asociado opcional. Sin edición inline en la UI por ahora (solo alta/borrado) — simplificación consciente.
- **`GuardarPresupuestoModal` unifica el flujo de guardado**: antes estaba duplicado en `Calculator.jsx` y `PresupuestoLibrePage.jsx` (cada uno con su propio modal y su propia secuencia de 3 llamadas no atómicas createCliente→createTrabajo→createPresupuesto). Ahora ambos usan el mismo componente, que llama a `POST /api/flujo-completo` en una sola request atómica.

## Estado actual

**En producción:**
- Calculadoras de cielorraso y tabique
- Gestión completa de trabajos, clientes, presupuestos y gastos, con links cruzados trabajo↔cliente
- Presupuesto libre (PresupuestoLibrePage): items manuales, guarda vía `GuardarPresupuestoModal` → `/api/flujo-completo`
- Dashboard con KPIs y gráfico de estados
- Agenda con calendario mensual y múltiples ítems por día (hora + trabajo asociado opcional)
- Precio de materiales persistente en el catálogo (`materials.price`), editable desde el Calculator o desde MaterialesAdminPage
- Asistente IA (chat texto + modo voz en tiempo real), con tool combinado `crear_flujo_completo` para pedidos multi-paso
- PWA instalable (manifest + service worker)
- Push notifications con cron de recordatorios diarios (ahora con try/catch por bloque, para que un fallo en un chequeo no tumbe el otro)
- Tests: Vitest en frontend (7 tests: ProtectedRoute + apiFetch) y backend (5 tests: verifyAuthToken + gate de auth de voz.ts)

**Pendiente / en progreso:**
- `precios_items` / `/api/precios`: ruta y tools creadas, pero no hay UI dedicada aún (el asistente puede usarlo por voz)
- Orquestación de IA con `crear_flujo_completo`: implementado y funcionando en al menos un caso de prueba real, pero no hay validación exhaustiva de que Gemini elija bien entre el tool combinado y los tools sueltos en todos los casos

**Deuda técnica conocida:**
- `useVozLive.js` usa `ScriptProcessorNode` (deprecado); hay un comentario interno indicando migrar a AudioWorklet si aparecen glitches
- No existe dump de schema en `docs/ai/db_schema_dump.sql`; el esquema de este documento fue inferido del código
- Cobertura de tests todavía parcial (7 frontend + 5 backend) — no cubre rutas CRUD, tools del asistente, ni `crear_flujo_completo`
- El modelo de voz (`gemini-2.5-flash-native-audio-preview-09-2025`) sigue con el string hardcodeado: a diferencia del modelo de texto (confirmado y corregido a `gemini-3.6-flash`), no se pudo confirmar con certeza si este nombre de la Live API sigue vigente. Probarlo en una llamada real tras el próximo deploy.
- `AgendaPage.jsx` no tiene edición inline de ítems de agenda (solo alta/borrado) — simplificación consciente, no un bug

## Convenciones del proyecto

- **Español rioplatense** en UI, comentarios del código y mensajes del asistente
- Todos los handlers de rutas: `requireAuth` antes de la lógica, respuesta siempre con `{ ok: true, ... }` o `{ error: '...' }`
- Colores de tema en Tailwind con tokens `nz-*` (`nz-bg`, `nz-surface`, `nz-green`, `nz-border`, `nz-text`, `nz-text2`, `nz-green-glow`)
- Estados de trabajos: siempre snake_case (`por_cobrar`, no `porCobrar`), importados de `lib/estados.js`, nunca hardcodeados de nuevo en cada página
- Nuevas rutas del backend: crear archivo en `backend/src/routes/`, montarlo en `index.ts` con `app.route()`
- Nuevos tools del asistente: crear en `backend/src/tools/`, exportar array de definiciones y función `execute*`, registrar en `tools/index.ts`
- El frontend consume `VITE_BACKEND_URL` para todas las llamadas; no hay calls directas a Neon desde el cliente
- Tests: `*.test.ts`/`*.test.jsx` al lado del archivo que testean, corridos con `npm test` (vitest run) en cada paquete por separado
