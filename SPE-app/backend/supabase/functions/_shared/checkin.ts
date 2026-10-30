import { AppError } from './errors.ts'
import { haversineMeters } from './security.ts'

export function ensureCheckinOpen(event: Record<string, unknown>, isActive: boolean, windowOpen: boolean) {
  if (!event.is_published || !isActive || !windowOpen) throw new AppError('CHECKIN_CLOSED')
}

export function venueDistance(location: { lat: number; lng: number; accuracy: number }, event: Record<string, unknown>) {
  if (event.venue_lat == null || event.venue_lng == null) throw new AppError('LOCATION_DENIED')
  const lat = Number(event.venue_lat); const lng = Number(event.venue_lng); const radius = Number(event.radius_m)
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(radius)) throw new AppError('LOCATION_DENIED')
  const distance = haversineMeters(location.lat, location.lng, lat, lng)
  if (distance > radius) throw new AppError('OUTSIDE_AREA')
  return Math.round(distance / 10) * 10
}
