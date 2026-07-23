<template>
  <div class="page-container">
    <div class="page-card">
      <div class="page-header">
        <h3>用户管理</h3>
        <el-button type="primary" @click="openDialog()">新增用户</el-button>
      </div>
      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="username" label="账号" width="130" />
        <el-table-column prop="realName" label="姓名" width="100" />
        <el-table-column prop="deptName" label="部门" width="120" />
        <el-table-column prop="roleCode" label="角色" width="120" />
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">{{ row.status === 1 ? '启用' : '禁用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDialog(row)">编辑</el-button>
            <el-button link type="warning" @click="handleReset(row)">重置密码</el-button>
            <el-button link :type="row.status === 1 ? 'danger' : 'success'" @click="handleToggle(row)">{{ row.status === 1 ? '禁用' : '启用' }}</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-wrap">
        <el-pagination v-model:current-page="query.page" v-model:page-size="query.pageSize" :total="total" :page-sizes="[10,20,50]" layout="total, sizes, prev, pager, next" @size-change="fetchList" @current-change="fetchList" />
      </div>
    </div>

    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑用户' : '新增用户'" width="500px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="账号"><el-input v-model="form.username" :disabled="!!editingId" /></el-form-item>
        <el-form-item v-if="!editingId" label="密码"><el-input v-model="form.password" type="password" /></el-form-item>
        <el-form-item label="姓名"><el-input v-model="form.realName" /></el-form-item>
        <el-form-item label="手机号"><el-input v-model="form.phone" /></el-form-item>
        <el-form-item label="邮箱"><el-input v-model="form.email" /></el-form-item>
        <el-form-item label="部门">
          <el-select v-model="form.deptCode" style="width: 100%;">
            <el-option v-for="d in deptList" :key="d.code" :label="d.name" :value="d.code" />
          </el-select>
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="form.roleCode" style="width: 100%;">
            <el-option v-for="r in roleList" :key="r.code" :label="r.name" :value="r.code" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getUserList, createUser, updateUser, resetPassword, toggleUserStatus, getDeptList, getRoleList } from '@/api/user'

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const deptList = ref([])
const roleList = ref([])
const dialogVisible = ref(false)
const editingId = ref(null)
const query = reactive({ page: 1, pageSize: 10 })
const form = reactive({ username: '', password: '', realName: '', phone: '', email: '', deptCode: '', roleCode: '' })

onMounted(async () => {
  fetchList()
  try { deptList.value = (await getDeptList()).data || [] } catch {}
  try { roleList.value = (await getRoleList()).data || [] } catch {}
})

async function fetchList() {
  loading.value = true
  try {
    const res = await getUserList(query)
    tableData.value = res.data?.records || []
    total.value = res.data?.total || 0
  } catch {} finally { loading.value = false }
}

function openDialog(row) {
  editingId.value = row?.id || null
  Object.assign(form, row || { username: '', password: '', realName: '', phone: '', email: '', deptCode: '', roleCode: '' })
  dialogVisible.value = true
}

async function handleSave() {
  try {
    if (editingId.value) { await updateUser(editingId.value, form) }
    else { await createUser(form) }
    ElMessage.success('保存成功')
    dialogVisible.value = false
    fetchList()
  } catch {}
}

async function handleReset(row) {
  try {
    await ElMessageBox.confirm(`确定重置 ${row.username} 的密码吗？`, '确认')
    await resetPassword(row.id)
    ElMessage.success('密码已重置为 123456')
  } catch {}
}

async function handleToggle(row) {
  try {
    await toggleUserStatus(row.id, row.status === 1 ? 0 : 1)
    fetchList()
  } catch {}
}
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-header h3 { font-size: 18px; }
.pagination-wrap { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
