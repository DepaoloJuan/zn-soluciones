import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { Bindings } from './types'
import me from './routes/me'
import presupuesto from './routes/presupuesto'
import materialesRoutes from './routes/materiales'
import settingsRoutes from './routes/settings'
import trabajosRoutes from './routes/trabajos'
import presupuestosRoutes from './routes/presupuestos'
import clientesRoutes from './routes/clientes'
import gastosRoutes from './routes/gastos'
import archivosRoutes from './routes/archivos'
import dashboardRoutes from './routes/dashboard'
import asistenteRoutes from './routes/asistente'
import preciosRoutes from './routes/precios'
import agendaRoutes from './routes/agenda'
import pushRoutes from './routes/push'
import vozRoutes from './routes/voz'
import flujoCompletoRoutes from './routes/flujoCompleto'
import { runScheduledChecks } from './scheduled'

const app = new Hono<{ Bindings: Bindings }>()

app.use('/api/*', cors({
  origin: ['http://localhost:5173', 'http://localhost:4173', 'https://nz-soluciones-calc.web.app'],
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}))

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.route('/api/me', me)

app.route('/api/presupuesto', presupuesto)

app.route('/api/materials', materialesRoutes)

app.route('/api/settings', settingsRoutes)

app.route('/api/trabajos', trabajosRoutes)

app.route('/api/presupuestos', presupuestosRoutes)

app.route('/api/clientes', clientesRoutes)

app.route('/api/gastos', gastosRoutes)

app.route('/api/archivos', archivosRoutes)

app.route('/api/dashboard', dashboardRoutes)

app.route('/api/asistente', asistenteRoutes)

app.route('/api/precios', preciosRoutes)

app.route('/api/agenda', agendaRoutes)

app.route('/api/push', pushRoutes)

app.route('/api/voz', vozRoutes)

app.route('/api/flujo-completo', flujoCompletoRoutes)

export default {
  fetch: app.fetch,
  scheduled: async (event: ScheduledEvent, env: Bindings) => {
    await runScheduledChecks(env)
  },
}
