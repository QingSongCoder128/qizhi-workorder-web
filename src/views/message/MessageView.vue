<template>
  <div class="page-container">
    <div class="page-card">
      <div class="page-header">
        <h3>消息中心</h3>
        <el-button type="primary" link @click="handleReadAll">全部已读</el-button>
      </div>
      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column width="10">
          <template #default="{ row }">
            <el-badge is-dot :hidden="row.isRead" />
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
        <el-table-column prop="msgType" label="类型" width="120">
          <template #default="{ row }">{{ MSG_TYPE[row.msgType] || row.msgType }}</template>
        </el-table-column>
        <el-table-column prop="createdAt" label="时间" width="170">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button v-if="!row.isRead" link type="primary" @click="handleRead(row)">标记已读</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
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
import { ElMessage } from 'element-plus'
import { MSG_TYPE } from '@/utils/constants'
import { getMessageList, markAsRead, markAllAsRead, deleteMessage } from '@/api/message'
import { useMessageStore } from '@/store/message'
import { formatDate } from '@/utils/format'

const messageStore = useMessageStore()
const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const query = reactive({ page: 1, pageSize: 10 })

onMounted(() => fetchList())

async function fetchList() {
  loading.value = true
  try {
    const res = await getMessageList(query)
    tableData.value = res.data?.records || []
    total.value = res.data?.total || 0
  } catch {} finally { loading.value = false }
}

async function handleRead(row) {
  try {
    await markAsRead(row.id)
    row.isRead = true
    messageStore.decrement()
  } catch {}
}

async function handleReadAll() {
  try {
    await markAllAsRead()
    tableData.value.forEach(r => r.isRead = true)
    messageStore.clear()
    ElMessage.success('已全部标记为已读')
  } catch {}
}

async function handleDelete(row) {
  try {
    await deleteMessage(row.id)
    fetchList()
    messageStore.fetchUnreadCount()
  } catch {}
}
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-header h3 { font-size: 18px; }
.pagination-wrap { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
