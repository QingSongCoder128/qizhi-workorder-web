import axios from 'axios'
import { ElMessage } from 'element-plus'
import { getSessionId, getRole, removeSessionId } from '@/utils/auth'
import router from '@/router'

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15000
})

// ─── 请求生命周期管理（AbortController） ───
const pendingRequests = new Map()
let requestId = 0

/**
 * 取消所有在途请求。
 * 退出登录时调用：被取消的请求会走 axios.isCancel 分支，静默 reject，不触发任何 UI 反馈。
 */
export function cancelAllRequests() {
  pendingRequests.forEach(controller => controller.abort())
  pendingRequests.clear()
}

function roleScopedUrl(url) {
  const role = getRole()
  const namespace = role === 'ADMIN' ? 'admin' : role === 'APPROVER' ? 'approver' : 'employee'
  const mappings = [
    ['/api/v1/approve/template', '/api/v1/admin/approval-templates'],
    ['/api/v1/message/dead-letter', '/api/v1/admin/dead-letters'],
    ['/api/v1/workorder', `/api/v1/${namespace}/workorders`],
    ['/api/v1/approve', `/api/v1/${namespace}/approvals`],
    ['/api/v1/message', `/api/v1/${namespace}/messages`],
    ['/api/v1/stats', '/api/v1/admin/stats'],
    ['/api/v1/dept', role === 'ADMIN' ? '/api/v1/admin/departments' : `/api/v1/${namespace}/departments`],
    ['/api/v1/role', '/api/v1/admin/roles'],
    ['/api/v1/user', role === 'ADMIN' ? '/api/v1/admin/users' : `/api/v1/${namespace}/user`],
    ['/api/v1/ai', '/api/v1/admin/ai']
  ]
  for (const [legacy, scoped] of mappings) {
    if (url === legacy || url.startsWith(`${legacy}/`)) {
      return scoped + url.slice(legacy.length)
    }
  }
  return url
}

// 请求拦截器：会话守卫 + 注入 sessionId + 注册 AbortController
request.interceptors.request.use(
  config => {
    if (config.url?.startsWith('/api/v1/') && !config.url.startsWith('/api/v1/auth/')) {
      // 会话已清除时拒绝发出受保护请求（从源头阻断退出后的残留调用）
      if (!getSessionId()) {
        const controller = new AbortController()
        controller.abort()
        config.signal = controller.signal
        return config
      }
      config.url = roleScopedUrl(config.url)
    }
    const sessionId = getSessionId()
    if (sessionId) {
      config.headers['X-Session-Id'] = sessionId
    }
    // 注册 AbortController，支持全局取消
    if (!config.signal) {
      const controller = new AbortController()
      config.signal = controller.signal
      config._requestId = ++requestId
      pendingRequests.set(config._requestId, controller)
    }
    return config
  },
  error => Promise.reject(error)
)

// 响应拦截器：统一错误处理
request.interceptors.response.use(
  response => {
    // 请求完成，移出待处理队列
    if (response.config._requestId) pendingRequests.delete(response.config._requestId)
    // Blob 响应（文件下载）：检查是否实际是 JSON 错误响应
    if (response.config.responseType === 'blob') {
      const blob = response.data
      if (blob.type && blob.type.includes('application/json')) {
        // 后端返回了 JSON 错误体，解析并拒绝
        return blob.text().then(text => {
          const res = JSON.parse(text)
          ElMessage.error(res.msg || '请求失败')
          return Promise.reject(new Error(res.msg))
        })
      }
      return blob
    }
    const res = response.data
    if (res.code !== 200) {
      ElMessage.error(res.msg || '请求失败')
      // 401 未登录
      if (res.code === 401) {
        removeSessionId()
        router.push('/login')
      }
      return Promise.reject(new Error(res.msg))
    }
    return res
  },
  error => {
    if (error.config?._requestId) pendingRequests.delete(error.config._requestId)
    // 被 AbortController 取消的请求：静默处理，不弹任何提示
    if (axios.isCancel(error)) {
      return Promise.reject(error)
    }
    if (error.response) {
      const status = error.response.status
      if (status === 401) {
        removeSessionId()
        router.push('/login')
        ElMessage.error('登录已过期，请重新登录')
      } else if (status === 429) {
        ElMessage.warning('请求过于频繁，请稍后再试')
      } else {
        ElMessage.error(error.response.data?.msg || '服务器错误')
      }
    } else {
      ElMessage.error('网络连接失败')
      if (router.currentRoute.value.path !== '/network-error') {
        router.push('/network-error')
      }
    }
    return Promise.reject(error)
  }
)

export default request
