<template>
  <div class="page-container">
    <div class="page-card">
      <div class="page-header">
        <h3>死信管理</h3>
        <el-tag type="danger">系统运维</el-tag>
      </div>
      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="msgType" label="消息类型" width="130" />
        <el-table-column prop="targetUserId" label="目标用户" width="110" />
        <el-table-column prop="content" label="消息内容" min-width="240" show-overflow-tooltip />
        <el-table-column prop="errorReason" label="失败原因" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <span style="color:#F56C6C">{{ row.errorReason }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="retryCount" label="重试次数" width="90" />
        <el-table-column prop="createdAt" label="创建时间" width="170" />
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleRetry(row)">重试</el-button>
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
import { ElMessage, ElMessageBox } from 'element-plus'
import { getDeadLetterList, retryDeadLetter } from '@/api/message'

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const query = reactive({ page: 1, pageSize: 10 })

onMounted(() => fetchList())

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
    await ElMessageBox.confirm('确定重试该消息吗？', '确认')
    await retryDeadLetter(row.id)
    ElMessage.success('已提交重试')
    fetchList()
  } catch {}
}
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-header h3 { font-size: 18px; }
.pagination-wrap { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
