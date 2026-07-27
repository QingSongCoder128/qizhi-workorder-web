import request from './request'

// 用户列表（分页）
export function getUserList(params) {
  return request.get('/api/v1/user/list', { params })
}

// 新增用户
export function createUser(data) {
  return request.post('/api/v1/user', data)
}

// 编辑用户
export function updateUser(id, data) {
  return request.put(`/api/v1/user/${id}`, data)
}

// 重置密码
export function resetPassword(id) {
  return request.post(`/api/v1/user/${id}/reset-password`)
}

// 启用/禁用用户
export function toggleUserStatus(id, status) {
  return request.put(`/api/v1/user/${id}/status`, { status })
}

// 部门列表（树形）
export function getDeptTree() {
  return request.get('/api/v1/dept/tree')
}

// 部门列表（平铺）
export function getDeptList() {
  return request.get('/api/v1/dept/list')
}

// 新增部门
export function createDept(data) {
  return request.post('/api/v1/dept', data)
}

// 编辑部门
export function updateDept(id, data) {
  return request.put(`/api/v1/dept/${id}`, data)
}

// 删除部门
export function deleteDept(id) {
  return request.delete(`/api/v1/dept/${id}`)
}

// 角色列表
export function getRoleList() {
  return request.get('/api/v1/role/list')
}

// 新增角色
export function createRole(data) {
  return request.post('/api/v1/role', data)
}

// 编辑角色
export function updateRole(id, data) {
  return request.put(`/api/v1/role/${id}`, data)
}

// 当前登录用户信息
export function getCurrentUser() {
  return request.get('/api/v1/user/me')
}

// 修改个人信息
export function updateProfile(data) {
  return request.put('/api/v1/user/profile', data)
}

// 按角色编码查询用户列表（供审批转交/加签选择审批人）
export function getUsersByRole(roleCode) {
  return request.get('/api/v1/user/by-role', { params: { roleCode } })
}

// 修改密码
export function changePassword(data) {
  return request.put('/api/v1/user/password', data)
}

// 头像上传
export function uploadAvatar(formData) {
  return request.post('/api/v1/user/avatar/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

// 用户统计
export function getUserStats() {
  return request.get('/api/v1/user/stats')
}

// 导出用户列表
export function exportUsers(params) {
  return request.get('/api/v1/user/export', { params, responseType: 'blob' })
}

// 批量操作
export function batchUserOperation(data) {
  return request.put('/api/v1/user/batch', data)
}

export function deleteUser(id) {
  return request.delete(`/api/v1/user/${id}`)
}
