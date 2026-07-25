<template>
  <el-tag :type="statusInfo.tag" :effect="effect" size="small" class="status-tag">
    <span class="status-dot" :style="{ background: statusInfo.color }"></span>
    {{ statusInfo.label }}
  </el-tag>
</template>

<script setup>
import { computed } from 'vue'
import { ORDER_STATUS } from '@/utils/constants'

const props = defineProps({
  status: { type: String, default: '' },
  effect: { type: String, default: 'light' }
})

const statusInfo = computed(() => {
  if (!props.status) return { label: '未知状态', tag: 'info', color: '#94a3b8' }
  const info = ORDER_STATUS[props.status]
  if (!info) {
    if (import.meta.env.DEV) console.warn(`[StatusTag] 未识别状态: ${props.status}`)
    return { label: '未知状态', tag: 'info', color: '#94a3b8' }
  }
  return { label: info.label, tag: info.tag || 'info', color: info.color }
})
</script>

<style scoped>
.status-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border-radius: 6px;
  font-size: 12px;
  height: 24px;
  padding: 0 10px;
}
.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
}
</style>
