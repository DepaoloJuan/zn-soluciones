import { buildPushHTTPRequest } from '@pushforge/builder'
import { neon } from '@neondatabase/serverless'

export async function enviarPushATodos(
  databaseUrl: string,
  vapidPrivateKeyJson: string,
  payload: { title: string; body: string; url?: string }
) {
  const sql = neon(databaseUrl)
  const subs = await sql`SELECT * FROM push_subscriptions`
  const privateJWK = JSON.parse(vapidPrivateKeyJson)

  for (const sub of subs) {
    const subscription = {
      endpoint: sub.endpoint,
      keys: { p256dh: sub.p256dh, auth: sub.auth },
    }

    try {
      const { endpoint, headers, body } = await buildPushHTTPRequest({
        privateJWK,
        subscription,
        message: {
          payload,
          adminContact: 'mailto:zaratediegonicolas@gmail.com',
        },
      })

      const res = await fetch(endpoint, { method: 'POST', headers, body })

      // Si la suscripción ya no es válida (usuario la borró, etc.), la limpiamos
      if (res.status === 404 || res.status === 410) {
        await sql`DELETE FROM push_subscriptions WHERE id = ${sub.id}`
      }
    } catch (err) {
      console.error('Error enviando push:', err)
    }
  }
}
