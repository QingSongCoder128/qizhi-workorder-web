// 工单状态
export const ORDER_STATUS = {
  PENDING_AI: { label: '待AI处理', color: '#909399' },
  PENDING_APPROVE: { label: '待审批', color: '#E6A23C' },
  APPROVING: { label: '审批中', color: '#409EFF' },
  COMPLETED: { label: '已完结', color: '#67C23A' },
  REJECTED: { label: '已驳回', color: '#F56C6C' },
  CANCELLED: { label: '已撤销', color: '#909399' },
  REVOKED: { label: '已撤销', color: '#909399' }
}

// 工单类型
export const ORDER_TYPE = {
  OPS_REPAIR: { label: '运维报修', icon: 'SetUp' },
  MAINTENANCE: { label: '运维报修', icon: 'SetUp' },
  ADMIN_PURCHASE: { label: '行政采购', icon: 'ShoppingCart' },
  HR_LEAVE: { label: '人事请假', icon: 'Calendar' },
  TECH_REQUEST: { label: '技术需求', icon: 'Monitor' }
}

// 优先级
export const PRIORITY = {
  URGENT: { label: '紧急', color: '#F56C6C', type: 'danger' },
  NORMAL: { label: '普通', color: '#409EFF', type: '' },
  LOW: { label: '低级', color: '#909399', type: 'info' }
}

// 用户角色
export const ROLES = {
  EMPLOYEE: 'EMPLOYEE',
  APPROVER: 'APPROVER',
  ADMIN: 'ADMIN'
}

// AI分类标签
export const AI_CATEGORY = {
  DEPT_IT: '运维部',
  DEPT_ADMIN: '行政部',
  DEPT_HR: '人事部',
  DEPT_TECH: '技术部'
}

// 消息类型
export const MSG_TYPE = {
  APPROVE_NOTIFY: '审批通知',
  REJECT_NOTIFY: '驳回通知',
  DELAY_REMIND: '督办提醒',
  ESCALATION: '升级通知',
  SYSTEM: '系统通知'
}
