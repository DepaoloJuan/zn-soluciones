import { authClient } from './auth'

const BASE_URL = import.meta.env.VITE_BACKEND_URL

async function apiFetch(path, options = {}) {
  const { data } = await authClient.getSession()
  const token = data?.session?.token

  if (!token) {
    throw new Error('No se pudo obtener la sesión. Volvé a iniciar sesión.')
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  const body = await res.json()

  if (!res.ok) {
    throw new Error(body.error || 'Error en la petición')
  }

  return body
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

export function getNotasMes(year, month) {
  return apiFetch(`/api/notas/mes/${year}/${month}`)
}

export function getNotaDia(fecha) {
  return apiFetch(`/api/notas/${fecha}`)
}

export function guardarNotaDia(fecha, nota) {
  return apiFetch(`/api/notas/${fecha}`, {
    method: 'PUT',
    body: JSON.stringify({ nota }),
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
