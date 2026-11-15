const accra = new Intl.DateTimeFormat('en-GH', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Accra' })
export const formatDate = (value) => value ? accra.format(new Date(value)) : ''
export const dateOnly = (value) => value ? new Intl.DateTimeFormat('en-GH', { dateStyle: 'medium', timeZone: 'Africa/Accra' }).format(new Date(value)) : ''
