import { presupuestosTools, executePresupuestoTool } from './presupuestos'
import { trabajosTools, executeTrabajoTool } from './trabajos'
import { clientesTools, executeClienteTool } from './clientes'
import { materialesTools, executeMaterialTool } from './materiales'
import { gastosTools, executeGastoTool } from './gastos'
import { dashboardTools, executeDashboardTool } from './dashboard'
import { preciosTools, executePreciosTool } from './precios'
import { agendaTools, executeAgendaTool } from './agenda'

export const allTools = [
  ...presupuestosTools,
  ...trabajosTools,
  ...clientesTools,
  ...materialesTools,
  ...gastosTools,
  ...dashboardTools,
  ...preciosTools,
  ...agendaTools,
]

const toolGroups = [
  { names: presupuestosTools.map((t) => t.name), execute: executePresupuestoTool },
  { names: trabajosTools.map((t) => t.name), execute: executeTrabajoTool },
  { names: clientesTools.map((t) => t.name), execute: executeClienteTool },
  { names: materialesTools.map((t) => t.name), execute: executeMaterialTool },
  { names: gastosTools.map((t) => t.name), execute: executeGastoTool },
  { names: dashboardTools.map((t) => t.name), execute: executeDashboardTool },
  { names: preciosTools.map((t) => t.name), execute: executePreciosTool },
  { names: agendaTools.map((t) => t.name), execute: executeAgendaTool },
]

export async function executeTool(name: string, input: any, databaseUrl: string) {
  const group = toolGroups.find((g) => g.names.includes(name))
  if (!group) return { error: `Herramienta desconocida: ${name}` }
  return group.execute(name, input, databaseUrl)
}
