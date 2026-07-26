import request from './request'

export const getAiConfig = () => request.get('/api/v1/admin/config/ai')
export const updateAiConfig = data => request.put('/api/v1/admin/config/ai', data)
export const validateAiConfig = () => request.post('/api/v1/admin/config/ai/validate')

export const getRateLimitConfig = () => request.get('/api/v1/admin/config/rate-limit')
export const updateRateLimitConfig = data => request.put('/api/v1/admin/config/rate-limit', data)

export const resumeAiTask = taskId => request.post(`/api/v1/admin/ai/tasks/${taskId}/resume`)
export const scanReminders = () => request.post('/api/v1/admin/reminders/scan')
