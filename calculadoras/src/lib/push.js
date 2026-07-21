function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export async function activarNotificaciones(vapidPublicKey) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Este navegador no soporta notificaciones push')
  }

  const permiso = await Notification.requestPermission()
  if (permiso !== 'granted') {
    throw new Error('No se otorgó permiso para notificaciones')
  }

  const registration = await navigator.serviceWorker.ready

  const existing = await registration.pushManager.getSubscription()
  if (existing) await existing.unsubscribe()

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
  })

  return subscription.toJSON()
}
