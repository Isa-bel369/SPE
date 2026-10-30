import { serveFunction } from '../_shared/http.ts'
import { AppError } from '../_shared/errors.ts'
import { db } from '../_shared/db.ts'
import { enforceLimit } from '../_shared/rateLimit.ts'

serveFunction('merit_lookup', { kind: 'public' }, async (context, body) => {
  const memberCode = (body as { member_code: string }).member_code
  await enforceLimit(`merit:ip:${context.ip}`, 30, 600)
  await enforceLimit(`merit:member:${memberCode}`, 10, 600)
  const { data: member, error } = await db.from('members').select('id,first_name').eq('member_code', memberCode).maybeSingle()
  if (error) throw new AppError('SERVER_ERROR')
  if (!member) {
    await enforceLimit(`merit:failed:${context.ip}`, 10, 600)
    throw new AppError('ID_NOT_FOUND')
  }

  const [totalResult, attendanceResult, adjustmentResult] = await Promise.all([
    db.rpc('member_total', { p_member: member.id }),
    db.from('merit_records').select('points,created_at,events(title,starts_at)').eq('member_id', member.id).eq('source', 'event_checkin').order('created_at', { ascending: false }),
    db.from('merit_records').select('points,reason,created_at').eq('member_id', member.id).in('source', ['manual_adjustment', 'check_in_reversal']).order('created_at', { ascending: false }),
  ])
  if (totalResult.error || attendanceResult.error || adjustmentResult.error) throw new AppError('SERVER_ERROR')
  const attendance = (attendanceResult.data || []).map((row) => {
    const event = Array.isArray(row.events) ? row.events[0] : row.events
    return { event_title: event?.title || 'Chapter event', event_date: event?.starts_at || row.created_at, points: row.points, checked_in_at: row.created_at }
  })
  return {
    first_name: member.first_name,
    total_points: Number(totalResult.data || 0),
    attendance,
    adjustments: adjustmentResult.data || [],
  }
})
