import request from './request'

// 登录
export function login(data) {
  return request.post('/api/v1/auth/login', data)
}

// 登出（可传入自定义 config，如显式指定 headers）
export function logout(config = {}) {
  return request.post('/api/v1/auth/logout', null, config)
}
