<template>
  <div class="page-container">
    <div class="page-card">
      <div class="page-header">
        <h3>角色管理</h3>
        <el-button type="primary" @click="openDialog()">新增角色</el-button>
      </div>
      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="code" label="角色编码" width="140" />
        <el-table-column prop="name" label="角色名称" width="160" />
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDialog(row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑角色' : '新增角色'" width="480px">
      <el-form :model="form" label-width="90px">
        <el-form-item label="角色编码"><el-input v-model="form.code" :disabled="!!editingId" /></el-form-item>
        <el-form-item label="角色名称"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="描述"><el-input v-model="form.description" type="textarea" :rows="3" /></el-form-item>
        <el-form-item label="权限">
          <el-checkbox-group v-model="form.permissions">
            <el-checkbox v-for="p in allPermissions" :key="p" :label="p">{{ p }}</el-checkbox>
          </el-checkbox-group>
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
import { ElMessage } from 'element-plus'
import { getRoleList, createRole, updateRole } from '@/api/user'

const loading = ref(false)
const tableData = ref([])
const dialogVisible = ref(false)
const editingId = ref(null)
const allPermissions = ['workorder:create', 'workorder:view', 'workorder:approve', 'workorder:manage', 'system:manage', 'statistics:view']
const form = reactive({ code: '', name: '', description: '', permissions: [] })

onMounted(() => fetchList())

async function fetchList() {
  loading.value = true
  try {
    const res = await getRoleList()
    tableData.value = res.data || []
  } catch {} finally { loading.value = false }
}

function openDialog(row) {
  editingId.value = row?.id || null
  Object.assign(form, row || { code: '', name: '', description: '', permissions: [] })
  if (!row) form.permissions = []
  dialogVisible.value = true
}

async function handleSave() {
  try {
    if (editingId.value) { await updateRole(editingId.value, form) }
    else { await createRole(form) }
    ElMessage.success('保存成功')
    dialogVisible.value = false
    fetchList()
  } catch {}
}
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-header h3 { font-size: 18px; }
</style>
