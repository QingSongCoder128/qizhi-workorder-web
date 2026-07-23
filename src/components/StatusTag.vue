<template>
  <el-tag :type="statusInfo.type || 'info'" :effect="effect" size="small">
    {{ statusInfo.label || status }}
  </el-tag>
</template>

<script setup>
import { computed } from 'vue'
import { ORDER_STATUS } from '@/utils/constants'

const props = defineProps({
  status: { type: String, required: true },
  effect: { type: String, default: 'light' }
})

const statusInfo = computed(() => {
  const info = ORDER_STATUS[props.status]
  if (!info) return { label: props.status, type: 'info' }
  const typeMap = {
    '#909399': 'info',
    '#E6A23C': 'warning',
    '#409EFF': '',
    '#67C23A': 'success',
    '#F56C6C': 'danger'
  }
  return { label: info.label, type: typeMap[info.color] || 'info' }
})
</script>
