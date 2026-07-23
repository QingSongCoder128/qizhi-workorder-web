import request from './request'

// 看板数据
export function getDashboard(params) {
  return request.get('/api/v1/stats/dashboard', { params })
}

// 导出 Excel
export function exportExcel(params) {
  return request.get('/api/v1/stats/export', {
    params,
    responseType: 'blob'
  })
}

// 手动刷新缓存
export function refreshCache() {
  return request.post('/api/v1/stats/refresh')
}
