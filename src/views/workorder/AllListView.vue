<template>
  <div class="page-container">
    <div class="page-card">
      <h3 class="page-title">全部工单</h3>
      <div class="search-bar">
        <el-input v-model="query.keyword" placeholder="工单编号/标题" clearable style="width: 200px;" />
        <el-select v-model="query.status" placeholder="状态" clearable style="width: 130px;">
          <el-option v-for="(v, k) in ORDER_STATUS" :key="k" :label="v.label" :value="k" />
        </el-select>
        <el-select v-model="query.type" placeholder="类型" clearable style="width: 130px;">
          <el-option v-for="(v, k) in ORDER_TYPE" :key="k" :label="v.label" :value="k" />
        </el-select>
        <el-button type="primary" @click="fetchList">查询</el-button>
      </div>
      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="orderNo" label="工单编号" width="180" />
        <el-table-column prop="title" label="标题" min-width="180" show-overflow-tooltip />
        <el-table-column prop="submitterName" label="提交人" width="100" />
        <el-table-column prop="type" label="类型" width="110">
          <template #default="{ row }">{{ ORDER_TYPE[row.type]?.label }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }"><StatusTag :status="row.status" /></template>
        </el-table-column>
        <el-table-column prop="priority" label="优先级" width="80">
          <template #default="{ row }"><PriorityTag v-if="row.priority" :priority="row.priority" /></template>
        </el-table-column>
        <el-table-column prop="createdAt" label="提交时间" width="170">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="80" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="$router.push(`/workorder/detail/${row.id}`)">详情</el-button>
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
import { ORDER_STATUS, ORDER_TYPE } from '@/utils/constants'
import { getAllWorkOrders } from '@/api/workOrder'
import { formatDate } from '@/utils/format'
import StatusTag from '@/components/StatusTag.vue'
import PriorityTag from '@/components/PriorityTag.vue'

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const query = reactive({ keyword: '', status: '', type: '', page: 1, pageSize: 10 })

onMounted(() => fetchList())

async function fetchList() {
  loading.value = true
  try {
    const res = await getAllWorkOrders(query)
    tableData.value = res.data?.records || []
    total.value = res.data?.total || 0
  } catch {} finally { loading.value = false }
}
</script>

<style scoped>
.page-title { margin-bottom: 20px; font-size: 18px; }
.pagination-wrap { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
