<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title"><el-icon><Stamp /></el-icon> 待审批工单</div>
      <div class="header-actions">
        <el-select v-model="query.sortBy" style="width: 140px" @change="fetchList">
          <el-option label="按提交时间" value="createdAt" />
          <el-option label="按紧急程度" value="priority" />
        </el-select>
        <el-select v-model="query.order" style="width: 100px" @change="fetchList">
          <el-option label="最新优先" value="desc" />
          <el-option label="最早优先" value="asc" />
        </el-select>
      </div>
    </div>

    <div class="page-card">
      <el-table :data="tableData" v-loading="loading" :row-class-name="rowClass" empty-text=" ">
        <el-table-column prop="orderNo" label="工单编号" width="175">
          <template #default="{ row }">
            <span class="order-no">{{ row.orderNo }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" min-width="220" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="title-cell">
              <el-tag v-if="row.priority === 'URGENT'" type="danger" size="small" effect="dark" class="urgent-tag">紧急</el-tag>
              <span>{{ row.title }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="workType" label="类型" width="110">
          <template #default="{ row }">
            <el-tag size="small" effect="plain">{{ ORDER_TYPE[row.workType]?.label || row.workType || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="submitterName" label="提交人" width="90" />
        <el-table-column prop="priority" label="优先级" width="80">
          <template #default="{ row }">
            <PriorityTag v-if="row.priority" :priority="row.priority" />
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="提交时间" width="160" sortable>
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="等待时长" width="100">
          <template #default="{ row }">
            <span :class="isTimeout(row) ? 'timeout-text' : ''">{{ waitTime(row.createdAt) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="90" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="$router.push(`/approve/detail/${row.id}`)">审批</el-button>
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
import { ref, reactive, onMounted } from 'vue'
import { ORDER_TYPE } from '@/utils/constants'
import { getPendingApprovals } from '@/api/approve'
import { formatDate } from '@/utils/format'
import PriorityTag from '@/components/PriorityTag.vue'

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const query = reactive({ page: 1, pageSize: 10, sortBy: 'createdAt', order: 'desc' })

onMounted(() => fetchList())

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

function rowClass({ row }) {
  return row.priority === 'URGENT' ? 'urgent-row' : ''
}

function isTimeout(row) {
  const minutes = row.priority === 'URGENT' ? 60 : row.priority === 'LOW' ? 720 : 240
  const diff = Date.now() - new Date(row.createdAt).getTime()
  return diff > minutes * 60 * 1000
}

function waitTime(createdAt) {
  const diff = Date.now() - new Date(createdAt).getTime()
  const hours = Math.floor(diff / 3600000)
  if (hours >= 24) return Math.floor(hours / 24) + '天'
  if (hours > 0) return hours + '小时'
  return Math.floor(diff / 60000) + '分钟'
}
</script>

<style scoped lang="scss">
.header-actions {
  display: flex;
  gap: 10px;
}

.order-no {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: $text-secondary;
}

.title-cell {
  display: flex;
  align-items: center;
  gap: 8px;

  .urgent-tag {
    flex-shrink: 0;
  }
}

.timeout-text {
  color: $danger;
  font-weight: 600;
  font-size: 12px;
}

:deep(.urgent-row) {
  td {
    background-color: #fef2f2 !important;
  }
  td:first-child {
    border-left: 3px solid $danger;
  }
}
</style>
