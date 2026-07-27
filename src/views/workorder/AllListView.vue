<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title"><el-icon><Files /></el-icon> 全部工单</div>
      <el-button type="primary" plain :icon="Download" :loading="exporting" @click="handleExport">导出Excel</el-button>
    </div>

    <div class="page-card">
      <div class="search-bar">
        <el-input
          v-model="query.keyword" placeholder="搜索编号/标题" clearable style="width: 200px"
          :prefix-icon="Search" @keyup.enter="fetchList" @clear="fetchList"
        />
        <el-select v-model="query.status" placeholder="状态" clearable style="width: 130px" @change="resetAndFetch">
          <el-option v-for="(v, k) in ORDER_STATUS" :key="k" :label="v.label" :value="k" />
        </el-select>
        <el-select v-model="query.type" placeholder="类型" clearable style="width: 130px" @change="resetAndFetch">
          <template v-for="(v, k) in ORDER_TYPE" :key="k">
            <el-option v-if="v.creatable" :label="v.label" :value="k" />
          </template>
        </el-select>
        <el-button type="primary" :icon="Search" @click="fetchList">查询</el-button>
      </div>

      <el-table v-loading="loading" :data="tableData" empty-text=" " :row-class-name="rowClassName">
        <el-table-column prop="title" label="标题" min-width="230" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="order-cell">
              <div class="order-cell__title">
                <span class="title-text" @click="$router.push(`/workorder/detail/${row.id}`)">{{ row.title }}</span>
                <el-tag v-if="isOrderTimeout(row)" type="danger" size="small" effect="dark" class="timeout-chip">超时</el-tag>
              </div>
              <span class="order-cell__no">{{ row.orderNo }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="submitterName" label="提交人" width="90" />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag size="small" effect="plain">{{ ORDER_TYPE[row.type]?.label || row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="95">
          <template #default="{ row }"><StatusTag :status="row.status" /></template>
        </el-table-column>
        <el-table-column prop="priority" label="优先级" width="85">
          <template #default="{ row }"><PriorityTag v-if="row.priority" :priority="row.priority" /></template>
        </el-table-column>
        <el-table-column prop="createdAt" label="提交时间" width="150">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="80" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="$router.push(`/workorder/detail/${row.id}`)">详情</el-button>
          </template>
        </el-table-column>
        <template #empty>
          <div class="empty-state">
            <el-icon class="empty-icon"><Files /></el-icon>
            <p class="empty-text">暂无工单数据</p>
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
import { ref, reactive, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search, Download } from '@element-plus/icons-vue'
import { ORDER_STATUS, ORDER_TYPE } from '@/utils/constants'
import { getAllWorkOrders } from '@/api/workOrder'
import { exportExcel } from '@/api/statistics'
import { formatDate } from '@/utils/format'
import { isOrderTimeout } from '@/utils/time'
import StatusTag from '@/components/StatusTag.vue'
import PriorityTag from '@/components/PriorityTag.vue'

const loading = ref(false)
const exporting = ref(false)
const tableData = ref([])
const total = ref(0)
const query = reactive({ keyword: '', status: '', type: '', page: 1, pageSize: 10 })
const route = useRoute()
// 从工作台卡片跳转携带的多状态筛选（如 PENDING_AI,PENDING_APPROVE）
const routeStatus = ref('')

function applyRouteStatus(val) {
  routeStatus.value = ''
  query.status = ''
  if (val) {
    // 标准单状态 → 同步到下拉框显示；TIMEOUT/多状态 → 仅走 API 级筛选
    if (ORDER_STATUS[val]) query.status = val
    else routeStatus.value = val
  }
  query.page = 1
}

onMounted(() => {
  applyRouteStatus(route.query.status)
  fetchList()
})

// 已在本页时再次从工作台跳转，路由参数变化后重新筛选
watch(() => route.query.status, (val) => {
  applyRouteStatus(val)
  fetchList()
})

function rowClassName({ row }) {
  if (!isOrderTimeout(row)) return ''
  const p = (row.priority || 'NORMAL').toLowerCase()
  return `timeout-${p}`
}

async function fetchList() {
  loading.value = true
  try {
    const params = { ...query, status: query.status || routeStatus.value }
    const res = await getAllWorkOrders(params)
    tableData.value = res.data?.records || []
    total.value = res.data?.total || 0
  } catch {} finally {
    loading.value = false
  }
}

function resetAndFetch() {
  routeStatus.value = ''
  query.page = 1
  fetchList()
}

async function handleExport() {
  exporting.value = true
  try {
    const params = { ...query, status: query.status || routeStatus.value }
    const res = await exportExcel(params)
    const blob = new Blob([res], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `全部工单_${new Date().toISOString().slice(0, 10)}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
    ElMessage.success(`导出成功：全部工单_${new Date().toISOString().slice(0, 10)}.xlsx`)
  } catch {
    ElMessage.error('导出失败')
  } finally {
    exporting.value = false
  }
}
</script>

<style lang="scss" scoped>
.order-cell {
  display: flex;
  flex-direction: column;
  gap: 3px;
  line-height: 1.35;

  &__title {
    display: flex;
    align-items: center;
    gap: 6px;

    .title-text {
      font-weight: 600;
      font-size: $text-md;
      color: $text-primary;
      cursor: pointer;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;

      &:hover { color: $brand; }
    }

    .timeout-chip { flex-shrink: 0; }
  }

  &__no {
    font-family: $font-mono;
    font-size: $text-sm;
    color: $text-muted;
  }
}
</style>

<style lang="scss">
// 超时行：统一品牌浅蓝底（契合蓝色主题，超时标签已足够表达严重度）
.el-table .timeout-urgent > td.el-table__cell,
.el-table .timeout-normal > td.el-table__cell,
.el-table .timeout-low > td.el-table__cell {
  background-color: #f0f6ff !important;
}
.el-table .timeout-urgent:hover > td.el-table__cell,
.el-table .timeout-normal:hover > td.el-table__cell,
.el-table .timeout-low:hover > td.el-table__cell {
  background-color: #e8f1ff !important;
}
</style>
