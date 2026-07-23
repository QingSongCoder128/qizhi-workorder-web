<template>
  <el-timeline>
    <el-timeline-item
      v-for="item in history"
      :key="item.id"
      :timestamp="formatDate(item.createdAt)"
      placement="top"
      :type="getType(item.status)"
    >
      <el-card shadow="never" class="timeline-card">
        <div class="timeline-title">
          <StatusTag :status="item.status" />
          <span class="operator">{{ item.operatorName }}</span>
        </div>
        <div class="timeline-desc">{{ item.remark || '状态变更' }}</div>
      </el-card>
    </el-timeline-item>
  </el-timeline>
</template>

<script setup>
import StatusTag from './StatusTag.vue'
import { formatDate } from '@/utils/format'

defineProps({
  history: { type: Array, default: () => [] }
})

function getType(status) {
  const map = {
    COMPLETED: 'success',
    REJECTED: 'danger',
    APPROVING: 'primary',
    PENDING_APPROVE: 'warning'
  }
  return map[status] || 'info'
}
</script>

<style scoped>
.timeline-card {
  max-width: 500px;
}
.timeline-card :deep(.el-card__body) {
  padding: 12px;
}
.timeline-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}
.operator {
  font-size: 13px;
  color: #666;
}
.timeline-desc {
  font-size: 12px;
  color: #999;
}
</style>
