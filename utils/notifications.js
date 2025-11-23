import {BASE_URL} from '../urls/url'

function requireSafe(name) {
  try {
    const r = eval('require')
    return r(name)
  } catch (e) {
    return null
  }
}

export async function requestPermissionAndRegister({ userId, authToken }) {
  if (!userId || !authToken) return null
  const messaging = requireSafe('@react-native-firebase/messaging')
  if (!messaging) return null
  try {
    try { await messaging().setAutoInitEnabled(true) } catch {}
    try { await messaging().registerDeviceForRemoteMessages() } catch {}
    const status = await messaging().requestPermission()
    const ok = status === messaging.AuthorizationStatus.AUTHORIZED || status === messaging.AuthorizationStatus.PROVISIONAL
    if (!ok) return null
    const token = await messaging().getToken()
    if (!token) return null
    try { await messaging().subscribeToTopic('all') } catch {}
    try {
      await fetch(`${BASE_URL}/register-device-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ userId, deviceToken: token })
      })
    } catch {}
    return token
  } catch {
    return null
  }
}

export async function initNotificationHandlers() {
  const messaging = requireSafe('@react-native-firebase/messaging')
  const notifee = requireSafe('@notifee/react-native')
  if (!messaging) return
  try {
    if (notifee) {
      try { await notifee.createChannel({ id: 'default', name: 'Default', importance: 4 }) } catch {}
    }
    messaging().onMessage(async remoteMessage => {
      try {
        const n = remoteMessage.notification || {}
        const d = remoteMessage.data || {}
        if (notifee) {
          await notifee.displayNotification({ title: n.title || d.title, body: n.body || d.body, android: { channelId: 'default' }, data: d })
        }
      } catch {}
    })
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      try {
        const n = remoteMessage.notification || {}
        const d = remoteMessage.data || {}
        if (notifee) {
          await notifee.displayNotification({ title: n.title || d.title, body: n.body || d.body, android: { channelId: 'default' }, data: d })
        }
      } catch {}
    })
  } catch {}
}

export default { requestPermissionAndRegister, initNotificationHandlers }