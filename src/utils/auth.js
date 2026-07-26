const SESSION_KEY = 'qizhi_session'
const ROLE_KEY = 'qizhi_role'
const PERMISSION_KEY = 'qizhi_permissions'

export function getSessionId() {
  return sessionStorage.getItem(SESSION_KEY) || ''
}

export function setSessionId(id) {
  sessionStorage.setItem(SESSION_KEY, id)
}

export function removeSessionId() {
  sessionStorage.removeItem(SESSION_KEY)
  sessionStorage.removeItem(ROLE_KEY)
  sessionStorage.removeItem(PERMISSION_KEY)
}

export function isLoggedIn() {
  return !!getSessionId()
}

export function setAccessContext(role, permissions = []) {
  sessionStorage.setItem(ROLE_KEY, role || 'EMPLOYEE')
  sessionStorage.setItem(PERMISSION_KEY, JSON.stringify(permissions || []))
}

export function getRole() {
  return sessionStorage.getItem(ROLE_KEY) || 'EMPLOYEE'
}

export function getPermissions() {
  try {
    return JSON.parse(sessionStorage.getItem(PERMISSION_KEY) || '[]')
  } catch {
    return []
  }
}

export function hasPermission(code) {
  return getPermissions().includes(code)
}
