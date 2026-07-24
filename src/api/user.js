import request from './request'

// 用户列表（分页）
export function getUserList(params) {
  return request.get('/api/v1/user/list', { params })
}

// 用户详情
export function getUserDetail(id) {
  return request.get(`/api/v1/user/${id}`)
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
