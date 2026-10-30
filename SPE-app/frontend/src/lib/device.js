const DEVICE_KEY = 'spe-umat-device-v1'
let memoryToken

function locationError() {
  const error = new Error('Location is required. Allow location for this site, then scan the QR code again.')
  error.code = 'LOCATION_DENIED'
  return error
}

export function getDeviceToken() {
  try {
    let token = localStorage.getItem(DEVICE_KEY)
    if (!token) {
      token = crypto.randomUUID()
      localStorage.setItem(DEVICE_KEY, token)
    }
    return token
  } catch {
    memoryToken ||= crypto.randomUUID()
    return memoryToken
  }
}

export function getPosition() {
  if (!navigator.geolocation) return Promise.reject(locationError())
  return new Promise((resolve, reject) => {
    let best = null
    let watchId
    let timer
    let finished = false
    const finish = (position) => {
      if (finished) return
      finished = true
      if (timer) clearTimeout(timer)
      if (watchId != null) navigator.geolocation.clearWatch(watchId)
      if (!position) return reject(locationError())
      resolve({ lat: position.coords.latitude, lng: position.coords.longitude, accuracy: position.coords.accuracy })
    }
    const onFix = (position) => {
      if (!best || position.coords.accuracy < best.coords.accuracy) best = position
      if (position.coords.accuracy <= 100) finish(position)
      else waitForBetterFix()
    }
    const waitForBetterFix = () => {
      if (timer) clearTimeout(timer)
      if (best?.coords.accuracy <= 100) return finish(best)
      try { watchId = navigator.geolocation.watchPosition(onFix, () => {}, { enableHighAccuracy: true, maximumAge: 0 }) }
      catch { finish(best) }
      timer = setTimeout(() => finish(best), 10000)
    }
    navigator.geolocation.getCurrentPosition(onFix, (error) => {
      if (error.code === error.PERMISSION_DENIED) finish(null)
      else waitForBetterFix()
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 })
    timer = setTimeout(waitForBetterFix, 15000)
  })
}
