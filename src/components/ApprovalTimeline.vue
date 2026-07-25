<template>
  <el-timeline class="approval-timeline">
    <el-timeline-item
      v-for="(node, index) in nodes"
      :key="node.id"
      :timestamp="node.operatedAt ? formatDate(node.operatedAt) : ''"
      placement="top"
      :type="getNodeColor(node)"
      :hollow="node.status === 'PENDING'"
      :size="node.status === 'PENDING' && isCurrentNode(node, index) ? 'large' : 'normal'"
    >
      <div class="approval-card" :class="{ current: node.status === 'PENDING' && isCurrentNode(node, index) }">
        <div class="node-header">
          <span class="node-order">第{{ node.nodeOrder }}级</span>
          <span class="node-name">{{ node.nodeName }}</span>
          <el-tag :type="getTagType(node.status)" size="small" effect="light">{{ getLabel(node.status) }}</el-tag>
        </div>
        <div class="node-info">
          <el-icon><User /></el-icon>
          <span>审批人：{{ node.approverName || '待分配' }}</span>
        </div>
        <div v-if="node.comment" class="node-comment">
          <el-icon><ChatDotSquare /></el-icon>
          <span>意见：{{ node.comment }}</span>
        </div>
        <div v-else-if="node.status === 'APPROVED' || node.status === 'REJECTED'" class="node-comment no-comment">
          <el-icon><ChatDotSquare /></el-icon>
          <span>未填写审批意见</span>
        </div>
      </div>
    </el-timeline-item>
  </el-timeline>
</template>

<script setup>
import { User, ChatDotSquare } from '@element-plus/icons-vue'
import { formatDate } from '@/utils/format'
import { NODE_STATUS } from '@/utils/constants'

const props = defineProps({
  nodes: { type: Array, default: () => [] }
})

function isCurrentNode(node, index) {
  const firstPending = props.nodes.findIndex(n => n.status === 'PENDING')
  return index === firstPending
}

function getNodeColor(node) {
  const map = { APPROVED: 'success', REJECTED: 'danger', PENDING: 'info', SKIPPED: 'warning', TRANSFERRED: 'primary' }
  return map[node.status] || 'info'
}

function getTagType(status) {
  const info = NODE_STATUS[status]
  return info?.tag || 'info'
}

function getLabel(status) {
  const info = NODE_STATUS[status]
  return info?.label || '未知状态'
}
</script>

<style scoped lang="scss">
.approval-timeline {
  padding-left: 4px;
}

.approval-card {
  padding: 12px 14px;
  border-radius: 8px;
  border: 1px solid #f1f5f9;
  background: #fafbfc;
  transition: all 0.2s;
  min-width: 0;
  word-break: break-word;

  &.current {
    border-color: rgba(79, 110, 247, 0.3);
    background: #f0f4ff;
    box-shadow: 0 2px 8px rgba(79, 110, 247, 0.08);
  }
}

.node-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;

  .node-order {
    font-size: 11px;
    color: #94a3b8;
    background: #f1f5f9;
    padding: 1px 6px;
    border-radius: 4px;
    flex-shrink: 0;
  }

  .node-name {
    font-weight: 600;
    font-size: 14px;
    color: #1e293b;
    word-break: break-word;
  }
}

.node-info {
  font-size: 13px;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 4px;

  .el-icon {
    font-size: 13px;
    color: #94a3b8;
  }
}

.node-comment {
  font-size: 12px;
  color: #64748b;
  margin-top: 8px;
  padding: 8px 10px;
  background: #f8fafc;
  border-radius: 6px;
  border-left: 3px solid #e2e8f0;
  display: flex;
  align-items: flex-start;
  gap: 4px;

  .el-icon {
    font-size: 12px;
    color: #94a3b8;
    margin-top: 1px;
  }

  &.no-comment {
    color: #94a3b8;
    font-style: italic;
  }
}
</style>
