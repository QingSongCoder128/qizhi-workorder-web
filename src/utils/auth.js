const SESSION_KEY = 'qizhi_session'

export function getSessionId() {
  return sessionStorage.getItem(SESSION_KEY) || ''
}

export function setSessionId(id) {
  sessionStorage.setItem(SESSION_KEY, id)
}

export function removeSessionId() {
  sessionStorage.removeItem(SESSION_KEY)
}

export function isLoggedIn() {
  return !!getSessionId()
}
