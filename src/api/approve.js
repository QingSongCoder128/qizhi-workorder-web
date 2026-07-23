import request from './request'

// 待审批列表
export function getPendingApprovals(params) {
  return request.get('/api/v1/approve/pending', { params })
}

// 审批详情
export function getApprovalDetail(id) {
  return request.get(`/api/v1/approve/${id}`)
}

// 审批通过
export function approveOrder(id, data) {
  return request.post(`/api/v1/approve/${id}/approve`, data)
}

// 审批驳回
export function rejectOrder(id, data) {
  return request.post(`/api/v1/approve/${id}/reject`, data)
}

// 转交审批
export function transferOrder(id, data) {
  return request.post(`/api/v1/approve/${id}/transfer`, data)
}

// 加签（插入审批节点）
export function addApprovalNode(id, data) {
  return request.post(`/api/v1/approve/${id}/add-node`, data)
}

// 减签（移除审批节点）
export function removeApprovalNode(id, data) {
  return request.post(`/api/v1/approve/${id}/remove-node`, data)
}

// 审批模板列表
export function getTemplateList() {
  return request.get('/api/v1/approve/template/list')
}

// 创建审批模板
export function createTemplate(data) {
  return request.post('/api/v1/approve/template', data)
}

// 编辑审批模板
export function updateTemplate(id, data) {
  return request.put(`/api/v1/approve/template/${id}`, data)
}

// 删除审批模板
export function deleteTemplate(id) {
  return request.delete(`/api/v1/approve/template/${id}`)
}
