<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title"><el-icon><User /></el-icon> 用户管理</div>
      <el-button type="primary" :icon="Plus" @click="openDialog()">新增用户</el-button>
    </div>

    <div class="page-card">
      <div class="search-bar">
        <el-input
          v-model="query.keyword" placeholder="搜索账号/姓名" clearable style="width: 200px"
          :prefix-icon="Search" @keyup.enter="fetchList" @clear="fetchList"
        />
        <el-select v-model="query.roleCode" placeholder="角色筛选" clearable style="width: 130px" @change="fetchList">
          <el-option label="管理员" value="ADMIN" />
          <el-option label="审批人" value="APPROVER" />
          <el-option label="员工" value="EMPLOYEE" />
        </el-select>
        <el-button type="primary" :icon="Search" @click="fetchList">查询</el-button>
      </div>

      <el-table v-loading="loading" :data="tableData" empty-text=" ">
        <el-table-column prop="username" label="账号" width="130">
          <template #default="{ row }">
            <span style="font-family: var(--font-mono, monospace); font-size: 13px;">{{ row.username }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="realName" label="姓名" width="100" />
        <el-table-column prop="deptName" label="部门" width="120" />
        <el-table-column prop="roleCode" label="角色" width="120">
          <template #default="{ row }">
            <el-tag :color="roleColor(row.roleCode)" effect="dark" size="small" style="border: none;">
              {{ roleLabel(row.roleCode) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="手机号" width="130">
          <template #default="{ row }">
            <span class="contact-text">{{ row.phone || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="email" label="邮箱" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="contact-text">{{ row.email || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 'ENABLED' ? 'success' : 'danger'" size="small" effect="light">
              {{ row.status === 'ENABLED' ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="130" fixed="right">
          <template #default="{ row }">
            <div class="action-cell">
              <el-button link type="primary" @click="openDialog(row)">编辑</el-button>
              <el-dropdown trigger="click" @command="(cmd) => handleMoreCommand(cmd, row)">
                <el-button link type="primary">更多<el-icon class="el-icon--right"><ArrowDown /></el-icon></el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="reset"><el-icon><Key /></el-icon>重置密码</el-dropdown-item>
                  <el-dropdown-item :command="row.status === 'ENABLED' ? 'disable' : 'enable'" :divided="true">
                    <el-icon><component :is="row.status === 'ENABLED' ? 'Lock' : 'Unlock'" /></el-icon>
                    {{ row.status === 'ENABLED' ? '禁用' : '启用' }}
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            </div>
          </template>
        </el-table-column>
        <template #empty>
          <div class="empty-state">
            <el-icon class="empty-icon"><User /></el-icon>
            <p class="empty-text">暂无用户数据</p>
          </div>
        </template>
      </el-table>

      <el-pagination
        v-model:current-page="query.page"
        v-model:page-size="query.pageSize"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @size-change="fetchList"
        @current-change="fetchList"
      />
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
            <el-option v-for="d in deptList" :key="d.deptCode" :label="d.deptName" :value="d.deptCode" />
          </el-select>
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="form.roleCode" style="width: 100%;">
            <el-option v-for="r in roleList" :key="r.roleCode" :label="r.roleName" :value="r.roleCode" />
          </el-select>
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
import { ElMessage, ElMessageBox } from 'element-plus'
import { User, Plus, Search } from '@element-plus/icons-vue'
import { getUserList, createUser, updateUser, resetPassword, toggleUserStatus, getDeptList, getRoleList } from '@/api/user'

const ROLE_MAP = {
  ADMIN: { label: '管理员', color: '#ef4444' },
  APPROVER: { label: '审批人', color: '#f59e0b' },
  EMPLOYEE: { label: '员工', color: '#4f6ef7' },
  SUBMITTER: { label: '提交人', color: '#4f6ef7' }
}

function roleColor(code) { return ROLE_MAP[code]?.color || '#64748b' }
function roleLabel(code) { return ROLE_MAP[code]?.label || code }

function handleMoreCommand(command, row) {
  if (command === 'reset') handleReset(row)
  else if (command === 'disable' || command === 'enable') handleToggle(row)
}

const loading = ref(false)
const saving = ref(false)
const tableData = ref([])
const total = ref(0)
const deptList = ref([])
const roleList = ref([])
const dialogVisible = ref(false)
const editingId = ref(null)
const query = reactive({ page: 1, pageSize: 10, keyword: '', roleCode: '' })
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
  } catch {} finally {
    saving.value = false
  }
}

async function handleReset(row) {
  try {
    await ElMessageBox.confirm(`确定重置 ${row.username} 的密码吗？`, '确认')
    await resetPassword(row.id)
    ElMessage.success('密码已重置为 123456')
  } catch {}
}

async function handleToggle(row) {
  const action = row.status === 'ENABLED' ? '禁用' : '启用'
  try {
    await ElMessageBox.confirm(`确定${action}用户「${row.realName || row.username}」吗？`, `确认${action}`)
    await toggleUserStatus(row.id, row.status === 'ENABLED' ? 0 : 1)
    ElMessage.success(`已${action}用户「${row.realName || row.username}」`)
    fetchList()
  } catch {}
}
</script>

<style lang="scss" scoped>
.action-cell {
  display: flex;
  align-items: center;
  gap: 4px;
}

.contact-text {
  font-family: $font-mono;
  font-size: $text-base;
  color: $text-primary;
  letter-spacing: 0.3px;
}
</style>
