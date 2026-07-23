import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getUnreadCount } from '@/api/message'

export const useMessageStore = defineStore('message', () => {
  const unreadCount = ref(0)

  async function fetchUnreadCount() {
    try {
      const res = await getUnreadCount()
      unreadCount.value = res.data || 0
    } catch {
      unreadCount.value = 0
    }
  }

  function decrement() {
    if (unreadCount.value > 0) unreadCount.value--
  }

  function clear() {
    unreadCount.value = 0
  }

  return { unreadCount, fetchUnreadCount, decrement, clear }
})
