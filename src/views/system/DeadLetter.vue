<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title"><el-icon><WarningFilled /></el-icon> 死信管理</div>
      <el-tag type="danger" effect="dark" size="small">系统运维</el-tag>
    </div>

    <div class="page-card">
      <el-alert
        title="死信队列说明"
        description="当消息处理失败且超过最大重试次数后，消息会进入死信队列。您可以展开查看完整消息体与业务对象，并对未处理的死信手动重试。"
        type="info"
        :closable="false"
        show-icon
        style="margin-bottom: 20px;"
      />

      <el-table v-loading="loading" :data="tableData" empty-text=" " row-key="id">
        <el-table-column type="expand">
          <template #default="{ row }">
            <div class="dlq-expand">
              <div class="dlq-expand__label">完整消息体（业务对象）</div>
              <pre class="dlq-expand__json">{{ prettyBody(row.messageBody) }}</pre>
              <div class="dlq-expand__meta">
                <span>交换机：<b>{{ row.exchangeName }}</b></span>
                <span>队列：<b>{{ row.queueName }}</b></span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="消息类型" width="140">
          <template #default="{ row }">
            <div class="dlq-type">
              <span class="dlq-type__icon" :style="{ background: msgTypeColor(row) }">
                <el-icon :size="13" color="#fff"><component :is="msgTypeIcon(row)" /></el-icon>
              </span>
              <span class="dlq-type__label">{{ msgTypeLabel(row) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="业务对象" min-width="190" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="dlq-biz">
              <span class="dlq-biz__title">{{ bizTitle(row) }}</span>
              <span class="dlq-biz__id">{{ bizIdText(row) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="errorReason" label="失败原因" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="dlq-error">{{ row.errorReason || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="重试历史" width="150">
          <template #default="{ row }">
            <div class="dlq-retry">
              <el-tag type="warning" size="small" effect="plain">已重试 {{ row.retryCount || 0 }} 次</el-tag>
              <span class="dlq-retry__time">{{ row.retriedAt ? '最近 ' + formatDate(row.retriedAt) : '尚未重试' }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="95">
          <template #default="{ row }">
            <el-tag :type="DLQ_STATUS[row.status]?.tag || 'info'" size="small" effect="light">
              {{ DLQ_STATUS[row.status]?.label || row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="150">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="80" fixed="right">
          <template #default="{ row }">
            <el-button
              link type="primary" :disabled="row.status === 'RESOLVED'"
              :loading="retryingId === row.id" @click="handleRetry(row)"
            >
              重试
            </el-button>
          </template>
        </el-table-column>
        <template #empty>
          <div class="empty-state">
            <el-icon class="empty-icon" style="color: #10b981;"><CircleCheckFilled /></el-icon>
            <p class="empty-text">暂无死信记录，系统运行正常</p>
          </div>
        </template>
      </el-table>

      <el-pagination
        v-model:current-page="query.page"
        v-model:page-size="query.pageSize"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @size-change="fetchList"
        @current-change="fetchList"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { WarningFilled, CircleCheckFilled } from '@element-plus/icons-vue'
import { getDeadLetterList, retryDeadLetter } from '@/api/message'
import { MSG_TYPE, DLQ_STATUS } from '@/utils/constants'
import { formatDate } from '@/utils/format'

const loading = ref(false)
const retryingId = ref(null)
const tableData = ref([])
const total = ref(0)
const query = reactive({ page: 1, pageSize: 10 })

onMounted(() => fetchList())

// 解析 messageBody（JSON 字符串）为对象
function parseBody(row) {
  if (!row || !row.messageBody) return {}
  if (typeof row.messageBody === 'object') return row.messageBody
  try { return JSON.parse(row.messageBody) } catch { return {} }
}

function prettyBody(body) {
  if (!body) return '—'
  if (typeof body === 'object') return JSON.stringify(body, null, 2)
  try { return JSON.stringify(JSON.parse(body), null, 2) } catch { return body }
}

// 消息类型：优先取 messageBody.msgType，否则按队列推断
function msgTypeKey(row) {
  const body = parseBody(row)
  if (body.msgType) return body.msgType
  if (row.queueName && row.queueName.includes('remind')) return 'DELAY_REMIND'
  return ''
}

function msgTypeLabel(row) {
  const key = msgTypeKey(row)
  return MSG_TYPE[key]?.label || (key || '系统消息')
}

function msgTypeIcon(row) {
  const key = msgTypeKey(row)
  return MSG_TYPE[key]?.icon || 'Bell'
}

function msgTypeColor(row) {
  const key = msgTypeKey(row)
  return MSG_TYPE[key]?.color || '#64748b'
}

// 业务对象标题：优先取 messageBody.title
function bizTitle(row) {
  const body = parseBody(row)
  return body.title || '—'
}

// 业务对象标识：bizId / workOrderId / receiverId
function bizIdText(row) {
  const body = parseBody(row)
  if (body.bizId != null) return `工单 #${body.bizId}`
  if (body.workOrderId != null) return `工单 #${body.workOrderId}`
  if (body.receiverId != null) return `接收人 #${body.receiverId}`
  return ''
}

async function fetchList() {
  loading.value = true
  try {
    const res = await getDeadLetterList(query)
    tableData.value = res.data?.records || []
    total.value = res.data?.total || 0
  } catch {} finally { loading.value = false }
}

async function handleRetry(row) {
  try {
    await ElMessageBox.confirm('确定重试该消息吗？系统将重新投递并处理。', '确认重试')
    retryingId.value = row.id
    await retryDeadLetter(row.id)
    ElMessage.success('已提交重试，请稍后刷新查看结果')
    fetchList()
  } catch {
  } finally {
    retryingId.value = null
  }
}
</script>

<style lang="scss" scoped>
.dlq-type {
  display: flex;
  align-items: center;
  gap: $space-2;

  &__icon {
    width: 26px;
    height: 26px;
    border-radius: $radius-sm;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__label {
    font-size: $text-base;
    font-weight: 500;
    color: $text-primary;
  }
}

.dlq-biz {
  display: flex;
  flex-direction: column;
  gap: 2px;
  line-height: $leading-tight;

  &__title {
    font-size: $text-base;
    font-weight: 500;
    color: $text-primary;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__id {
    font-family: $font-mono;
    font-size: $text-xs;
    color: $text-muted;
  }
}

.dlq-error {
  color: $danger;
  font-size: $text-base;
}

.dlq-retry {
  display: flex;
  flex-direction: column;
  gap: $space-1;

  &__time {
    font-size: $text-xs;
    color: $text-muted;
  }
}

.dlq-expand {
  padding: $space-3 $space-6 $space-4 56px;

  &__label {
    font-size: $text-xs;
    font-weight: 600;
    color: $text-muted;
    margin-bottom: $space-2;
  }

  &__json {
    background: $gray-950;
    color: #a5f3fc;
    font-family: $font-mono;
    font-size: $text-xs;
    line-height: 1.6;
    padding: $space-3 $space-4;
    border-radius: $radius-md;
    overflow-x: auto;
    margin: 0 0 $space-3;
    white-space: pre-wrap;
    word-break: break-all;
  }

  &__meta {
    display: flex;
    gap: $space-6;
    font-size: $text-xs;
    color: $text-secondary;

    b {
      font-family: $font-mono;
      color: $text-primary;
      font-weight: 500;
    }
  }
}
</style>
