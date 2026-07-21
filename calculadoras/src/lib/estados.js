export const ESTADOS_TRABAJO = ['evaluado', 'cotizado', 'enviado', 'aceptado', 'por_cobrar', 'cobrado', 'rechazado']

// Trabajos que todavía tiene sentido ofrecer como destino de un nuevo presupuesto
// (se excluyen solo los cerrados: cobrado/rechazado).
export const ESTADOS_TRABAJO_ABIERTOS = ESTADOS_TRABAJO.filter((e) => e !== 'cobrado' && e !== 'rechazado')
