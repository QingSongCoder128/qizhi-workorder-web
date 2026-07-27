<template>
  <div class="dm-page">
    <!-- Hero -->
    <section class="dm-hero">
      <div class="hero-text">
        <h1>部门管理</h1>
        <p>维护组织部门架构，支持多级部门树，管理部门人员分配。</p>
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
    <section class="dm-panel">
      <div class="toolbar">
        <div class="filters">
          <el-input v-model="keyword" class="search-input" clearable placeholder="搜索部门名称"
            @keyup.enter="fetchTree" @clear="fetchTree">
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
          <el-button type="primary" :icon="Search" @click="fetchTree">查询</el-button>
          <el-button :icon="Refresh" @click="keyword = ''; fetchTree()">重置</el-button>
        </div>
        <div class="actions">
          <el-button type="primary" :icon="Plus" @click="openDialog()">新增部门</el-button>
        </div>
      </div>

      <div class="table-wrap">
        <el-table v-loading="loading" :data="filteredTree" class="dm-table"
          row-key="id" :tree-props="{ children: 'children' }" default-expand-all>
          <el-table-column prop="deptName" label="部门名称" min-width="180">
            <template #default="{ row }">
              <span class="dept-name-cell">
                <i class="dept-dot"></i>{{ row.deptName }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="sortOrder" label="排序" min-width="100" align="center" />
          <el-table-column label="人数" min-width="100" align="center">
            <template #default="{ row }">
              <span class="user-count" :class="{ 'has-users': row.userCount > 0 }">{{ row.userCount }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" min-width="200" align="center">
            <template #default="{ row }">
              <div class="ops">
                <a href="javascript:;" @click="openDialog(row)">编辑</a>
                <a href="javascript:;" @click="openDialog(null, row.id)">添加子部门</a>
                <a href="javascript:;" class="danger" @click="handleDelete(row)">删除</a>
              </div>
            </template>
          </el-table-column>
          <template #empty>
            <div class="empty-state">
              <el-icon class="empty-icon" :size="40"><OfficeBuilding /></el-icon>
              <p>暂无部门数据</p>
            </div>
          </template>
        </el-table>
      </div>
    </section>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" width="440px" class="dept-dialog" :close-on-click-modal="false">
      <template #header>
        <div class="dialog-header">
          <h3>{{ dialogTitle }}</h3>
          <p>{{ dialogDesc }}</p>
        </div>
      </template>
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="dept-form">
        <el-form-item label="部门名称" prop="deptName">
          <el-input v-model="form.deptName" placeholder="如：运维部、技术研发组" :prefix-icon="OfficeBuilding" />
        </el-form-item>
        <el-form-item label="上级部门">
          <!-- 编辑子部门：可选择上级 -->
          <el-tree-select
            v-if="editingId && form.parentId"
            v-model="form.parentId" :data="parentOptions"
            :props="{ label: 'deptName', value: 'id', children: 'children' }"
            check-strictly clearable style="width:100%;" placeholder="无（顶级部门）"
          />
          <!-- 新增子部门：显示父级名称，不可更改 -->
          <div v-else-if="form.parentId" class="parent-locked">
            <el-icon><Connection /></el-icon>
            <span>{{ parentName }}</span>
            <em>子部门将创建在该部门下</em>
          </div>
          <!-- 顶级部门（新增或编辑）：无上级，不可操作 -->
          <div v-else class="parent-locked top-level">
            <el-icon><OfficeBuilding /></el-icon>
            <span>无上级（顶级部门）</span>
            <em>{{ editingId ? '该部门已是一级部门' : '将作为一级部门创建' }}</em>
          </div>
        </el-form-item>
        <el-form-item label="排序">
          <div class="sort-row">
            <el-input-number v-model="form.sortOrder" :min="0" :max="99" style="width: 130px;" />
            <span class="form-tip">数值越小，列表中越靠前</span>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="saving" @click="handleSave">
            {{ editingId ? '保存修改' : '确认创建' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { OfficeBuilding, Plus, Search, Refresh, UserFilled, Connection } from '@element-plus/icons-vue'
import { getDeptTree, createDept, updateDept, deleteDept } from '@/api/user'

const loading = ref(false)
const saving = ref(false)
const treeData = ref([])
const keyword = ref('')
const dialogVisible = ref(false)
const editingId = ref(null)
const formRef = ref()
const form = reactive({ deptName: '', parentId: null, sortOrder: 0 })

const rules = {
  deptName: [{ required: true, message: '请输入部门名称', trigger: 'submit' }]
}

const dialogTitle = computed(() => {
  if (editingId.value) return '编辑部门'
  if (form.parentId) return '添加子部门'
  return '新增部门'
})
const dialogDesc = computed(() => {
  if (editingId.value) return '修改部门基本信息'
  if (form.parentId) return '在所选部门下创建子部门'
  return '创建一个新的顶级部门'
})

const totalDepts = computed(() => countNodes(treeData.value))
const totalUsers = computed(() => sumUsers(treeData.value))
const topDepts = computed(() => treeData.value.length)

const statsCards = computed(() => [
  { label: '部门总数', value: totalDepts.value, meta: `含 ${topDepts.value} 个顶级部门`, icon: OfficeBuilding, tone: 'blue' },
  { label: '在职人员', value: totalUsers.value, meta: '已分配部门的人数', icon: UserFilled, tone: 'green' },
  { label: '子部门数', value: totalDepts.value - topDepts.value, meta: '隶属于上级部门', icon: Connection, tone: 'purple' }
])

function countNodes(nodes) {
  let count = 0
  for (const n of nodes) {
    count++
    if (n.children) count += countNodes(n.children)
  }
  return count
}
function sumUsers(nodes) {
  let sum = 0
  for (const n of nodes) {
    sum += (n.userCount || 0)
    if (n.children) sum += sumUsers(n.children)
  }
  return sum
}

const filteredTree = computed(() => {
  if (!keyword.value.trim()) return treeData.value
  const kw = keyword.value.trim().toLowerCase()
  const filterNodes = (nodes) => {
    const result = []
    for (const node of nodes) {
      const selfMatch = node.deptName.toLowerCase().includes(kw) || (node.deptCode || '').toLowerCase().includes(kw)
      const filteredChildren = node.children ? filterNodes(node.children) : []
      if (selfMatch || filteredChildren.length > 0) {
        result.push({ ...node, children: filteredChildren.length > 0 ? filteredChildren : (selfMatch ? node.children : undefined) })
      }
    }
    return result
  }
  return filterNodes(treeData.value)
})

const parentOptions = computed(() => {
  if (!editingId.value) return treeData.value
  const exclude = (nodes) => nodes
    .filter(n => n.id !== editingId.value)
    .map(n => ({ ...n, children: n.children ? exclude(n.children) : undefined }))
  return exclude(treeData.value)
})

// 添加子部门时，显示父级名称
const parentName = computed(() => {
  if (!form.parentId) return ''
  const find = (nodes) => {
    for (const n of nodes) {
      if (n.id === form.parentId) return n.deptName
      if (n.children) { const r = find(n.children); if (r) return r }
    }
    return ''
  }
  return find(treeData.value)
})

onMounted(() => fetchTree())

async function fetchTree() {
  loading.value = true
  try {
    const res = await getDeptTree()
    treeData.value = res.data || []
  } catch {} finally { loading.value = false }
}

function openDialog(row, parentId) {
  editingId.value = row?.id || null
  Object.assign(form, row
    ? { deptName: row.deptName, parentId: row.parentId || null, sortOrder: row.sortOrder ?? 0 }
    : { deptName: '', parentId: parentId || null, sortOrder: 0 })
  dialogVisible.value = true
}

async function handleDelete(row) {
  const hasChildren = row.children && row.children.length > 0
  const msg = hasChildren
    ? `部门「${row.deptName}」下有 ${row.children.length} 个子部门，需要先删除子部门。确定要尝试删除吗？`
    : `确定删除部门「${row.deptName}」吗？删除后不可恢复。`
  try {
    await ElMessageBox.confirm(msg, '删除确认', {
      type: 'warning',
      confirmButtonText: '确定删除',
      cancelButtonText: '取消'
    })
    await deleteDept(row.id)
    ElMessage.success('部门已删除')
    fetchTree()
  } catch {}
}

async function handleSave() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    const payload = { ...form, parentId: form.parentId || 0 }
    if (editingId.value) {
      await updateDept(editingId.value, payload)
      ElMessage.success(`部门「${form.deptName}」更新成功`)
    } else {
      await createDept(payload)
      ElMessage.success(`部门「${form.deptName}」创建成功`)
    }
    dialogVisible.value = false
    fetchTree()
  } catch {} finally { saving.value = false }
}
</script>

<style lang="scss" scoped>
.dm-page {
  padding: 24px 32px;
  position: relative;
  overflow: hidden;
}

.dm-hero {
  position: relative;
  z-index: 1;
  margin-bottom: 22px;

  h1 { margin: 0 0 8px; font-size: 26px; color: #13233f; font-weight: 700; }
  p { margin: 0; color: #6f7f9a; font-size: 13px; }
}

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
  &.purple { background: linear-gradient(145deg, #f3f0ff, #e8e2ff); color: #7c5cfc; }
}
.stat-label { color: #5a6b86; font-size: 13px; margin-bottom: 4px; }
.stat-row {
  display: flex; align-items: baseline; gap: 16px;
  strong { font-size: 28px; color: #12213c; }
  span { font-size: 12px; color: #7d8ba1; }
}

.dm-panel {
  border: 1px solid #e4eaf3; border-radius: 16px;
  background: rgba(255,255,255,.96);
  box-shadow: 0 10px 28px rgba(38,84,162,.08);
  padding: 22px; position: relative; z-index: 1;
}

.toolbar {
  display: flex; justify-content: space-between; gap: 16px;
  margin-bottom: 18px; flex-wrap: wrap;
}
.filters, .actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.search-input { width: 230px; }

.table-wrap {
  border: 1px solid #e5ebf3; border-radius: 12px; overflow: hidden;
}
.dm-table {
  --el-table-header-bg-color: #fbfcff;
  --el-table-border-color: #e8edf5;
  --el-table-row-hover-bg-color: #f8fbff;

  :deep(.el-table__header-wrapper th) { height: 46px; color: #30425f; font-weight: 600; }
  :deep(.el-table__row td) { height: 52px; }
  :deep(.cell) { font-size: 13px; color: #243653; }
}
.mono-text { font-family: 'JetBrains Mono', 'Fira Code', monospace; font-size: 12px; letter-spacing: .3px; color: #64748b; }

.dept-name-cell {
  display: inline-flex; align-items: center; gap: 8px; font-weight: 500;
  .dept-dot {
    width: 8px; height: 8px; border-radius: 3px; background: #2d71f1; flex-shrink: 0;
  }
}

.user-count {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 28px; height: 24px; border-radius: 6px;
  font-size: 12px; font-weight: 600;
  background: #f1f5f9; color: #94a3b8;
  &.has-users { background: #edf4ff; color: #2d71f1; }
}

.ops {
  display: flex; align-items: center; justify-content: center; gap: 14px;
  a {
    color: #2d72ef; font-size: 13px; text-decoration: none;
    &:hover { opacity: .75; }
    &.danger { color: #e05252; }
  }
}

.empty-state {
  padding: 40px 0; text-align: center; color: #9aa8c0;
  .empty-icon { margin-bottom: 10px; }
  p { margin: 0; font-size: 14px; }
}

:deep(.dept-dialog) {
  border-radius: 16px;
  .el-dialog__header { padding: 24px 28px 0; margin: 0; }
  .el-dialog__body { padding: 20px 28px; }
  .el-dialog__footer { padding: 0 28px 24px; }
}
.dialog-header {
  h3 { margin: 0 0 3px; font-size: 17px; color: #1a2b42; font-weight: 700; }
  p { margin: 0; font-size: 12.5px; color: #94a3b8; }
}
.dept-form {
  .el-form-item { margin-bottom: 18px; }
  .el-form-item__label { font-size: 13px; color: #4a5b76; font-weight: 600; padding-bottom: 6px; }
  .form-tip { margin-left: 10px; font-size: 12px; color: #94a3b8; }
}
.parent-locked {
  display: flex; align-items: center; gap: 8px; width: 100%;
  padding: 10px 14px; border-radius: 8px; font-size: 13px;
  background: #f0f6ff; border: 1px solid #d6e4ff; color: #2d71f1;
  .el-icon { font-size: 15px; }
  span { font-weight: 600; }
  em { font-style: normal; font-size: 11px; color: #8eaadc; margin-left: auto; }
  &.top-level { background: #f8fafb; border-color: #e5ebf3; color: #64748b; em { color: #94a3b8; } }
}
.sort-row { display: flex; align-items: center; }
.dialog-footer {
  display: flex; justify-content: flex-end; gap: 12px;
}
</style>
