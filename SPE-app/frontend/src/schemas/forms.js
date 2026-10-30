import { z } from 'zod'

const email = z.string().trim().email('Enter a valid email address.').max(254)
const name = z.string().trim().min(1, 'This field is required.').max(50, 'Use 50 characters or fewer.')
const phonePattern = /^(\+233|233|0)[2-9]\d{8}$|^\+[1-9]\d{7,14}$/

export const registrationSchema = z.object({
  first_name: name,
  last_name: name,
  programme: z.string().trim().min(2, 'Enter a programme.').max(100, 'Use 100 characters or fewer.'),
  year_of_study: z.enum(['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Postgraduate']),
  email,
  phone: z.string().trim().transform((value) => value.replace(/[\s-]/g, '')).refine((value) => phonePattern.test(value), 'Enter a Ghanaian or international phone number.'),
  show_on_leaderboard: z.boolean(),
  captcha_token: z.string().min(1, 'Please complete the verification.'),
  website: z.string(),
})

export const contactSchema = z.object({
  name: z.string().trim().min(2, 'Enter at least 2 characters.').max(100),
  email,
  message: z.string().trim().min(10, 'Enter at least 10 characters.').max(2000),
})

export const memberCodeSchema = z.string().regex(/^[1-9]\d{5}$/, 'Enter a 6-digit membership ID.')
export const verificationCodeSchema = z.string().regex(/^\d{6}$/, 'Enter the 6-digit code from your email.')
export const slugSchema = z.string().regex(/^[a-z0-9-]{3,80}$/, 'Use 3 to 80 lowercase letters, numbers or hyphens.')

export function normalizePhone(value) {
  const compact = value.trim().replace(/[\s-]/g, '')
  if (/^0[2-9]\d{8}$/.test(compact)) return `+233${compact.slice(1)}`
  if (/^233[2-9]\d{8}$/.test(compact)) return `+${compact}`
  return compact
}
