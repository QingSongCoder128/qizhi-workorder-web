// ========== 统一枚举映射系统 ==========

// 工单状态
export const ORDER_STATUS = {
  PENDING: { label: '待处理', color: '#f59e0b', tag: 'warning' },
  PENDING_AI: { label: '待AI处理', color: '#8b5cf6', tag: '' },
  PENDING_APPROVE: { label: '待审批', color: '#f59e0b', tag: 'warning' },
  APPROVING: { label: '审批中', color: '#3b82f6', tag: '' },
  APPROVED: { label: '已通过', color: '#14b8a6', tag: 'success' },
  COMPLETED: { label: '已完结', color: '#10b981', tag: 'success' },
  REJECTED: { label: '已驳回', color: '#ef4444', tag: 'danger' },
  CANCELLED: { label: '已取消', color: '#94a3b8', tag: 'info' },
  REVOKED: { label: '已撤销', color: '#94a3b8', tag: 'info' },
  TIMEOUT: { label: '已超时', color: '#dc2626', tag: 'danger' }
}

// 工单类型（SRS 3.2.1：运维报修、行政采购、人事请假、技术需求）
export const ORDER_TYPE = {
  OPS_REPAIR: { label: '运维报修', icon: 'SetUp', color: '#f59e0b' },
  ADMIN_PURCHASE: { label: '行政采购', icon: 'ShoppingCart', color: '#8b5cf6' },
  HR_LEAVE: { label: '人事请假', icon: 'Calendar', color: '#10b981' },
  TECH_REQUEST: { label: '技术需求', icon: 'Monitor', color: '#3b82f6' }
}

// 优先级
export const PRIORITY = {
  URGENT: { label: '紧急', color: '#ef4444', type: 'danger' },
  NORMAL: { label: '普通', color: '#64748b', type: 'info' },
  LOW: { label: '低优先级', color: '#6b9080', type: 'info' }
}

// 用户角色
export const ROLES = {
  EMPLOYEE: '员工',
  APPROVER: '审批人',
  ADMIN: '管理员'
}

// 审批节点状态
export const NODE_STATUS = {
  PENDING: { label: '待处理', color: '#f59e0b', tag: 'warning' },
  APPROVING: { label: '审批中', color: '#3b82f6', tag: '' },
  APPROVED: { label: '已通过', color: '#14b8a6', tag: 'success' },
  REJECTED: { label: '已驳回', color: '#ef4444', tag: 'danger' },
  TRANSFERRED: { label: '已转交', color: '#8b5cf6', tag: '' },
  SKIPPED: { label: '已跳过', color: '#94a3b8', tag: 'info' },
  CANCELLED: { label: '已取消', color: '#94a3b8', tag: 'info' }
}

// 审批操作
export const APPROVE_ACTION = {
  APPROVE: '通过',
  REJECT: '驳回',
  TRANSFER: '转交',
  ADD_SIGN: '加签',
  REDUCE_SIGN: '减签'
}

// 消息类型
export const MSG_TYPE = {
  SYSTEM: { label: '系统通知', icon: 'Setting', color: '#64748b' },
  APPROVE_NOTIFY: { label: '待审批通知', icon: 'Bell', color: '#6366f1' },
  APPROVED_NOTIFY: { label: '审批通过通知', icon: 'CircleCheck', color: '#10b981' },
  REJECT_NOTIFY: { label: '审批驳回通知', icon: 'CircleClose', color: '#ef4444' },
  TIMEOUT_REMIND: { label: '超时督办', icon: 'AlarmClock', color: '#f59e0b' },
  TIMEOUT_NOTIFY: { label: '超时提醒', icon: 'AlarmClock', color: '#f59e0b' },
  DELAY_REMIND: { label: '超时督办', icon: 'AlarmClock', color: '#f59e0b' },
  URGE_NOTIFY: { label: '催办通知', icon: 'Bell', color: '#f97316' },
  TRANSFER_NOTIFY: { label: '转交通知', icon: 'Switch', color: '#8b5cf6' },
  ESCALATION: { label: '升级通知', icon: 'Warning', color: '#ef4444' }
}

// 用户状态
export const USER_STATUS = {
  ENABLED: { label: '正常', color: '#10b981', tag: 'success' },
  DISABLED: { label: '已禁用', color: '#ef4444', tag: 'danger' },
  ACTIVE: { label: '正常', color: '#10b981', tag: 'success' },
  INACTIVE: { label: '已停用', color: '#94a3b8', tag: 'info' }
}

// 死信状态（与数据库 dead_letter.status 实际值对齐：UNRESOLVED/RESOLVED/FAILED）
export const DLQ_STATUS = {
  UNRESOLVED: { label: '待处理', color: '#f59e0b', tag: 'warning' },
  RESOLVED: { label: '已处理', color: '#10b981', tag: 'success' },
  FAILED: { label: '处理失败', color: '#ef4444', tag: 'danger' }
}

// AI 状态
export const AI_STATUS = {
  QUEUED: { label: '排队中', color: '#94a3b8' },
  PROCESSING: { label: '分析中', color: '#3b82f6' },
  SUCCESS: { label: '分析成功', color: '#10b981' },
  FAILED: { label: '分析失败', color: '#ef4444' },
  FALLBACK: { label: '已降级', color: '#f59e0b' }
}

// AI分类标签
export const AI_CATEGORY = {
  DEPT_IT: '运维部',
  DEPT_ADMIN: '行政部',
  DEPT_HR: '人事部',
  DEPT_TECH: '技术部',
  DEPT_FIN: '财务部',
  HARDWARE: '硬件设备',
  NETWORK: '网络问题',
  SYSTEM: '系统运维',
  PERMISSION: '权限管理',
  PURCHASE: '采购申请',
  LEAVE: '请假审批',
  FACILITY: '设施维护',
  RESOURCE: '资源申请'
}

// 部门映射（与 sys_department 实际数据对齐）
export const DEPT_MAP = {
  DEPT_IT: '运维部',
  DEPT_ADMIN: '行政部',
  DEPT_HR: '人事部',
  DEPT_TECH: '技术部',
  DEPT_FIN: '财务部'
}

// ========== 通用枚举解析工具 ==========

/**
 * 安全解析枚举值，未识别的返回“未知状态”
 */
export function resolveEnum(map, value, fallback = '未知状态') {
  if (!value) return fallback
  const item = map[value]
  if (!item) {
    if (import.meta.env.DEV) {
      console.warn(`[Enum] 未识别的枚举值: ${value}`)
    }
    return fallback
  }
  return typeof item === 'string' ? item : item.label
}

/**
 * 空值安全显示
 */
export function safeText(value, placeholder = '—') {
  if (value === null || value === undefined || value === '' || value === 'null' || value === 'undefined') {
    return placeholder
  }
  if (typeof value === 'object') return placeholder
  return String(value)
}

/**
 * 业务场景空值显示
 */
export function emptyHint(value, scene) {
  const hints = {
    opinion: '未填写审批意见',
    sensitive: '未检测到敏感内容',
    attachment: '暂无附件',
    aiPending: '分析中...',
    aiFallback: 'AI 识别异常，请人工核对',
    remark: '暂无备注'
  }
  if (value === null || value === undefined || value === '') {
    return hints[scene] || '—'
  }
  return value
}

/**
 * 置信度百分比格式化
 */
export function formatConfidence(val) {
  if (val === null || val === undefined) return '—'
  const num = Number(val)
  if (isNaN(num)) return '—'
  return (num * 100).toFixed(0) + '%'
}
