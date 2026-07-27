<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <div class="page-title"><el-icon><Key /></el-icon> 角色管理</div>
        <div class="page-desc">管理系统内置角色与自定义角色的权限定义</div>
      </div>
      <el-button type="primary" :icon="Plus" @click="openDialog()">新增角色</el-button>
    </div>

    <div class="page-card">
      <el-table v-loading="loading" :data="tableData" empty-text=" ">
        <el-table-column prop="roleCode" label="角色编码" width="160">
          <template #default="{ row }">
            <span class="role-code">{{ row.roleCode || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="roleName" label="角色名称" width="160">
          <template #default="{ row }">
            <div class="role-name-cell">
              <span class="role-avatar">{{ (row.roleName || '?')[0] }}</span>
              <span class="role-name">{{ row.roleName || '—' }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="职责描述" min-width="240" show-overflow-tooltip>
          <template #default="{ row }">{{ row.description || '—' }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 'ENABLED' ? 'success' : 'info'" size="small" effect="light">
              {{ row.status === 'ENABLED' ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDialog(row)">编辑</el-button>
          </template>
        </el-table-column>
        <template #empty>
          <div class="empty-state">
            <el-icon class="empty-icon"><Key /></el-icon>
            <p class="empty-text">暂无角色数据</p>
            <p class="empty-sub">点击右上角「新增角色」创建第一个角色</p>
          </div>
        </template>
      </el-table>
    </div>

    <el-dialog v-model="dialogVisible" width="520px" class="role-dialog" :close-on-click-modal="false" destroy-on-close>
      <template #header>
        <div class="dialog-header">
          <h3>{{ editingId ? '编辑角色' : '新增角色' }}</h3>
          <p>{{ editingId ? '修改角色信息与权限分配' : '创建一个新的自定义角色' }}</p>
        </div>
      </template>
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="role-form">
        <el-form-item label="角色编码" prop="roleCode">
          <el-input v-model="form.roleCode" :disabled="!!editingId" placeholder="如 DEPT_MANAGER" />
        </el-form-item>
        <el-form-item label="角色名称" prop="roleName">
          <el-input v-model="form.roleName" placeholder="如 部门经理" />
        </el-form-item>
        <el-form-item label="职责描述">
          <el-input
            v-model="form.description" type="textarea" :rows="2" maxlength="200" show-word-limit
            placeholder="描述该角色的主要职责与权限范围"
          />
        </el-form-item>
        <el-form-item v-if="editingId" label="权限分配">
          <div class="perm-panel">
            <el-checkbox-group v-model="checkedPermissions">
              <el-checkbox
                v-for="perm in allPermissions" :key="perm.permissionCode"
                :label="perm.permissionCode" :value="perm.permissionCode"
              >{{ perm.permissionName }}</el-checkbox>
            </el-checkbox-group>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Key, Plus } from '@element-plus/icons-vue'
import { getRoleList, createRole, updateRole, getAllPermissions, getRolePermissions, updateRolePermissions } from '@/api/user'

const loading = ref(false)
const saving = ref(false)
const tableData = ref([])
const dialogVisible = ref(false)
const editingId = ref(null)
const formRef = ref()
const form = reactive({ roleCode: '', roleName: '', description: '' })
const allPermissions = ref([])
const checkedPermissions = ref([])
// 校验仅在点击保存按钮时触发
const rules = {
  roleCode: [{ required: true, message: '请输入角色编码', trigger: 'submit' }],
  roleName: [{ required: true, message: '请输入角色名称', trigger: 'submit' }]
}

onMounted(() => fetchList())

async function fetchList() {
  loading.value = true
  try {
    const res = await getRoleList()
    tableData.value = res.data || []
  } catch {} finally { loading.value = false }
}

async function openDialog(row) {
  editingId.value = row?.id || null
  Object.assign(form, row
    ? { roleCode: row.roleCode, roleName: row.roleName, description: row.description }
    : { roleCode: '', roleName: '', description: '' })
  // 加载权限列表
  if (!allPermissions.value.length) {
    try {
      const res = await getAllPermissions()
      allPermissions.value = res.data || []
    } catch {}
  }
  // 加载角色已有权限
  if (row?.id) {
    try {
      const res = await getRolePermissions(row.id)
      checkedPermissions.value = res.data || []
    } catch { checkedPermissions.value = [] }
  } else {
    checkedPermissions.value = []
  }
  dialogVisible.value = true
}

async function handleSave() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    if (editingId.value) {
      await updateRole(editingId.value, form)
      await updateRolePermissions(editingId.value, checkedPermissions.value)
      ElMessage.success(`角色「${form.roleName}」更新成功`)
    } else {
      await createRole(form)
      ElMessage.success(`角色「${form.roleName}」创建成功`)
    }
    dialogVisible.value = false
    fetchList()
  } catch {} finally { saving.value = false }
}
</script>

<style lang="scss" scoped>
.role-code {
  font-family: $font-mono;
  font-size: $text-sm;
  color: $text-secondary;
  background: $gray-100;
  padding: 2px 8px;
  border-radius: $radius-xs;
  border: 1px solid $border-light;
}

.role-name-cell {
  display: flex;
  align-items: center;
  gap: $space-2;

  .role-avatar {
    width: 28px;
    height: 28px;
    border-radius: $radius-sm;
    background: $brand-light;
    color: $brand;
    font-size: $text-sm;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .role-name {
    font-weight: 600;
    color: $text-primary;
  }
}

:deep(.role-dialog) {
  border-radius: 16px;
  .el-dialog__header { padding: 24px 28px 0; margin: 0; }
  .el-dialog__body { padding: 20px 28px; }
  .el-dialog__footer { padding: 0 28px 24px; }
}
.dialog-header {
  h3 { margin: 0 0 3px; font-size: 17px; color: #1a2b42; font-weight: 700; }
  p { margin: 0; font-size: 12.5px; color: #94a3b8; }
}
.role-form {
  .el-form-item { margin-bottom: 18px; }
  .el-form-item__label { font-size: 13px; color: #4a5b76; font-weight: 600; padding-bottom: 6px; }
}
.perm-panel {
  width: 100%;
  padding: 14px 16px;
  border-radius: 10px;
  background: #f8fafc;
  border: 1px solid #e8edf5;

  .el-checkbox-group {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px 12px;
  }
  .el-checkbox {
    height: auto;
    margin-right: 0;
    font-size: 13px;
  }
}
.dialog-footer {
  display: flex; justify-content: flex-end; gap: 12px;
}
</style>
