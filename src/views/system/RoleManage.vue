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

    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑角色' : '新增角色'" width="480px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="角色编码" prop="roleCode">
          <el-input v-model="form.roleCode" :disabled="!!editingId" placeholder="如 DEPT_MANAGER" />
        </el-form-item>
        <el-form-item label="角色名称" prop="roleName">
          <el-input v-model="form.roleName" placeholder="如 部门经理" />
        </el-form-item>
        <el-form-item label="职责描述">
          <el-input
            v-model="form.description" type="textarea" :rows="3" maxlength="200" show-word-limit
            placeholder="描述该角色的主要职责与权限范围"
          />
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
const form = reactive({ roleCode: '', roleName: '', description: '' })
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

function openDialog(row) {
  editingId.value = row?.id || null
  Object.assign(form, row
    ? { roleCode: row.roleCode, roleName: row.roleName, description: row.description }
    : { roleCode: '', roleName: '', description: '' })
  dialogVisible.value = true
}

async function handleSave() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    if (editingId.value) {
      await updateRole(editingId.value, form)
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
</style>
