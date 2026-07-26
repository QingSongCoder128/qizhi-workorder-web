<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <div class="page-title"><el-icon><OfficeBuilding /></el-icon> 部门管理</div>
        <div class="page-desc">维护组织部门架构，支持多级部门树</div>
      </div>
      <el-button type="primary" :icon="Plus" @click="openDialog()">新增部门</el-button>
    </div>

    <!-- 部门卡片网格 -->
    <div v-loading="loading" class="dept-grid">
      <div v-for="(dept, idx) in flatDepts" :key="dept.id" class="dept-card" :class="'theme-' + (idx % 5)">
        <div class="dept-card__header">
          <span class="dept-icon">{{ (dept.deptName || '?')[0] }}</span>
          <div class="dept-info">
            <h3>{{ dept.deptName }}</h3>
            <span class="dept-order">排序 {{ dept.sortOrder }}</span>
          </div>
          <el-dropdown trigger="click" @command="(cmd) => handleCommand(cmd, dept)">
            <el-button class="more-btn" :icon="MoreFilled" circle size="small" />
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="edit"><el-icon><Edit /></el-icon>编辑</el-dropdown-item>
                <el-dropdown-item command="addChild"><el-icon><Plus /></el-icon>添加子部门</el-dropdown-item>
                <el-dropdown-item command="delete" divided><el-icon><Delete /></el-icon>删除</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
        <div class="dept-card__body">
          <div class="dept-stat">
            <el-icon><User /></el-icon>
            <span>{{ deptUserCount(dept.deptCode) }} 人</span>
          </div>
          <div v-if="dept.children && dept.children.length" class="dept-stat">
            <el-icon><Connection /></el-icon>
            <span>{{ dept.children.length }} 个子部门</span>
          </div>
        </div>
        <!-- 子部门标签 -->
        <div v-if="dept.children && dept.children.length" class="dept-card__children">
          <el-tag v-for="child in dept.children" :key="child.id" size="small" effect="plain" round>
            {{ child.deptName }}
          </el-tag>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="!loading && flatDepts.length === 0" class="empty-state">
        <el-icon class="empty-icon"><OfficeBuilding /></el-icon>
        <p class="empty-text">暂无部门数据</p>
        <p class="empty-sub">点击右上角「新增部门」搭建组织架构</p>
      </div>
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="480px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="部门名称" prop="deptName">
          <el-input v-model="form.deptName" placeholder="如 运维部、技术研发组" />
        </el-form-item>
        <el-form-item label="上级部门">
          <el-tree-select
            v-model="form.parentId" :data="parentOptions"
            :props="{ label: 'deptName', value: 'id', children: 'children' }"
            check-strictly clearable style="width:100%;" placeholder="无（顶级部门）"
          />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sortOrder" :min="0" :max="999" />
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
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { OfficeBuilding, Plus, MoreFilled, Edit, Delete, User, Connection } from '@element-plus/icons-vue'
import { getDeptTree, createDept, updateDept, deleteDept, getUserList } from '@/api/user'

const loading = ref(false)
const saving = ref(false)
const tableData = ref([])
const userList = ref([])
const dialogVisible = ref(false)
const editingId = ref(null)
const formRef = ref()
const form = reactive({ deptName: '', parentId: null, sortOrder: 0 })

const rules = {
  deptName: [{ required: true, message: '请输入部门名称', trigger: 'submit' }]
}
const dialogTitle = computed(() => editingId.value ? '编辑部门' : '新增部门')

// 上级部门选项：编辑时排除自身及其子部门（防止循环引用）
const parentOptions = computed(() => {
  if (!editingId.value) return tableData.value
  const exclude = (nodes) => nodes
    .filter(n => n.id !== editingId.value)
    .map(n => ({ ...n, children: n.children ? exclude(n.children) : undefined }))
  return exclude(tableData.value)
})

// 平铺展示（含树形数据的顶级节点）
const flatDepts = computed(() => tableData.value)

function deptUserCount(deptCode) {
  return userList.value.filter(u => u.deptCode === deptCode).length
}

onMounted(() => {
  fetchTree()
  fetchUsers()
})

async function fetchTree() {
  loading.value = true
  try {
    const res = await getDeptTree()
    tableData.value = res.data || []
  } catch {} finally { loading.value = false }
}

async function fetchUsers() {
  try {
    const res = await getUserList({ page: 1, pageSize: 500 })
    userList.value = res.data?.records || []
  } catch {}
}

function openDialog(row, parentId) {
  editingId.value = row?.id || null
  Object.assign(form, row
    ? { deptName: row.deptName, parentId: row.parentId || null, sortOrder: row.sortOrder ?? 0 }
    : { deptName: '', parentId: parentId || null, sortOrder: 0 })
  dialogVisible.value = true
}

function handleCommand(cmd, dept) {
  if (cmd === 'edit') openDialog(dept)
  else if (cmd === 'addChild') openDialog(null, dept.id)
  else if (cmd === 'delete') handleDelete(dept)
}

async function handleDelete(dept) {
  try {
    await ElMessageBox.confirm(`确定删除部门「${dept.deptName}」吗？`, '提示', { type: 'warning' })
    await deleteDept(dept.id)
    ElMessage.success('删除成功')
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
.dept-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 18px;
  min-height: 200px;
}

.dept-card {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e8eef7;
  padding: 20px 22px 16px;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
  }

  &:hover {
    box-shadow: 0 8px 24px rgba(39, 71, 121, 0.1);
    transform: translateY(-2px);
  }

  // 5 种主题色
  &.theme-0::before { background: linear-gradient(90deg, #3b82f6, #60a5fa); }
  &.theme-1::before { background: linear-gradient(90deg, #8b5cf6, #a78bfa); }
  &.theme-2::before { background: linear-gradient(90deg, #10b981, #34d399); }
  &.theme-3::before { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
  &.theme-4::before { background: linear-gradient(90deg, #06b6d4, #22d3ee); }

  &.theme-0 .dept-icon { background: #eff6ff; color: #2563eb; }
  &.theme-1 .dept-icon { background: #f5f3ff; color: #7c3aed; }
  &.theme-2 .dept-icon { background: #ecfdf5; color: #059669; }
  &.theme-3 .dept-icon { background: #fffbeb; color: #d97706; }
  &.theme-4 .dept-icon { background: #ecfeff; color: #0891b2; }
}

.dept-card__header {
  display: flex;
  align-items: center;
  gap: 14px;

  .dept-icon {
    width: 44px;
    height: 44px;
    border-radius: 10px;
    font-size: 18px;
    font-weight: 700;
    display: grid;
    place-items: center;
    flex-shrink: 0;
  }

  .dept-info {
    flex: 1;
    min-width: 0;

    h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 700;
      color: #1e293b;
    }

    .dept-order {
      font-size: 12px;
      color: #94a3b8;
      margin-top: 2px;
    }
  }

  .more-btn {
    border: none;
    color: #94a3b8;
    &:hover { color: #3b82f6; background: #f1f5f9; }
  }
}

.dept-card__body {
  display: flex;
  gap: 18px;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid #f1f5f9;

  .dept-stat {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: #64748b;

    .el-icon { font-size: 15px; color: #94a3b8; }
  }
}

.dept-card__children {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
}

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 60px 0;

  .empty-icon { font-size: 48px; color: #cbd5e1; }
  .empty-text { margin: 12px 0 4px; font-size: 15px; color: #64748b; }
  .empty-sub { font-size: 13px; color: #94a3b8; }
}
</style>
