import { authClient } from './auth'

const BASE_URL = import.meta.env.VITE_BACKEND_URL

async function getAuthToken() {
  const { data } = await authClient.getSession()
  const token = data?.session?.token

  if (!token) {
    throw new Error('No se pudo obtener la sesión. Volvé a iniciar sesión.')
  }

  return token
}

async function apiFetch(path, options = {}) {
  const token = await getAuthToken()

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  const body = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new Error(body.error || 'Error en la petición')
  }

  return body
}

// Para subir archivos (FormData): no forzamos Content-Type, el browser arma
// el boundary del multipart solo si no lo pisamos nosotros.
async function apiUploadFile(path, formData) {
  const token = await getAuthToken()

  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  })

  const body = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new Error(body.error || 'Error en la petición')
  }

  return body
}

// Descarga autenticada: el endpoint requiere el header Authorization, así que
// no puede ser un <a href> directo. Trae el archivo como blob y devuelve una
// URL temporal (revocarla con URL.revokeObjectURL después de usarla).
export async function descargarArchivo(id) {
  const token = await getAuthToken()

  const res = await fetch(`${BASE_URL}/api/archivos/${id}/descargar`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || 'No se pudo descargar el archivo')
  }

  const disposition = res.headers.get('Content-Disposition') || ''
  const match = disposition.match(/filename="(.+)"/)
  const nombre = match ? match[1] : `archivo-${id}`

  const blob = await res.blob()
  return { url: URL.createObjectURL(blob), nombre }
}

export function getArchivosTrabajo(trabajoId) {
  return apiFetch(`/api/archivos/trabajo/${trabajoId}`)
}

export function uploadArchivo(trabajoId, file, { presupuestoId } = {}) {
  const formData = new FormData()
  formData.append('archivo', file)
  if (presupuestoId) {
    formData.append('presupuesto_id', String(presupuestoId))
  }
  return apiUploadFile(`/api/archivos/trabajo/${trabajoId}`, formData)
}

export function deleteArchivo(id) {
  return apiFetch(`/api/archivos/${id}`, {
    method: 'DELETE',
  })
}

export function getMaterials(category) {
  return apiFetch(`/api/materials/${category}`)
}

export function updateMaterial(category, id, updates) {
  return apiFetch(`/api/materials/${category}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  })
}

export function createMaterial(category, material) {
  return apiFetch(`/api/materials/${category}`, {
    method: 'POST',
    body: JSON.stringify(material),
  })
}

export function deleteMaterial(category, id) {
  return apiFetch(`/api/materials/${category}/${id}`, {
    method: 'DELETE',
  })
}

export function getSetting(key) {
  return apiFetch(`/api/settings/${key}`)
}

export function updateSetting(key, value) {
  return apiFetch(`/api/settings/${key}`, {
    method: 'PUT',
    body: JSON.stringify({ value }),
  })
}

export function getTrabajos(estado) {
  const query = estado ? `?estado=${estado}` : ''
  return apiFetch(`/api/trabajos${query}`)
}

export function getTrabajo(id) {
  return apiFetch(`/api/trabajos/${id}`)
}

export function createTrabajo(data) {
  return apiFetch('/api/trabajos', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateTrabajo(id, updates) {
  return apiFetch(`/api/trabajos/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  })
}

export function getPresupuesto(id) {
  return apiFetch(`/api/presupuestos/${id}`)
}

export function createPresupuesto(data) {
  return apiFetch('/api/presupuestos', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updatePresupuesto(id, updates) {
  return apiFetch(`/api/presupuestos/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  })
}

export function enviarPresupuesto(id) {
  return apiFetch(`/api/presupuestos/${id}/enviar`, {
    method: 'POST',
  })
}

export function crearFlujoCompleto(datos) {
  return apiFetch('/api/flujo-completo', {
    method: 'POST',
    body: JSON.stringify(datos),
  })
}

export function getClientes() {
  return apiFetch('/api/clientes')
}

export function getCliente(id) {
  return apiFetch(`/api/clientes/${id}`)
}

export function createCliente(data) {
  return apiFetch('/api/clientes', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateCliente(id, updates) {
  return apiFetch(`/api/clientes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  })
}

export function getDashboard() {
  return apiFetch('/api/dashboard')
}

export function deleteCliente(id) {
  return apiFetch(`/api/clientes/${id}`, {
    method: 'DELETE',
  })
}

export function getHistorialAsistente(limit) {
  return apiFetch(`/api/asistente/historial?limit=${limit}`)
}

export function nuevaConversacion() {
  return apiFetch('/api/asistente/nueva', { method: 'POST' })
}

export function borrarHistorialAsistente() {
  return apiFetch('/api/asistente/historial', { method: 'DELETE' })
}

export function enviarMensajeAsistente(mensaje) {
  return apiFetch('/api/asistente', {
    method: 'POST',
    body: JSON.stringify({ mensaje }),
  })
}

export function getGastos(trabajoId) {
  return apiFetch(`/api/gastos/trabajo/${trabajoId}`)
}

export function createGasto(data) {
  return apiFetch('/api/gastos', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function deleteGasto(id) {
  return apiFetch(`/api/gastos/${id}`, {
    method: 'DELETE',
  })
}

export function getAgendaMes(year, month) {
  return apiFetch(`/api/agenda/mes/${year}/${month}`)
}

export function getAgendaDia(fecha) {
  return apiFetch(`/api/agenda/${fecha}`)
}

export function createAgendaItem(data) {
  return apiFetch('/api/agenda', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateAgendaItem(id, updates) {
  return apiFetch(`/api/agenda/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  })
}

export function deleteAgendaItem(id) {
  return apiFetch(`/api/agenda/${id}`, {
    method: 'DELETE',
  })
}

export function getVapidPublicKey() {
  return apiFetch('/api/push/vapid-public-key')
}

export function suscribirPush(subscription) {
  return apiFetch('/api/push/suscribir', {
    method: 'POST',
    body: JSON.stringify(subscription),
  })
}
