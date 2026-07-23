<template>
  <el-timeline>
    <el-timeline-item
      v-for="node in nodes"
      :key="node.id"
      :timestamp="node.operatedAt ? formatDate(node.operatedAt) : ''"
      placement="top"
      :type="getNodeColor(node)"
      :hollow="node.status === 'PENDING'"
    >
      <el-card shadow="never" class="approval-card">
        <div class="node-header">
          <span class="node-name">{{ node.nodeName }}</span>
          <el-tag :type="getTagType(node.status)" size="small">{{ getLabel(node.status) }}</el-tag>
        </div>
        <div class="node-info">
          <span>审批人：{{ node.approverName || '-' }}</span>
        </div>
        <div v-if="node.comment" class="node-comment">
          意见：{{ node.comment }}
        </div>
      </el-card>
    </el-timeline-item>
  </el-timeline>
</template>

<script setup>
import { formatDate } from '@/utils/format'

defineProps({
  nodes: { type: Array, default: () => [] }
})

function getNodeColor(node) {
  const map = { APPROVED: 'success', REJECTED: 'danger', PENDING: 'info' }
  return map[node.status] || 'info'
}

function getTagType(status) {
  const map = { APPROVED: 'success', REJECTED: 'danger', PENDING: 'warning' }
  return map[status] || 'info'
}

function getLabel(status) {
  const map = { APPROVED: '已通过', REJECTED: '已驳回', PENDING: '待审批' }
  return map[status] || status
}
</script>

<style scoped>
.approval-card :deep(.el-card__body) {
  padding: 12px;
}
.node-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.node-name {
  font-weight: 600;
  font-size: 14px;
}
.node-info {
  font-size: 13px;
  color: #666;
}
.node-comment {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
  padding: 6px 8px;
  background: #f5f5f5;
  border-radius: 4px;
}
</style>
