import {
  ATTENDANCE,
  EVENTS,
  MEDIA,
  MEMBERS,
  MERIT,
  NEWS,
  PAYMENTS,
} from '../data/seed'

const KEY = 'spe-umat-store-v1'

const seed = () => ({
  members: MEMBERS,
  events: EVENTS,
  news: NEWS,
  media: MEDIA,
  attendance: ATTENDANCE,
  merit: MERIT,
  payments: PAYMENTS,
  applications: [],
})

export function loadStore() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) {
      const initial = seed()
      localStorage.setItem(KEY, JSON.stringify(initial))
      return initial
    }
    return { ...seed(), ...JSON.parse(raw) }
  } catch {
    return seed()
  }
}

export function saveStore(next) {
  localStorage.setItem(KEY, JSON.stringify(next))
  return next
}

export function updateStore(mutator) {
  const current = loadStore()
  const next = mutator({ ...current })
  return saveStore(next)
}

export function qrUrl(value) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(value)}`
}

export function memberStats(store, memberId) {
  const attendance = store.attendance.filter((row) => row.memberId === memberId)
  const merit = store.merit.filter((row) => row.memberId === memberId)
  const points = merit.reduce((sum, row) => sum + Number(row.points || 0), 0)
  return {
    attendanceCount: attendance.length,
    meritCount: merit.length,
    points,
    attendance,
    merit,
  }
}

export function leaderboard(store) {
  return store.members
    .map((member) => ({
      ...member,
      ...memberStats(store, member.id),
    }))
    .sort((a, b) => b.points - a.points || b.attendanceCount - a.attendanceCount)
}
