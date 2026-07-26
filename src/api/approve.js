import request from './request'

// 待审批列表
export function getPendingApprovals(params) {
  return request.get('/api/v1/approve/pending', { params })
}

// 待审批统计（总数/紧急/超时/今日已处理）
export function getPendingStats() {
  return request.get('/api/v1/approve/pending/stats')
}

// 审批详情
export function getApprovalDetail(id) {
  return request.get(`/api/v1/approve/${id}`)
}

// 按工单ID查询完整审批记录（含审批人/节点状态/序号，工单详情审批流真实数据源）
export function getApprovalRecordsByWorkOrder(workOrderId) {
  return request.get(`/api/v1/approve/by-work-order/${workOrderId}/records`)
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

// 获取模板的审批节点（approval_node 表，审批流真实数据源）
export function getTemplateNodes(id) {
  return request.get(`/api/v1/approve/template/${id}/nodes`)
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
