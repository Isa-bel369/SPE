import { z } from 'npm:zod'

const email = z.string().trim().email().max(254).transform((value) => value.toLowerCase())
const memberCode = z.string().regex(/^[1-9][0-9]{5}$/)
const location = z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180), accuracy: z.number().gt(0) }).strict()

export const schemas = {
  register_member: z.object({ first_name: z.string().trim().min(1).max(50), last_name: z.string().trim().min(1).max(50), programme: z.string().trim().min(2).max(100), year_of_study: z.enum(['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Postgraduate']), email, phone: z.string().trim().min(1), show_on_leaderboard: z.boolean().optional().default(false), captcha_token: z.string().min(1), website: z.string() }).strict(),
  verify_email: z.object({ email, code: z.string().regex(/^\d{6}$/) }).strict(),
  resend_code: z.object({ email }).strict(),
  merit_lookup: z.object({ member_code: memberCode }).strict(),
  start_check_in: z.object({ event_token: z.string().min(1), device_token: z.string().uuid(), location }).strict(),
  check_in: z.object({ session_id: z.string().uuid(), member_code: memberCode, device_token: z.string().uuid(), location }).strict(),
  submit_contact: z.object({ name: z.string().trim().min(2).max(100), email, message: z.string().trim().min(10).max(2000), captcha_token: z.string().min(1), website: z.string() }).strict(),
  send_contact_notification: z.object({
    type: z.literal('INSERT').optional(), table: z.literal('contact_messages').optional(), schema: z.literal('public').optional(),
    record: z.object({ id: z.string().uuid(), name: z.string(), email, message: z.string() }).passthrough(),
  }).passthrough(),
  qr_token: z.object({ event_id: z.string().uuid() }).strict(),
  set_checkin_state: z.object({ event_id: z.string().uuid(), is_active: z.boolean() }).strict(),
  reset_event_secret: z.object({ event_id: z.string().uuid() }).strict(),
  manual_check_in: z.object({ event_id: z.string().uuid(), member_code: memberCode }).strict(),
  remove_check_in: z.object({ attendance_id: z.string().uuid(), reason: z.string().trim().min(3).max(200) }).strict(),
  adjust_merit: z.object({ member_code: memberCode, points: z.number().int().min(-100).max(100).refine((value) => value !== 0), reason: z.string().trim().min(3).max(200) }).strict(),
  log_export: z.object({ format: z.enum(['csv', 'xlsx']), row_count: z.number().int().nonnegative() }).strict(),
  delete_event: z.object({ event_id: z.string().uuid() }).strict(),
  delete_news_post: z.object({ post_id: z.string().uuid() }).strict(),
  delete_media_item: z.object({ media_id: z.string().uuid() }).strict(),
  delete_member: z.object({ member_id: z.string().uuid() }).strict(),
  list_admins: z.object({}).strict(),
  invite_admin: z.object({ email, role: z.enum(['communications_head', 'organization_head', 'technical_head']) }).strict(),
  set_user_role: z.object({ user_id: z.string().uuid(), role: z.enum(['communications_head', 'organization_head', 'technical_head']), action: z.enum(['add', 'remove']) }).strict(),
}

export type FunctionName = keyof typeof schemas
