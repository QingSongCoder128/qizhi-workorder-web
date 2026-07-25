/**
 * 工单超时判断与时间格式化工具
 * 超时口径与后端 getStats() 保持一致：
 *   处于 PENDING_APPROVE / APPROVING 且 (now - createdAt) 超过对应优先级阈值。
 *   阈值：URGENT=60分钟，NORMAL=240分钟，LOW=720分钟。
 */

const TIMEOUT_MINUTES = { URGENT: 60, NORMAL: 240, LOW: 720 }

/**
 * 判断工单是否超时（仅对待审批/审批中的工单计算）
 */
export function isOrderTimeout(order) {
  if (!order || !order.createdAt) return false
  if (!['PENDING_APPROVE', 'APPROVING'].includes(order.status)) return false
  const threshold = TIMEOUT_MINUTES[order.priority] ?? TIMEOUT_MINUTES.NORMAL
  const minutes = (Date.now() - new Date(order.createdAt).getTime()) / 60000
  return minutes > threshold
}

/**
 * 计算工单剩余/超时分钟数（正数=已超时，负数=未超时），非待审批状态返回 null
 */
export function timeoutMinutes(order) {
  if (!order || !order.createdAt) return null
  if (!['PENDING_APPROVE', 'APPROVING'].includes(order.status)) return null
  const threshold = TIMEOUT_MINUTES[order.priority] ?? TIMEOUT_MINUTES.NORMAL
  const minutes = (Date.now() - new Date(order.createdAt).getTime()) / 60000
  return Math.round(minutes - threshold)
}

/**
 * 时间格式化：yyyy-MM-dd HH:mm
 */
export function formatTime(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return '—'
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
