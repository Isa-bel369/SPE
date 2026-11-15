const DEVICE_KEY = 'spe-umat-device-v1'
let memoryToken

function locationError(message = 'Location is required. Allow location for this site, then try again.', code = 'LOCATION_DENIED') {
  const error = new Error(message)
  error.code = code
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

export function getPosition({ timeout = 30000, targetAccuracy = 100 } = {}) {
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
    const finishWithError = (error) => {
      if (finished) return
      finished = true
      if (timer) clearTimeout(timer)
      if (watchId != null) navigator.geolocation.clearWatch(watchId)
      reject(error)
    }
    const onFix = (position) => {
      if (!best || position.coords.accuracy < best.coords.accuracy) best = position
      if (position.coords.accuracy <= targetAccuracy) finish(position)
    }
    const onError = (error) => {
      if (error.code === 1) finishWithError(locationError())
    }
    const options = { enableHighAccuracy: true, maximumAge: 0 }
    try {
      watchId = navigator.geolocation.watchPosition(onFix, onError, options)
      navigator.geolocation.getCurrentPosition(onFix, onError, { ...options, timeout: Math.min(timeout, 15000) })
      timer = setTimeout(() => {
        if (best && best.coords.accuracy <= targetAccuracy) finish(best)
        else finishWithError(locationError(`Could not get a location accurate to ${targetAccuracy} metres. Move outdoors or enter the coordinates manually.`, 'LOCATION_INACCURATE'))
      }, timeout)
    } catch {
      finishWithError(locationError())
    }
  })
}
