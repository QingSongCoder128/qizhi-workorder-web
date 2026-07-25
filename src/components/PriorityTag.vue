<template>
  <el-tag :type="priorityInfo.type" size="small" effect="plain" class="priority-tag">
    {{ priorityInfo.label }}
  </el-tag>
</template>

<script setup>
import { computed } from 'vue'
import { PRIORITY } from '@/utils/constants'

const props = defineProps({
  priority: { type: String, default: '' }
})

const priorityInfo = computed(() => {
  if (!props.priority) return { label: '未知', type: 'info' }
  const info = PRIORITY[props.priority]
  if (!info) {
    if (import.meta.env.DEV) console.warn(`[PriorityTag] 未识别优先级: ${props.priority}`)
    return { label: '未知', type: 'info' }
  }
  return info
})
</script>

<style scoped>
.priority-tag {
  border-radius: 4px;
  font-size: 12px;
  height: 22px;
  font-weight: 500;
}
</style>
