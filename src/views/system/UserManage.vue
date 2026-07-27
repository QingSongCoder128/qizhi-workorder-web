<template>
  <div class="um-page">
    <!-- Hero 区 -->
    <section class="um-hero">
      <div class="hero-text">
        <h1>用户管理</h1>
        <p>维护系统用户账号，分配角色与权限，确保工单系统安全高效运行。</p>
      </div>
    </section>

    <!-- 统计卡片 -->
    <section class="stats-grid">
      <article class="stat-card" v-for="card in statsCards" :key="card.label">
        <div class="stat-icon" :class="card.tone">
          <el-icon :size="26"><component :is="card.icon" /></el-icon>
        </div>
        <div class="stat-copy">
          <div class="stat-label">{{ card.label }}</div>
          <div class="stat-row"><strong>{{ card.value }}</strong><span>{{ card.meta }}</span></div>
        </div>
      </article>
    </section>

    <!-- 主面板 -->
    <section class="um-panel">
      <div class="toolbar">
        <div class="filters">
          <el-input v-model="query.keyword" class="search-input" clearable placeholder="搜索账号/姓名"
            @keyup.enter="fetchList" @clear="fetchList">
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
          <el-select v-model="query.deptCode" class="small-select" placeholder="全部部门" clearable @change="fetchList">
            <el-option v-for="d in deptList" :key="d.deptCode" :label="d.deptName" :value="d.deptCode" />
          </el-select>
          <el-select v-model="query.roleCode" class="small-select" placeholder="全部角色" clearable @change="fetchList">
            <el-option label="管理" value="ADMIN" />
            <el-option label="审批" value="APPROVER" />
            <el-option label="员工" value="EMPLOYEE" />
          </el-select>
          <el-button type="primary" :icon="Search" @click="fetchList">查询</el-button>
          <el-button :icon="Refresh" @click="resetFilters">重置筛选</el-button>
        </div>
        <div class="actions">
          <el-button type="primary" :icon="Plus" @click="openDialog()">新增用户</el-button>
          <el-button :icon="Download" @click="handleExport">导出</el-button>
          <el-dropdown @command="handleBatch">
            <el-button>
              <el-icon><Grid /></el-icon>
              <span>批量操作</span>
              <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="enable">批量启用</el-dropdown-item>
                <el-dropdown-item command="disable">批量停用</el-dropdown-item>
                <el-dropdown-item command="resetPassword">批量重置密码</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>

      <div class="table-wrap">
        <el-table v-loading="loading" :data="tableData" class="um-table" @selection-change="onSelectionChange">
          <el-table-column type="selection" width="54" />
          <el-table-column prop="username" label="账号" min-width="120">
            <template #default="{ row }">
              <span class="mono-text">{{ row.username }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="realName" label="姓名" min-width="100" />
          <el-table-column prop="deptName" label="部门" min-width="110" />
          <el-table-column label="角色" min-width="100">
            <template #default="{ row }">
              <span class="role-tag" :class="roleClass(row.roleCode)">{{ roleLabel(row.roleCode) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="phone" label="手机号码" min-width="140">
            <template #default="{ row }"><span class="mono-text">{{ row.phone || '—' }}</span></template>
          </el-table-column>
          <el-table-column prop="email" label="邮箱" min-width="200" show-overflow-tooltip>
            <template #default="{ row }"><span class="mono-text">{{ row.email || '—' }}</span></template>
          </el-table-column>
          <el-table-column label="状态" width="110">
            <template #default="{ row }">
              <span class="status-dot" :class="row.status === 'ENABLED' ? 'on' : 'off'">
                <i></i>{{ row.status === 'ENABLED' ? '启用' : '停用' }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <div class="ops">
                <a href="javascript:;" @click="openDialog(row)">编辑</a>
                <el-dropdown trigger="click" @command="(cmd) => handleMoreCommand(cmd, row)">
                  <a href="javascript:;">更多<el-icon><ArrowDown /></el-icon></a>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="reset"><el-icon><Key /></el-icon>重置密码</el-dropdown-item>
                      <el-dropdown-item :command="row.status === 'ENABLED' ? 'disable' : 'enable'" divided>
                        <el-icon><component :is="row.status === 'ENABLED' ? 'Lock' : 'Unlock'" /></el-icon>
                        {{ row.status === 'ENABLED' ? '停用' : '启用' }}
                      </el-dropdown-item>
                      <el-dropdown-item command="delete" divided style="color: #e05252;">
                        <el-icon><Delete /></el-icon>删除用户
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </template>
          </el-table-column>
          <template #empty>
            <div class="empty-state">
              <el-icon class="empty-icon" :size="40"><UserFilled /></el-icon>
              <p>暂无用户数据</p>
            </div>
          </template>
        </el-table>
      </div>

      <div class="footer-bar">
        <span>共 {{ total }} 条</span>
        <el-pagination
          v-model:current-page="query.page"
          v-model:page-size="query.pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          background
          layout="sizes, prev, pager, next"
          @size-change="fetchList"
          @current-change="fetchList"
        />
      </div>
    </section>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑用户' : '新增用户'" width="580px" class="user-dialog" :close-on-click-modal="false">
      <template #header>
        <div class="dialog-header">
          <h3>{{ editingId ? '编辑用户' : '新增用户' }}</h3>
          <p>{{ editingId ? '修改用户基本信息与角色分配' : '创建一个新的系统账号' }}</p>
        </div>
      </template>
      <el-form ref="formRef" :model="form" :rules="formRules" label-position="top" class="user-form">
        <div class="form-row">
          <el-form-item label="账号" prop="username" class="flex-1">
            <el-input v-model="form.username" :disabled="!!editingId" autocomplete="off" placeholder="登录账号，如 zhangsan" :prefix-icon="User" />
          </el-form-item>
          <el-form-item v-if="!editingId" label="密码" prop="password" class="flex-1">
            <el-input v-model="form.password" type="password" autocomplete="new-password" placeholder="至少8位，含大小写+数字" show-password :prefix-icon="Key" />
          </el-form-item>
        </div>
        <el-form-item label="姓名" prop="realName">
          <el-input v-model="form.realName" placeholder="真实姓名" />
        </el-form-item>
        <div class="form-row">
          <el-form-item label="手机号" prop="phone" class="flex-1">
            <el-input v-model="form.phone" placeholder="11位手机号" maxlength="11" />
          </el-form-item>
          <el-form-item label="邮箱" class="flex-1">
            <el-input v-model="form.email" placeholder="选填" />
          </el-form-item>
        </div>
        <div class="form-row">
          <el-form-item label="部门" prop="deptCode" class="flex-1">
            <el-select v-model="form.deptCode" placeholder="请选择部门" style="width: 100%;">
              <el-option v-for="d in deptList" :key="d.deptCode" :label="d.deptName" :value="d.deptCode" />
            </el-select>
          </el-form-item>
          <el-form-item label="角色" prop="roleCode" class="flex-1">
            <el-select v-model="form.roleCode" placeholder="请选择角色" style="width: 100%;">
              <el-option v-for="r in roleList" :key="r.roleCode" :label="r.roleName" :value="r.roleCode" />
            </el-select>
          </el-form-item>
        </div>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false" round>取消</el-button>
          <el-button type="primary" :loading="saving" @click="handleSave" round>{{ editingId ? '保存修改' : '确认创建' }}</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { User, UserFilled, Plus, Search, Refresh, Download, Grid, ArrowDown, Key, Lock, Unlock, CircleCheck, CircleClose, Delete } from '@element-plus/icons-vue'
import { getUserList, createUser, updateUser, resetPassword, toggleUserStatus, getDeptList, getRoleList, getUserStats, exportUsers, batchUserOperation, deleteUser } from '@/api/user'

const ROLE_MAP = {
  ADMIN: { label: '管理', cls: 'role-admin' },
  APPROVER: { label: '审批', cls: 'role-approver' },
  EMPLOYEE: { label: '员工', cls: 'role-employee' },
  SUBMITTER: { label: '提交', cls: 'role-employee' }
}
function roleClass(code) { return ROLE_MAP[code]?.cls || 'role-employee' }
function roleLabel(code) { return ROLE_MAP[code]?.label || code }

// --- 状态 ---
const loading = ref(false)
const saving = ref(false)
const tableData = ref([])
const total = ref(0)
const deptList = ref([])
const roleList = ref([])
const dialogVisible = ref(false)
const editingId = ref(null)
const selectedRows = ref([])
const formRef = ref(null)
const stats = reactive({ total: 0, enabled: 0, disabled: 0 })
const query = reactive({ page: 1, pageSize: 10, keyword: '', roleCode: '', deptCode: '' })
const form = reactive({ username: '', password: '', realName: '', phone: '', email: '', deptCode: '', roleCode: '' })

const formRules = computed(() => ({
  username: [{ required: true, message: '请输入登录账号', trigger: 'submit' }],
  password: editingId.value ? [] : [{ required: true, message: '请设置密码', trigger: 'submit' }],
  realName: [{ required: true, message: '请输入姓名', trigger: 'submit' }],
  phone: [{ pattern: /^1\d{10}$/, message: '请输入正确的11位手机号', trigger: 'submit' }],
  deptCode: [{ required: true, message: '请选择部门', trigger: 'submit' }],
  roleCode: [{ required: true, message: '请选择角色', trigger: 'submit' }]
}))

const statsCards = computed(() => [
  { label: '全部用户', value: stats.total, meta: '系统注册用户总数', icon: UserFilled, tone: 'blue' },
  { label: '启用用户', value: stats.enabled, meta: stats.total ? `占比 ${((stats.enabled / stats.total) * 100).toFixed(1)}%` : '', icon: CircleCheck, tone: 'green' },
  { label: '停用用户', value: stats.disabled, meta: stats.total ? `占比 ${((stats.disabled / stats.total) * 100).toFixed(1)}%` : '', icon: CircleClose, tone: 'red' }
])

// --- 生命周期 ---
onMounted(async () => {
  fetchList()
  fetchStats()
  try { deptList.value = (await getDeptList()).data || [] } catch {}
  try { roleList.value = (await getRoleList()).data || [] } catch {}
})

// --- 数据获取 ---
async function fetchList() {
  loading.value = true
  try {
    const res = await getUserList(query)
    tableData.value = res.data?.records || []
    total.value = res.data?.total || 0
  } catch {} finally { loading.value = false }
}

async function fetchStats() {
  try {
    const res = await getUserStats()
    if (res.data) {
      stats.total = res.data.total || 0
      stats.enabled = res.data.enabled || 0
      stats.disabled = res.data.disabled || 0
    }
  } catch {}
}

function resetFilters() {
  query.keyword = ''
  query.roleCode = ''
  query.deptCode = ''
  query.page = 1
  fetchList()
}

function onSelectionChange(rows) { selectedRows.value = rows }

// --- CRUD ---
function openDialog(row) {
  editingId.value = row?.id || null
  Object.assign(form, row ? { ...row, password: '' } : { username: '', password: '', realName: '', phone: '', email: '', deptCode: '', roleCode: '' })
  dialogVisible.value = true
}

async function handleSave() {
  try { await formRef.value.validate() } catch { return }
  saving.value = true
  try {
    if (editingId.value) {
      await updateUser(editingId.value, { ...form, roleCodes: form.roleCode ? [form.roleCode] : [] })
      ElMessage.success('用户信息保存成功')
    } else {
      await createUser({ ...form, roleCodes: form.roleCode ? [form.roleCode] : [] })
      ElMessage.success('用户创建成功')
    }
    dialogVisible.value = false
    fetchList()
    fetchStats()
  } catch {} finally { saving.value = false }
}

// --- 单用户操作 ---
function handleMoreCommand(command, row) {
  if (command === 'reset') handleReset(row)
  else if (command === 'disable' || command === 'enable') handleToggle(row)
  else if (command === 'delete') handleDelete(row)
}

async function handleReset(row) {
  try {
    await ElMessageBox.confirm(`确定重置 ${row.username} 的密码吗？`, '确认')
    await resetPassword(row.id)
    ElMessage.success('密码已重置为 Qizhi@123')
  } catch {}
}

async function handleToggle(row) {
  const action = row.status === 'ENABLED' ? '停用' : '启用'
  try {
    await ElMessageBox.confirm(`确定${action}用户「${row.realName || row.username}」吗？`, `确认${action}`)
    await toggleUserStatus(row.id, row.status === 'ENABLED' ? 0 : 1)
    ElMessage.success(`已${action}用户「${row.realName || row.username}」`)
    fetchList()
    fetchStats()
  } catch {}
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确定删除用户「${row.realName || row.username}」吗？删除后不可恢复。`, '删除确认', { type: 'warning', confirmButtonText: '确定删除', cancelButtonText: '取消' })
    await deleteUser(row.id)
    ElMessage.success('用户已删除')
    fetchList()
    fetchStats()
  } catch {}
}

// --- 导出 ---
async function handleExport() {
  try {
    const res = await exportUsers({ keyword: query.keyword, roleCode: query.roleCode, deptCode: query.deptCode })
    const blob = new Blob([res], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = '用户列表.csv'
    a.click()
    URL.revokeObjectURL(url)
  } catch { ElMessage.error('导出失败') }
}

// --- 批量操作 ---
async function handleBatch(action) {
  if (!selectedRows.value.length) {
    ElMessage.warning('请先勾选要操作的用户')
    return
  }
  const labelMap = { enable: '批量启用', disable: '批量停用', resetPassword: '批量重置密码' }
  const ids = selectedRows.value.map(r => r.id)
  try {
    await ElMessageBox.confirm(`确定对选中的 ${ids.length} 个用户执行「${labelMap[action]}」吗？`, '确认操作')
    await batchUserOperation({ ids, action })
    ElMessage.success(`${labelMap[action]}成功`)
    fetchList()
    fetchStats()
  } catch {}
}
</script>

<style lang="scss" scoped>
.um-page {
  padding: 24px 32px;
  position: relative;
  overflow: hidden;
}

/* Hero */
.um-hero {
  position: relative;
  z-index: 1;
  margin-bottom: 22px;

  h1 { margin: 0 0 8px; font-size: 26px; color: #13233f; font-weight: 700; }
  p { margin: 0; color: #6f7f9a; font-size: 13px; }
}

/* Stats */
.stats-grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px;
  margin-bottom: 18px; position: relative; z-index: 1;
}
.stat-card {
  height: 104px; border: 1px solid #e4eaf3; border-radius: 16px;
  background: rgba(255,255,255,.96);
  box-shadow: 0 10px 28px rgba(38,84,162,.08);
  padding: 0 24px; display: flex; align-items: center; gap: 16px;
}
.stat-icon {
  width: 52px; height: 52px; border-radius: 14px; display: grid; place-items: center;
  &.blue { background: linear-gradient(145deg, #eef4ff, #dfeaff); color: #2d71f1; }
  &.green { background: linear-gradient(145deg, #ebfbf2, #d8f3e5); color: #23ad66; }
  &.red { background: linear-gradient(145deg, #fff0f0, #ffe3e3); color: #e05252; }
}
.stat-label { color: #5a6b86; font-size: 13px; margin-bottom: 4px; }
.stat-row {
  display: flex; align-items: baseline; gap: 16px;
  strong { font-size: 28px; color: #12213c; }
  span { font-size: 12px; color: #7d8ba1; }
}

/* Panel */
.um-panel {
  border: 1px solid #e4eaf3; border-radius: 16px;
  background: rgba(255,255,255,.96);
  box-shadow: 0 10px 28px rgba(38,84,162,.08);
  padding: 22px; position: relative; z-index: 1;
}

/* Toolbar */
.toolbar {
  display: flex; justify-content: space-between; gap: 16px;
  margin-bottom: 18px; flex-wrap: wrap;
}
.filters, .actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.search-input { width: 230px; }
.small-select { width: 140px; }

/* Table */
.table-wrap {
  border: 1px solid #e5ebf3; border-radius: 12px; overflow: hidden;
}
.um-table {
  --el-table-header-bg-color: #fbfcff;
  --el-table-border-color: #e8edf5;
  --el-table-row-hover-bg-color: #f8fbff;

  :deep(.el-table__header-wrapper th) { height: 46px; color: #30425f; font-weight: 600; }
  :deep(.el-table__row td) { height: 52px; }
  :deep(.cell) { font-size: 13px; color: #243653; }
}
.mono-text { font-family: 'JetBrains Mono', 'Fira Code', monospace; font-size: 13px; letter-spacing: .3px; }

/* Role tags */
.role-tag {
  display: inline-flex; min-width: 44px; justify-content: center;
  height: 26px; border-radius: 7px; align-items: center;
  font-size: 12px; font-weight: 600;
}
.role-admin { background: #fff0ef; border: 1px solid #ffbdb8; color: #f05649; }
.role-approver { background: #fff6e9; border: 1px solid #ffd9af; color: #f19829; }
.role-employee { background: #edf4ff; border: 1px solid #bfd4ff; color: #3a75ea; }

/* Status */
.status-dot {
  display: inline-flex; align-items: center; gap: 7px; font-size: 13px; white-space: nowrap;
  &.on { color: #299c59; i { background: #21b15b; } }
  &.off { color: #e05252; i { background: #e05252; } }
  i { width: 8px; height: 8px; border-radius: 50%; display: inline-block; flex-shrink: 0; }
}

/* Operations */
.ops {
  display: flex; align-items: center; gap: 16px;
  a { color: #2d72ef; font-size: 13px; display: inline-flex; align-items: center; gap: 3px; text-decoration: none; }
}

/* Footer */
.footer-bar {
  padding-top: 14px; display: flex; align-items: center; justify-content: space-between;
  color: #61718d; font-size: 13px;
}

/* Empty */
.empty-state {
  padding: 40px 0; text-align: center; color: #9aa8c0;
  .empty-icon { margin-bottom: 10px; }
  p { margin: 0; font-size: 14px; }
}

/* Dialog */
:deep(.user-dialog) {
  border-radius: 16px;
  .el-dialog__header { padding: 24px 28px 0; margin: 0; }
  .el-dialog__body { padding: 20px 28px; }
  .el-dialog__footer { padding: 0 28px 24px; }
}
.dialog-header {
  h3 { margin: 0 0 3px; font-size: 17px; color: #1a2b42; font-weight: 700; }
  p { margin: 0; font-size: 12.5px; color: #94a3b8; }
}
.user-form {
  .form-row { display: flex; gap: 16px; }
  .flex-1 { flex: 1; }
  .el-form-item { margin-bottom: 18px; }
  .el-form-item__label { font-size: 13px; color: #4a5b76; font-weight: 500; padding-bottom: 6px; }
}
.dialog-footer {
  display: flex; justify-content: flex-end; gap: 12px;
}
</style>
