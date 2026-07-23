<template>
  <el-tag :type="priorityInfo.type" size="small" effect="dark">
    {{ priorityInfo.label }}
  </el-tag>
</template>

<script setup>
import { computed } from 'vue'
import { PRIORITY } from '@/utils/constants'

const props = defineProps({
  priority: { type: String, required: true }
})

const priorityInfo = computed(() => PRIORITY[props.priority] || { label: props.priority, type: 'info' })
</script>
