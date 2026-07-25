<template>
  <div class="page-container pending-page">
    <!-- 统计卡片行 -->
    <div class="stats-row">
      <div class="stat-card stat-card--blue" :class="{ active: filter === 'all' }" @click="setFilter('all')">
        <div class="stat-icon"><el-icon><Stamp /></el-icon></div>
        <div class="stat-info">
          <div class="stat-num">{{ stats.total }}</div>
          <div class="stat-label">待审批总数</div>
        </div>
      </div>
      <div class="stat-card stat-card--red" :class="{ active: filter === 'urgent' }" @click="setFilter('urgent')">
        <div class="stat-icon"><el-icon><WarningFilled /></el-icon></div>
        <div class="stat-info">
          <div class="stat-num">{{ stats.urgentCount }}</div>
          <div class="stat-label">紧急工单</div>
        </div>
      </div>
      <div class="stat-card stat-card--orange" :class="{ active: filter === 'timeout' }" @click="setFilter('timeout')">
        <div class="stat-icon"><el-icon><AlarmClock /></el-icon></div>
        <div class="stat-info">
          <div class="stat-num">{{ stats.timeoutCount }}</div>
          <div class="stat-label">超时未处理</div>
        </div>
      </div>
      <div class="stat-card stat-card--green">
        <div class="stat-icon"><el-icon><CircleCheckFilled /></el-icon></div>
        <div class="stat-info">
          <div class="stat-num">{{ stats.todayCompletedCount }}</div>
          <div class="stat-label">今日已处理</div>
        </div>
      </div>
    </div>

    <!-- 表格卡片 -->
    <div class="table-card">
      <div class="table-card-header">
        <div class="table-title">
          <el-icon><List /></el-icon>
          <span>待审批工单</span>
          <el-tag v-if="filter !== 'all'" size="small" closable @close="setFilter('all')">
            {{ filter === 'urgent' ? '仅看紧急' : '仅看超时' }}
          </el-tag>
        </div>
        <div class="table-actions">
          <el-select v-model="query.sortBy" style="width: 130px" size="default" @change="fetchList">
            <el-option label="按提交时间" value="createdAt" />
            <el-option label="按紧急程度" value="priority" />
          </el-select>
          <el-select v-model="query.order" style="width: 105px" size="default" @change="fetchList">
            <el-option label="最新优先" value="desc" />
            <el-option label="最早优先" value="asc" />
          </el-select>
        </div>
      </div>

      <el-table :data="filteredData" v-loading="loading" :row-class-name="rowClass" empty-text=" " stripe>
        <el-table-column prop="orderNo" label="工单编号" width="175">
          <template #default="{ row }">
            <span class="order-no">{{ row.orderNo }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" min-width="240" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="title-cell">
              <span class="submitter-dot" :style="{ background: dotColor(row.submitterName) }">
                {{ (row.submitterName || '?')[0] }}
              </span>
              <el-tag v-if="row.priority === 'URGENT'" type="danger" size="small" effect="dark" class="urgent-tag">紧急</el-tag>
              <span class="title-text">{{ row.title }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="workType" label="类型" width="110">
          <template #default="{ row }">
            <el-tag size="small" effect="plain">{{ ORDER_TYPE[row.workType]?.label || row.workType || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="submitterName" label="提交人" width="90" />
        <el-table-column label="等待时长" width="140">
          <template #default="{ row }">
            <div class="wait-cell">
              <div class="wait-bar">
                <div class="wait-bar-inner" :class="{ timeout: isTimeout(row) }"
                  :style="{ width: waitPercent(row) + '%' }"></div>
              </div>
              <span class="wait-text" :class="{ 'timeout-text': isTimeout(row) }">{{ waitTime(row.createdAt) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="提交时间" width="160">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" round @click="$router.push(`/approve/detail/${row.id}`)">
              去审批
            </el-button>
          </template>
        </el-table-column>
        <template #empty>
          <div class="empty-state">
            <el-icon class="empty-icon"><CircleCheck /></el-icon>
            <p class="empty-text">太棒了，暂无待审批工单！</p>
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
import { ORDER_TYPE } from '@/utils/constants'
import { getPendingApprovals, getPendingStats } from '@/api/approve'
import { formatDate } from '@/utils/format'

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const filter = ref('all')
const stats = reactive({ total: 0, urgentCount: 0, timeoutCount: 0, todayCompletedCount: 0 })
const query = reactive({ page: 1, pageSize: 10, sortBy: 'createdAt', order: 'desc' })

onMounted(() => {
  fetchList()
  fetchStats()
})

async function fetchList() {
  loading.value = true
  try {
    const res = await getPendingApprovals(query)
    tableData.value = res.data?.records || []
    total.value = res.data?.total || 0
  } catch {} finally {
    loading.value = false
  }
}

async function fetchStats() {
  try {
    const res = await getPendingStats()
    if (res.data) {
      stats.total = res.data.total || 0
      stats.urgentCount = res.data.urgentCount || 0
      stats.timeoutCount = res.data.timeoutCount || 0
      stats.todayCompletedCount = res.data.todayCompletedCount || 0
    }
  } catch {}
}

function setFilter(f) {
  filter.value = (filter.value === f) ? 'all' : f
}

const filteredData = computed(() => {
  if (filter.value === 'urgent') return tableData.value.filter(r => r.priority === 'URGENT')
  if (filter.value === 'timeout') return tableData.value.filter(r => isTimeout(r))
  return tableData.value
})

function rowClass({ row }) {
  return row.priority === 'URGENT' ? 'urgent-row' : ''
}

function isTimeout(row) {
  const minutes = row.priority === 'URGENT' ? 60 : row.priority === 'LOW' ? 720 : 240
  const diff = Date.now() - new Date(row.createdAt).getTime()
  return diff > minutes * 60 * 1000
}

function waitPercent(row) {
  const limit = (row.priority === 'URGENT' ? 60 : row.priority === 'LOW' ? 720 : 240) * 60 * 1000
  const diff = Date.now() - new Date(row.createdAt).getTime()
  return Math.min(Math.round((diff / limit) * 100), 100)
}

function waitTime(createdAt) {
  const diff = Date.now() - new Date(createdAt).getTime()
  const hours = Math.floor(diff / 3600000)
  if (hours >= 24) return Math.floor(hours / 24) + '天'
  if (hours > 0) return hours + '小时'
  return Math.floor(diff / 60000) + '分钟'
}

const DOT_COLORS = ['#4f6ef7', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#6366f1']
function dotColor(name) {
  if (!name) return DOT_COLORS[0]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return DOT_COLORS[Math.abs(hash) % DOT_COLORS.length]
}
</script>

<style scoped lang="scss">
.pending-page {
  .stats-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 20px;
  }

  .stat-card {
    background: #fff;
    border-radius: 12px;
    padding: 18px 20px;
    display: flex;
    align-items: center;
    gap: 14px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
    cursor: pointer;
    transition: all 0.2s;
    border: 2px solid transparent;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    &.active {
      border-color: currentColor;
    }

    .stat-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      flex-shrink: 0;
    }

    .stat-num {
      font-size: 24px;
      font-weight: 700;
      line-height: 1.2;
    }

    .stat-label {
      font-size: 12px;
      color: #64748b;
      margin-top: 2px;
    }

    &--blue {
      color: #4f6ef7;
      .stat-icon { background: rgba(79, 110, 247, 0.1); }
      .stat-num { color: #4f6ef7; }
    }
    &--red {
      color: #ef4444;
      .stat-icon { background: rgba(239, 68, 68, 0.1); }
      .stat-num { color: #ef4444; }
    }
    &--orange {
      color: #f59e0b;
      .stat-icon { background: rgba(245, 158, 11, 0.1); }
      .stat-num { color: #f59e0b; }
    }
    &--green {
      color: #10b981;
      cursor: default;
      .stat-icon { background: rgba(16, 185, 129, 0.1); }
      .stat-num { color: #10b981; }
      &:hover { transform: none; box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06); }
    }
  }

  .table-card {
    background: #fff;
    border-radius: 12px;
    padding: 20px 24px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);

    .table-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;

      .table-title {
        font-size: 15px;
        font-weight: 600;
        color: #1e293b;
        display: flex;
        align-items: center;
        gap: 8px;

        .el-icon { color: #4f6ef7; font-size: 17px; }
      }

      .table-actions {
        display: flex;
        gap: 10px;
      }
    }
  }

  .order-no {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    color: #64748b;
  }

  .title-cell {
    display: flex;
    align-items: center;
    gap: 8px;

    .submitter-dot {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      color: #fff;
      font-size: 11px;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .urgent-tag { flex-shrink: 0; }
    .title-text { font-weight: 500; }
  }

  .wait-cell {
    display: flex;
    align-items: center;
    gap: 8px;

    .wait-bar {
      width: 48px;
      height: 6px;
      border-radius: 3px;
      background: #f1f5f9;
      overflow: hidden;
      flex-shrink: 0;

      .wait-bar-inner {
        height: 100%;
        border-radius: 3px;
        background: linear-gradient(90deg, #4f6ef7, #7c3aed);
        transition: width 0.3s;

        &.timeout {
          background: linear-gradient(90deg, #ef4444, #dc2626);
        }
      }
    }

    .wait-text {
      font-size: 12px;
      color: #64748b;
      white-space: nowrap;
    }

    .timeout-text {
      color: #ef4444;
      font-weight: 600;
    }
  }

  .empty-state {
    padding: 48px 0;
    text-align: center;

    .empty-icon {
      font-size: 48px;
      color: #10b981;
    }

    .empty-text {
      margin-top: 12px;
      color: #64748b;
      font-size: 14px;
    }
  }
}

:deep(.urgent-row) {
  td {
    background-color: #fef2f2 !important;
  }
  td:first-child {
    border-left: 3px solid #ef4444;
  }
}

:deep(.el-table) {
  --el-table-border-color: #f1f5f9;

  th {
    background: #f8fafc !important;
    color: #475569;
    font-weight: 600;
    font-size: 13px;
  }
}

:deep(.el-pagination) {
  margin-top: 16px;
  justify-content: flex-end;
}
</style>
