<template>
  <div class="page-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <div>
        <div class="page-title"><el-icon><WarningFilled /></el-icon> 死信管理</div>
        <p class="page-subtitle">异常消息监控与补偿处理</p>
      </div>
      <el-button type="primary" size="small">
        <el-icon><Setting /></el-icon> 系统运维
      </el-button>
    </div>

    <!-- KPI 概览卡片 -->
    <div class="dlq-stats">
      <div class="dlq-stat" style="--stat-bg: #ecf5ff; --stat-color: #409eff;">
        <div class="dlq-stat__icon"><el-icon :size="22"><Message /></el-icon></div>
        <div class="dlq-stat__info">
          <span class="dlq-stat__num">{{ stats.pending }}</span>
          <span class="dlq-stat__label">待处理</span>
          <span class="dlq-stat__desc">需要人工或重试处理</span>
        </div>
      </div>
      <div class="dlq-stat" style="--stat-bg: #f0f9eb; --stat-color: #67c23a;">
        <div class="dlq-stat__icon"><el-icon :size="22"><CircleCheckFilled /></el-icon></div>
        <div class="dlq-stat__info">
          <span class="dlq-stat__num">{{ stats.resolved }}</span>
          <span class="dlq-stat__label">已恢复</span>
          <span class="dlq-stat__desc">已成功恢复的消息</span>
        </div>
      </div>
      <div class="dlq-stat" style="--stat-bg: #fdf6ec; --stat-color: #e6a23c;">
        <div class="dlq-stat__icon"><el-icon :size="22"><WarningFilled /></el-icon></div>
        <div class="dlq-stat__info">
          <span class="dlq-stat__num">{{ stats.failed }}</span>
          <span class="dlq-stat__label">已达上限</span>
          <span class="dlq-stat__desc">重试次数已达上限</span>
        </div>
      </div>
      <div class="dlq-stat" style="--stat-bg: #f4f0ff; --stat-color: #7c5cfc;">
        <div class="dlq-stat__icon"><el-icon :size="22"><Document /></el-icon></div>
        <div class="dlq-stat__info">
          <span class="dlq-stat__num">{{ total }}</span>
          <span class="dlq-stat__label">总记录</span>
          <span class="dlq-stat__desc">死信消息总数</span>
        </div>
      </div>
    </div>

    <div class="page-card">
      <!-- 说明横幅 -->
      <el-alert
        v-if="showAlert"
        class="dlq-alert"
        type="info"
        :closable="true"
        show-icon
        @close="showAlert = false"
      >
        <template #title><b>死信队列说明</b></template>
        <template #default>当消息处理失败且超过最大重试次数后，消息会进入死信队列。您可以展开查看完整消息体与业务对象，并对未处理的死信手动重试。</template>
      </el-alert>

      <!-- 筛选操作栏 -->
      <div class="dlq-filter">
        <el-input
          v-model="searchText"
          placeholder="搜索业务对象或工单号"
          clearable
          class="dlq-filter__search"
          @input="handleSearch"
        >
          <template #suffix><el-icon><Search /></el-icon></template>
        </el-input>
        <el-select v-model="filterStatus" placeholder="全部状态" clearable class="dlq-filter__select" @change="fetchList">
          <el-option label="待处理" value="UNRESOLVED" />
          <el-option label="已处理" value="RESOLVED" />
          <el-option label="处理失败" value="FAILED" />
        </el-select>
        <el-select v-model="filterType" placeholder="全部类型" clearable class="dlq-filter__select" @change="fetchList">
          <el-option label="待审批通知" value="APPROVE_NOTIFY" />
          <el-option label="驳回通知" value="REJECT_NOTIFY" />
          <el-option label="超时督办" value="DELAY_REMIND" />
          <el-option label="系统通知" value="SYSTEM" />
        </el-select>
        <el-button type="primary" :disabled="!stats.pending" :loading="retryAllLoading" @click="handleRetryAll">
          <el-icon><RefreshRight /></el-icon> 一键重试全部
        </el-button>
        <el-button circle @click="fetchList"><el-icon><Refresh /></el-icon></el-button>
      </div>

      <!-- 数据表格 -->
      <el-table ref="tableRef" v-loading="loading" :data="filteredData" empty-text=" " row-key="id">
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
        <el-table-column label="消息类型" width="150">
          <template #default="{ row }">
            <div class="dlq-type">
              <span class="dlq-type__icon" :style="{ background: msgTypeColor(row) }">
                <el-icon :size="13" color="#fff"><component :is="msgTypeIcon(row)" /></el-icon>
              </span>
              <span class="dlq-type__label">{{ msgTypeLabel(row) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="业务对象" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="dlq-biz">
              <span class="dlq-biz__title">{{ bizTitle(row) }}</span>
              <span v-if="bizId(row)" class="dlq-biz__link" @click="goOrder(bizId(row))">工单 #{{ bizId(row) }}</span>
              <el-tag v-if="urgencyTag(row)" :type="urgencyTag(row).type" size="small" effect="plain" class="dlq-biz__priority">{{ urgencyTag(row).label }}</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="errorReason" label="失败原因" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="dlq-error">{{ row.errorReason || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="重试历史" width="140">
          <template #default="{ row }">
            <div class="dlq-retry">
              <el-tag type="warning" size="small" effect="plain">已重试 {{ row.retryCount || 0 }} 次</el-tag>
              <span class="dlq-retry__time">{{ row.retriedAt ? '最近 ' + formatDate(row.retriedAt) : '尚未重试' }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="DLQ_STATUS[row.status]?.tag || 'info'" size="small" effect="light">
              {{ DLQ_STATUS[row.status]?.label || row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="150">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="130" fixed="right">
          <template #default="{ row }">
            <div class="dlq-actions">
              <el-button
                v-if="row.status === 'UNRESOLVED'"
                link type="primary"
                :loading="retryingId === row.id" @click="handleRetry(row)"
              >重试</el-button>
              <el-tooltip v-else-if="row.status === 'FAILED'" content="已达最大重试次数，需人工排查根因" placement="top">
                <el-button link type="info" disabled>已达上限</el-button>
              </el-tooltip>
              <span v-else class="dlq-done">✓ 已恢复</span>
              <el-button link type="primary" @click="toggleExpand(row)">查看详情</el-button>
            </div>
          </template>
        </el-table-column>
        <template #empty>
          <div class="empty-state">
            <el-icon class="empty-icon" style="color: #67c23a;"><CircleCheckFilled /></el-icon>
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
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { WarningFilled, CircleCheckFilled, Message, Document, Search, Refresh, RefreshRight, Setting } from '@element-plus/icons-vue'
import { getDeadLetterList, retryDeadLetter } from '@/api/message'
import { MSG_TYPE, DLQ_STATUS } from '@/utils/constants'
import { formatDate } from '@/utils/format'

const router = useRouter()
const loading = ref(false)
const retryingId = ref(null)
const retryAllLoading = ref(false)
const showAlert = ref(true)
const tableData = ref([])
const total = ref(0)
const query = reactive({ page: 1, pageSize: 10 })
const searchText = ref('')
const filterStatus = ref('')
const filterType = ref('')

// KPI 统计
const stats = computed(() => ({
  pending: tableData.value.filter(r => r.status === 'UNRESOLVED').length,
  resolved: tableData.value.filter(r => r.status === 'RESOLVED').length,
  failed: tableData.value.filter(r => r.status === 'FAILED').length
}))

// 前端筛选（搜索 + 状态 + 类型）
const filteredData = computed(() => {
  let data = tableData.value
  if (filterStatus.value) {
    data = data.filter(r => r.status === filterStatus.value)
  }
  if (filterType.value) {
    data = data.filter(r => msgTypeKey(r) === filterType.value)
  }
  if (searchText.value.trim()) {
    const kw = searchText.value.trim().toLowerCase()
    data = data.filter(r => {
      const body = parseBody(r)
      const title = (body.title || '').toLowerCase()
      const id = String(body.bizId || '')
      return title.includes(kw) || id.includes(kw)
    })
  }
  return data
})

onMounted(() => fetchList())

function handleSearch() { /* computed 自动响应 */ }

// 工单优先级标签
function urgencyTag(row) {
  const body = parseBody(row)
  const p = body.priority
  if (p === 'URGENT') return { label: '紧急', type: 'danger' }
  if (p === 'NORMAL') return { label: '普通', type: '' }
  if (p === 'LOW') return { label: '低优', type: 'info' }
  return null
}

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

function bizTitle(row) {
  const body = parseBody(row)
  if (body.title) return body.title
  const key = msgTypeKey(row)
  return MSG_TYPE[key]?.label || '系统消息'
}

function bizId(row) {
  const body = parseBody(row)
  return body.bizId || body.workOrderId || null
}

function goOrder(id) {
  router.push(`/workorder/detail/${id}`)
}

const tableRef = ref(null)

// 展开行详情
function toggleExpand(row) {
  tableRef.value?.toggleRowExpansion(row)
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
    ElMessage.success('重试成功，消息已重新投递')
    fetchList()
  } catch {
  } finally {
    retryingId.value = null
  }
}

async function handleRetryAll() {
  const pending = tableData.value.filter(r => r.status === 'UNRESOLVED')
  if (!pending.length) return
  try {
    await ElMessageBox.confirm(`确定重试全部 ${pending.length} 条待处理消息吗？`, '一键重试')
    retryAllLoading.value = true
    let success = 0, fail = 0
    for (const row of pending) {
      try {
        await retryDeadLetter(row.id)
        success++
      } catch { fail++ }
    }
    ElMessage.success(`重试完成：成功 ${success} 条${fail ? `，失败 ${fail} 条` : ''}`)
    fetchList()
  } catch {
  } finally {
    retryAllLoading.value = false
  }
}
</script>

<style lang="scss" scoped>
.page-subtitle {
  font-size: $text-sm;
  color: $text-muted;
  margin: 2px 0 0;
}

// ─── KPI 卡片 ───
.dlq-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: $space-4;
  margin-bottom: $space-4;
}

.dlq-stat {
  display: flex;
  align-items: center;
  gap: $space-4;
  padding: $space-4 $space-5;
  background: #fff;
  border-radius: $radius-lg;
  box-shadow: $shadow-sm;
  border: 1px solid $border-light;

  &__icon {
    width: 48px;
    height: 48px;
    border-radius: $radius-md;
    background: var(--stat-bg);
    color: var(--stat-color);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__info {
    display: flex;
    flex-direction: column;
  }

  &__num {
    font-size: 26px;
    font-weight: 700;
    color: $text-primary;
    line-height: 1.2;
  }

  &__label {
    font-size: $text-base;
    font-weight: 600;
    color: $text-primary;
  }

  &__desc {
    font-size: $text-xs;
    color: $text-muted;
  }
}

// ─── 说明横幅 ───
.dlq-alert {
  margin-bottom: $space-4;
  background-color: #ecf5ff !important;
  border: 1px solid #d9ecff !important;

  :deep(.el-alert__title) { color: #409eff; }
  :deep(.el-alert__description) { color: #5a7da8; }
  :deep(.el-alert__icon) { color: #409eff; }
}

// ─── 筛选栏 ───
.dlq-filter {
  display: flex;
  align-items: center;
  gap: $space-3;
  margin-bottom: $space-4;

  &__search {
    width: 220px;
  }

  &__select {
    width: 130px;
  }
}

// ─── 表格内组件 ───
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
  align-items: center;
  gap: $space-2;
  flex-wrap: wrap;

  &__title {
    font-size: $text-base;
    font-weight: 500;
    color: $text-primary;
  }

  &__link {
    font-family: $font-mono;
    font-size: $text-xs;
    color: $brand;
    cursor: pointer;
    &:hover { text-decoration: underline; }
  }

  &__priority {
    transform: scale(0.85);
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

.dlq-actions {
  display: flex;
  align-items: center;
  gap: $space-2;
}

.dlq-done {
  font-size: $text-xs;
  color: $success;
  font-weight: 500;
}

// ─── 展开详情 ───
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
