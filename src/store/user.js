import { defineStore } from 'pinia'
import { ref } from 'vue'
import { login as loginApi } from '@/api/auth'
import { getCurrentUser } from '@/api/user'
import { setSessionId, removeSessionId } from '@/utils/auth'

export const useUserStore = defineStore('user', () => {
  const userId = ref(null)
  const username = ref('')
  const realName = ref('')
  const deptCode = ref('')
  const role = ref('')
  const phone = ref('')
  const email = ref('')
  const permissions = ref([])
  const sessionId = ref('')

  async function login(loginForm) {
    const res = await loginApi(loginForm)
    const data = res.data
    sessionId.value = data.sessionId
    userId.value = data.userId
    username.value = data.username
    realName.value = data.realName
    deptCode.value = data.deptCode
    role.value = data.role
    permissions.value = data.permissions || []
    setSessionId(data.sessionId)
  }

  async function fetchUserInfo() {
    const res = await getCurrentUser()
    const data = res.data
    userId.value = data.id
    username.value = data.username
    realName.value = data.realName
    deptCode.value = data.deptCode
    role.value = data.roleCode
    phone.value = data.phone || ''
    email.value = data.email || ''
    permissions.value = data.permissions || []
  }

  function logout() {
    userId.value = null
    username.value = ''
    realName.value = ''
    deptCode.value = ''
    role.value = ''
    phone.value = ''
    email.value = ''
    permissions.value = []
    sessionId.value = ''
    removeSessionId()
  }

  return {
    userId, username, realName, deptCode, role, phone, email, permissions, sessionId,
    login, fetchUserInfo, logout
  }
})
