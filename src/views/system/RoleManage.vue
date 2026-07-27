<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <div class="page-title"><el-icon><Key /></el-icon> 角色管理</div>
        <div class="page-desc">管理系统内置角色与自定义角色的权限分配，保障数据安全与职责清晰</div>
      </div>
      <el-button type="primary" :icon="Plus" @click="openDialog()">新增角色</el-button>
    </div>

    <!-- 统计卡片 -->
    <div class="stat-cards">
      <div class="stat-card blue">
        <div class="stat-icon"><el-icon :size="22"><Files /></el-icon></div>
        <div class="stat-info">
          <span class="stat-value">{{ builtinCount }} <em>个</em></span>
          <span class="stat-label">内置角色</span>
        </div>
      </div>
      <div class="stat-card green">
        <div class="stat-icon"><el-icon :size="22"><User /></el-icon></div>
        <div class="stat-info">
          <span class="stat-value">{{ assignedUsers }} <em>人</em></span>
          <span class="stat-label">已分配用户</span>
        </div>
      </div>
      <div class="stat-card orange">
        <div class="stat-icon"><el-icon :size="22"><CircleCheck /></el-icon></div>
        <div class="stat-info">
          <span class="stat-value">{{ enabledCount }} <em>个</em></span>
          <span class="stat-label">启用角色</span>
        </div>
      </div>
    </div>

    <!-- 角色列表 -->
    <div class="page-card">
      <el-table v-loading="loading" :data="tableData" empty-text=" " row-class-name="role-row" class="role-table">
        <el-table-column label="角色名称" width="150" align="center">
          <template #default="{ row }">
            <div class="role-name-cell">
              <span class="role-icon" :class="roleColor(row.roleCode)">{{ (row.roleName || '?')[0] }}</span>
              <span class="role-name">{{ row.roleName }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="角色说明" min-width="160" align="center">
          <template #default="{ row }">
            <span class="role-desc">{{ row.description || '暂无说明' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="核心权限" min-width="260" align="center">
          <template #default="{ row }">
            <div class="perm-tags">
              <template v-if="rolePermsMap[row.id]?.length">
                <span v-for="code in rolePermsMap[row.id].slice(0, 3)" :key="code" class="perm-tag">
                  {{ permNameMap[code] || code }}
                </span>
                <span v-if="rolePermsMap[row.id].length > 3" class="perm-tag more">
                  +{{ rolePermsMap[row.id].length - 3 }}
                </span>
              </template>
              <span v-else class="perm-empty">未分配</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="分配人数" width="80" align="center">
          <template #default="{ row }">
            <span class="user-count">{{ userCountMap[row.roleCode] ?? 0 }}人</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }">
            <span class="status-badge" :class="row.status === 'ENABLED' ? 'on' : 'off'">
              {{ row.status === 'ENABLED' ? '启用' : '停用' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" align="center">
          <template #default="{ row }">
            <div class="ops">
              <el-button link type="primary" @click="openDialog(row)">编辑</el-button>
              <el-button link type="primary" @click="openPermDialog(row)">权限配置</el-button>
            </div>
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

    <!-- 新增/编辑角色弹窗 -->
    <el-dialog v-model="dialogVisible" width="480px" class="role-dialog" :close-on-click-modal="false" destroy-on-close>
      <template #header>
        <div class="dialog-header">
          <h3>{{ editingId ? '编辑角色' : '新增角色' }}</h3>
          <p>{{ editingId ? '修改角色基本信息' : '创建一个新的自定义角色' }}</p>
        </div>
      </template>
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="role-form">
        <el-form-item label="角色名称" prop="roleName">
          <el-input v-model="form.roleName" placeholder="如 部门经理" />
        </el-form-item>
        <el-form-item label="职责描述">
          <el-input v-model="form.description" type="textarea" :rows="2" maxlength="200" show-word-limit
            placeholder="描述该角色的主要职责与权限范围" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 权限配置弹窗 -->
    <el-dialog v-model="permDialogVisible" width="540px" class="role-dialog" :close-on-click-modal="false" destroy-on-close>
      <template #header>
        <div class="dialog-header">
          <h3>权限配置</h3>
          <p>为「{{ permRoleName }}」分配系统功能权限</p>
        </div>
      </template>
      <div class="perm-panel">
        <el-checkbox-group v-model="checkedPermissions">
          <el-checkbox v-for="perm in allPermissions" :key="perm.permissionCode"
            :label="perm.permissionCode" :value="perm.permissionCode">
            {{ perm.permissionName }}
          </el-checkbox>
        </el-checkbox-group>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="permDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="savingPerm" @click="handlePermSave">保存权限</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Key, Plus, Files, User, CircleCheck } from '@element-plus/icons-vue'
import { getRoleList, createRole, updateRole, getAllPermissions, getRolePermissions, updateRolePermissions, getUsersByRole } from '@/api/user'

const loading = ref(false)
const saving = ref(false)
const savingPerm = ref(false)
const tableData = ref([])
const dialogVisible = ref(false)
const permDialogVisible = ref(false)
const editingId = ref(null)
const formRef = ref()
const form = reactive({ roleCode: '', roleName: '', description: '' })
const allPermissions = ref([])
const checkedPermissions = ref([])
const permRoleName = ref('')
const permRoleId = ref(null)
const rolePermsMap = ref({})
const userCountMap = ref({})

const rules = {
  roleName: [{ required: true, message: '请输入角色名称', trigger: 'blur' }]
}

// 统计
const builtinCount = computed(() => tableData.value.filter(r => isBuiltin(r.roleCode)).length)
const enabledCount = computed(() => tableData.value.filter(r => r.status === 'ENABLED').length)
const assignedUsers = computed(() => Object.values(userCountMap.value).reduce((s, n) => s + n, 0))

// 权限名称映射
const permNameMap = computed(() => {
  const map = {}
  allPermissions.value.forEach(p => { map[p.permissionCode] = p.permissionName })
  return map
})

function isBuiltin(code) {
  return ['EMPLOYEE', 'APPROVER', 'ADMIN'].includes(code)
}
function roleColor(code) {
  const map = { EMPLOYEE: 'blue', APPROVER: 'green', ADMIN: 'orange' }
  return map[code] || 'purple'
}

onMounted(async () => {
  await fetchList()
  loadPermissions()
})

async function fetchList() {
  loading.value = true
  try {
    const res = await getRoleList()
    tableData.value = res.data || []
    // 加载每个角色的权限和用户数
    for (const role of tableData.value) {
      loadRolePerms(role.id)
      loadUserCount(role.roleCode)
    }
  } catch {} finally { loading.value = false }
}

async function loadPermissions() {
  try {
    const res = await getAllPermissions()
    allPermissions.value = res.data || []
  } catch {}
}

async function loadRolePerms(roleId) {
  try {
    const res = await getRolePermissions(roleId)
    rolePermsMap.value[roleId] = res.data || []
  } catch { rolePermsMap.value[roleId] = [] }
}

async function loadUserCount(roleCode) {
  try {
    const res = await getUsersByRole(roleCode)
    userCountMap.value[roleCode] = (res.data || []).length
  } catch { userCountMap.value[roleCode] = 0 }
}

function openDialog(row) {
  editingId.value = row?.id || null
  Object.assign(form, row
    ? { roleCode: row.roleCode, roleName: row.roleName, description: row.description }
    : { roleCode: '', roleName: '', description: '' })
  dialogVisible.value = true
}

// 自动生成角色编码（用户无需感知）
function genRoleCode() {
  return 'CUSTOM_' + Date.now().toString(36).toUpperCase()
}

async function openPermDialog(row) {
  permRoleId.value = row.id
  permRoleName.value = row.roleName
  if (!allPermissions.value.length) await loadPermissions()
  try {
    const res = await getRolePermissions(row.id)
    checkedPermissions.value = res.data || []
  } catch { checkedPermissions.value = [] }
  permDialogVisible.value = true
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
      await createRole({ ...form, roleCode: genRoleCode() })
      ElMessage.success(`角色「${form.roleName}」创建成功`)
    }
    dialogVisible.value = false
    fetchList()
  } catch {} finally { saving.value = false }
}

async function handlePermSave() {
  savingPerm.value = true
  try {
    await updateRolePermissions(permRoleId.value, checkedPermissions.value)
    ElMessage.success('权限配置已保存')
    permDialogVisible.value = false
    loadRolePerms(permRoleId.value)
  } catch {} finally { savingPerm.value = false }
}
</script>

<style lang="scss" scoped>
// ─── 统计卡片 ───
.stat-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $space-4;
  margin-bottom: $space-5;
}
.stat-card {
  display: flex;
  align-items: center;
  gap: $space-4;
  padding: $space-5 $space-6;
  border-radius: $radius-lg;
  background: $bg-card;
  border: 1px solid $border-light;
  box-shadow: $shadow-xs;
  transition: box-shadow $duration-normal $ease-out;

  &:hover { box-shadow: $shadow-md; }

  .stat-icon {
    width: 44px;
    height: 44px;
    border-radius: $radius-md;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .stat-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .stat-value {
    font-size: $text-2xl;
    font-weight: 700;
    color: $text-primary;
    em { font-style: normal; font-size: $text-sm; font-weight: 400; color: $text-secondary; margin-left: 2px; }
  }
  .stat-label { font-size: $text-sm; color: $text-secondary; }

  &.blue .stat-icon { background: #eff6ff; color: #2563eb; }
  &.green .stat-icon { background: #ecfdf5; color: #059669; }
  &.orange .stat-icon { background: #fff7ed; color: #d97706; }
}

// ─── 表格对齐 ───
:deep(.role-table) {
  table { table-layout: fixed; border-spacing: 0; }

  .el-table__header-wrapper {
    border-bottom: 1px solid $border-light;
    margin-bottom: 0;
  }
  .el-table__body-wrapper {
    margin-top: 0;
  }
  th.el-table__cell,
  td.el-table__cell {
    padding: 10px 0;
    vertical-align: middle;
  }
  th.el-table__cell {
    background: #fafbfc;
  }
  th .cell {
    font-weight: 600;
    color: $text-secondary;
    font-size: 13px;
  }
}

// ─── 表格内 ───
.role-name-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  gap: 10px;

  .role-icon {
    width: 30px;
    height: 30px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    &.blue { background: #eff6ff; color: #2563eb; }
    &.green { background: #ecfdf5; color: #059669; }
    &.orange { background: #fff7ed; color: #d97706; }
    &.purple { background: #f5f3ff; color: #7c3aed; }
  }
  .role-name { font-weight: 600; color: $text-primary; font-size: 14px; white-space: nowrap; }
}

.role-desc { color: $text-secondary; font-size: 13px; }

.perm-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  justify-content: center;
  width: 100%;

  .perm-tag {
    display: inline-flex;
    align-items: center;
    height: 24px;
    padding: 0 10px;
    border-radius: $radius-full;
    font-size: 12px;
    line-height: 1;
    color: $gray-700;
    background: $gray-100;
    border: 1px solid $gray-300;
    white-space: nowrap;

    &.more {
      background: $brand-light;
      color: $brand;
      border-color: $brand-subtle;
      font-weight: 600;
    }
  }
  .perm-empty { font-size: 12px; color: $text-muted; }
}

.user-count {
  font-size: 13px;
  font-weight: 600;
  color: $text-primary;
  white-space: nowrap;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 12px;
  border-radius: $radius-full;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;

  &.on { background: #ecfdf5; color: #059669; }
  &.off { background: $gray-200; color: $gray-600; }
}

.ops {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: $space-1;
  white-space: nowrap;
}

// ─── 弹窗 ───
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
  padding: 16px 18px;
  border-radius: 10px;
  background: #f8fafc;
  border: 1px solid #e8edf5;
  max-height: 360px;
  overflow-y: auto;

  .el-checkbox-group {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px 16px;
  }
  .el-checkbox { height: auto; margin-right: 0; font-size: 13px; }
}
.dialog-footer { display: flex; justify-content: flex-end; gap: 12px; }
</style>
