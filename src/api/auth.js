import request from './request'

// 登录
export function login(data) {
  return request.post('/api/v1/auth/login', data)
}

// 注册
export function register(data) {
  return request.post('/api/v1/auth/register', data)
}

// 登出
export function logout() {
  return request.post('/api/v1/auth/logout')
}
