<template>
  <div class="page-container">
    <div class="page-card">
      <h3 class="page-title">待审批工单</h3>
      <el-table :data="tableData" v-loading="loading" stripe :row-class-name="rowClass">
        <el-table-column prop="orderNo" label="工单编号" width="180" />
        <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
        <el-table-column prop="submitterName" label="提交人" width="100" />
        <el-table-column prop="priority" label="优先级" width="90">
          <template #default="{ row }"><PriorityTag v-if="row.priority" :priority="row.priority" /></template>
        </el-table-column>
        <el-table-column prop="createdAt" label="提交时间" width="170">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="$router.push(`/approve/detail/${row.id}`)">审批</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-wrap">
        <el-pagination v-model:current-page="query.page" v-model:page-size="query.pageSize" :total="total" :page-sizes="[10,20,50]" layout="total, sizes, prev, pager, next" @size-change="fetchList" @current-change="fetchList" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getPendingApprovals } from '@/api/approve'
import { formatDate } from '@/utils/format'
import PriorityTag from '@/components/PriorityTag.vue'

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const query = reactive({ page: 1, pageSize: 10 })

onMounted(() => fetchList())

async function fetchList() {
  loading.value = true
  try {
    const res = await getPendingApprovals(query)
    tableData.value = res.data?.records || []
    total.value = res.data?.total || 0
  } catch {} finally { loading.value = false }
}

function rowClass({ row }) {
  return row.priority === 'URGENT' ? 'urgent-row' : ''
}
</script>

<style scoped>
.page-title { margin-bottom: 20px; font-size: 18px; }
.pagination-wrap { margin-top: 16px; display: flex; justify-content: flex-end; }
:deep(.urgent-row) { background-color: #fff1f0 !important; }
</style>
