<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title"><el-icon><Key /></el-icon> 角色管理</div>
      <el-button type="primary" :icon="Plus" @click="openDialog()">新增角色</el-button>
    </div>

    <div class="page-card">
      <el-table :data="tableData" v-loading="loading" stripe empty-text=" ">
        <el-table-column prop="code" label="角色编码" width="140" />
        <el-table-column prop="name" label="角色名称" width="160" />
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">{{ row.description || '—' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDialog(row)">编辑</el-button>
          </template>
        </el-table-column>
        <template #empty>
          <div class="empty-state">
            <el-icon class="empty-icon"><Key /></el-icon>
            <p class="empty-text">暂无角色数据</p>
          </div>
        </template>
      </el-table>
    </div>

    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑角色' : '新增角色'" width="480px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="角色编码" prop="code"><el-input v-model="form.code" :disabled="!!editingId" placeholder="如 APPROVER" /></el-form-item>
        <el-form-item label="角色名称" prop="name"><el-input v-model="form.name" placeholder="如 审批人" /></el-form-item>
        <el-form-item label="描述"><el-input v-model="form.description" type="textarea" :rows="3" maxlength="200" show-word-limit /></el-form-item>
        <el-form-item label="权限">
          <el-checkbox-group v-model="form.permissions">
            <el-checkbox v-for="p in allPermissions" :key="p" :label="p" :value="p">{{ permLabel(p) }}</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Key, Plus } from '@element-plus/icons-vue'
import { getRoleList, createRole, updateRole } from '@/api/user'

const loading = ref(false)
const saving = ref(false)
const tableData = ref([])
const dialogVisible = ref(false)
const editingId = ref(null)
const formRef = ref()
const allPermissions = ['workorder:create', 'workorder:view', 'workorder:approve', 'workorder:manage', 'system:manage', 'statistics:view']
const PERM_LABELS = { 'workorder:create': '创建工单', 'workorder:view': '查看工单', 'workorder:approve': '审批工单', 'workorder:manage': '工单管理', 'system:manage': '系统管理', 'statistics:view': '统计查看' }
function permLabel(p) { return PERM_LABELS[p] || p }
const form = reactive({ code: '', name: '', description: '', permissions: [] })
const rules = {
  code: [{ required: true, message: '请输入角色编码', trigger: 'blur' }],
  name: [{ required: true, message: '请输入角色名称', trigger: 'blur' }]
}

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
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    if (editingId.value) {
      await updateRole(editingId.value, form)
      ElMessage.success(`角色「${form.name}」更新成功`)
    } else {
      await createRole(form)
      ElMessage.success(`角色「${form.name}」创建成功`)
    }
    dialogVisible.value = false
    fetchList()
  } catch {} finally { saving.value = false }
}
</script>

<style lang="scss" scoped>
</style>
