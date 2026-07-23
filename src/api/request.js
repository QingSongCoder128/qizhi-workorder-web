import axios from 'axios'
import { ElMessage } from 'element-plus'
import { getSessionId, removeSessionId } from '@/utils/auth'
import router from '@/router'

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15000
})

// 请求拦截器：注入 sessionId
request.interceptors.request.use(
  config => {
    const sessionId = getSessionId()
    if (sessionId) {
      config.headers['X-Session-Id'] = sessionId
    }
    return config
  },
  error => Promise.reject(error)
)

// 响应拦截器：统一错误处理
request.interceptors.response.use(
  response => {
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
    }
    return Promise.reject(error)
  }
)

export default request
