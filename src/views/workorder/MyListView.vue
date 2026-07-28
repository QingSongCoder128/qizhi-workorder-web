<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title"><el-icon><Document /></el-icon> 我的工单</div>
      <el-button type="primary" :icon="Plus" @click="$router.push('/workorder/create')">新建工单</el-button>
    </div>

    <!-- 状态 Tab 切换 -->
    <div class="status-tabs">
      <div class="tab-item" :class="{ active: !query.status }" @click="switchTab('')">
        全部 <span class="tab-count">{{ total }}</span>
      </div>
      <div
        v-for="(v, k) in filterStatuses" :key="k" class="tab-item"
        :class="{ active: query.status === k }" @click="switchTab(k)"
      >
        {{ v.label }}
      </div>
    </div>

    <div class="page-card">
      <!-- 筛选栏 -->
      <div class="search-bar">
        <el-select v-model="query.type" placeholder="工单类型" clearable style="width: 140px" @change="fetchList">
          <template v-for="(v, k) in ORDER_TYPE" :key="k">
            <el-option v-if="v.creatable" :label="v.label" :value="k" />
          </template>
        </el-select>
        <el-select v-model="query.priority" placeholder="优先级" clearable style="width: 120px" @change="fetchList">
          <el-option v-for="(v, k) in PRIORITY" :key="k" :label="v.label" :value="k" />
        </el-select>
        <el-input
          v-model="query.keyword" placeholder="搜索标题/编号" clearable style="width: 200px"
          :prefix-icon="Search" @keyup.enter="fetchList" @clear="fetchList"
        />
        <el-button type="primary" :icon="Search" @click="fetchList">查询</el-button>
      </div>

      <!-- 表格 -->
      <el-table
        v-loading="loading" :data="tableData" class="order-table"
        empty-text=" " @row-click="goDetail"
      >
        <el-table-column prop="orderNo" label="工单编号" width="175">
          <template #default="{ row }">
            <span class="order-no">{{ row.orderNo }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" min-width="220" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="title-cell">
              <span>{{ row.title }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="type" label="类型" width="110">
          <template #default="{ row }">
            <el-tag
              size="small" effect="plain" :color="ORDER_TYPE[row.type]?.color + '12'"
              :style="{ color: ORDER_TYPE[row.type]?.color, borderColor: ORDER_TYPE[row.type]?.color + '40' }"
            >
              {{ ORDER_TYPE[row.type]?.label || row.type }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="aiCategory" label="AI分派" width="100">
          <template #default="{ row }">
            <el-tooltip v-if="row.aiCategory" content="AI 智能识别的处理部门/类别" placement="top">
              <span class="ai-tag">{{ AI_CATEGORY[row.aiCategory] || row.aiCategory }}</span>
            </el-tooltip>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }"><StatusTag :status="row.status" /></template>
        </el-table-column>
        <el-table-column prop="priority" label="优先级" width="80">
          <template #default="{ row }">
            <PriorityTag v-if="row.priority" :priority="row.priority" />
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="提交时间" width="160">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <div class="table-actions">
              <el-button link type="primary" size="small" @click.stop="$router.push(`/workorder/detail/${row.id}`)">详情</el-button>
              <el-button v-if="row.status === 'PENDING_AI'" link type="danger" size="small" @click.stop="handleRetry(row)">重试</el-button>
            </div>
          </template>
        </el-table-column>
        <!-- 空状态 -->
        <template #empty>
          <div class="empty-state">
            <el-icon class="empty-icon"><Document /></el-icon>
            <p class="empty-text">暂无工单数据</p>
            <el-button type="primary" size="small" @click="$router.push('/workorder/create')">去创建工单</el-button>
          </div>
        </template>
      </el-table>

      <!-- 分页 -->
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
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import { ORDER_STATUS, ORDER_TYPE, PRIORITY, AI_CATEGORY } from '@/utils/constants'
import { getMyWorkOrders, retryWorkOrder } from '@/api/workOrder'
import { formatDate } from '@/utils/format'
import StatusTag from '@/components/StatusTag.vue'
import PriorityTag from '@/components/PriorityTag.vue'

const router = useRouter()
const loading = ref(false)
const tableData = ref([])
const total = ref(0)

const filterStatuses = { PENDING_APPROVE: ORDER_STATUS.PENDING_APPROVE, APPROVING: ORDER_STATUS.APPROVING, APPROVED: ORDER_STATUS.APPROVED, COMPLETED: ORDER_STATUS.COMPLETED, REJECTED: ORDER_STATUS.REJECTED }

const query = reactive({ status: '', type: '', priority: '', keyword: '', page: 1, pageSize: 10 })

onMounted(() => fetchList())

async function fetchList() {
  loading.value = true
  try {
    const res = await getMyWorkOrders(query)
    tableData.value = res.data?.records || []
    total.value = res.data?.total || 0
  } catch {} finally {
    loading.value = false
  }
}

function switchTab(status) {
  query.status = status
  query.page = 1
  fetchList()
}

function goDetail(row) {
  router.push(`/workorder/detail/${row.id}`)
}

async function handleRetry(row) {
  try {
    await ElMessageBox.confirm(
      '工单处理异常，是否重新触发AI分析与审批流程？',
      '重试确认',
      { confirmButtonText: '确认重试', cancelButtonText: '取消', type: 'warning' }
    )
  } catch { return }
  try {
    await retryWorkOrder(row.id)
    ElMessage.success('重试成功，工单已重新进入审批流程')
    fetchList()
  } catch {
    // 错误已在拦截器处理
  }
}
</script>

<style scoped lang="scss">
.status-tabs {
  display: flex;
  gap: $space-2;
  margin-bottom: $space-4;
  flex-wrap: wrap;

  .tab-item {
    padding: 6px 16px;
    border-radius: $radius-full;
    font-size: $text-base;
    color: $text-secondary;
    background: $bg-card;
    border: 1px solid $border-color;
    cursor: pointer;
    transition: all $duration-fast $ease-in-out;
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: 500;

    &:hover { border-color: $brand; color: $brand; }

    &.active {
      background: $brand;
      color: #fff;
      border-color: $brand;
    }

    .tab-count {
      font-size: $text-xs;
      background: rgba(0,0,0,0.06);
      padding: 1px 6px;
      border-radius: $radius-full;
      font-variant-numeric: tabular-nums;
    }

    &.active .tab-count {
      background: rgba(255,255,255,0.2);
    }
  }
}

.order-table {
  :deep(tr) { cursor: pointer; }
}

.order-no {
  font-family: $font-mono;
  font-size: $text-sm;
  color: $text-secondary;
}

.title-cell {
  display: flex;
  align-items: center;
  gap: 6px;
}

.ai-tag {
  font-size: $text-sm;
  color: $brand;
  background: $brand-light;
  padding: 2px 8px;
  border-radius: $radius-xs;
  font-weight: 500;
}

.text-muted {
  color: $text-muted;
  font-size: $text-sm;
}

</style>
