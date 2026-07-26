import request from './request'

// 提交工单
export function submitWorkOrder(data) {
  return request.post('/api/v1/workorder/submit', data)
}

// 我的工单列表（分页）
export function getMyWorkOrders(params) {
  return request.get('/api/v1/workorder/my-list', { params })
}

// 全部工单列表（管理员，分页）
export function getAllWorkOrders(params) {
  return request.get('/api/v1/workorder/list', { params })
}

// 工单详情
export function getWorkOrderDetail(id) {
  return request.get(`/api/v1/workorder/${id}`)
}

// 撤销工单
export function revokeWorkOrder(id) {
  return request.post(`/api/v1/workorder/${id}/revoke`)
}

// 重新提交（驳回后修改再提交）
export function resubmitWorkOrder(id, data) {
  return request.put(`/api/v1/workorder/${id}/resubmit`, data)
}

// 上传附件
export function uploadAttachment(file) {
  const formData = new FormData()
  formData.append('file', file)
  return request.post('/api/v1/workorder/attachment/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

// 通过带会话头的 Gateway 请求读取受保护附件
export function downloadAttachment(url) {
  return request.get(url, { responseType: 'blob' })
}
