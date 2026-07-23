import request from './request'

// 消息列表（分页）
export function getMessageList(params) {
  return request.get('/api/v1/message/list', { params })
}

// 未读消息数量
export function getUnreadCount() {
  return request.get('/api/v1/message/unread-count')
}

// 标记已读
export function markAsRead(id) {
  return request.put(`/api/v1/message/${id}/read`)
}

// 批量标记已读
export function markAllAsRead() {
  return request.put('/api/v1/message/read-all')
}

// 删除消息
export function deleteMessage(id) {
  return request.delete(`/api/v1/message/${id}`)
}

// 死信列表（管理员）
export function getDeadLetterList(params) {
  return request.get('/api/v1/message/dead-letter/list', { params })
}

// 手动重试死信
export function retryDeadLetter(id) {
  return request.post(`/api/v1/message/dead-letter/${id}/retry`)
}
