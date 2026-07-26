<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <div class="page-title"><el-icon><OfficeBuilding /></el-icon> 部门管理</div>
        <div class="page-desc">维护组织部门架构，支持多级部门树</div>
      </div>
      <el-button type="primary" :icon="Plus" @click="openDialog()">新增部门</el-button>
    </div>

    <div class="page-card">
      <el-table
        v-loading="loading" :data="tableData" row-key="id" default-expand-all
        :tree-props="{ children: 'children' }" empty-text=" "
      >
        <el-table-column prop="deptName" label="部门名称" min-width="220">
          <template #default="{ row }">
            <div class="dept-name-cell">
              <span class="dept-avatar">{{ (row.deptName || '?')[0] }}</span>
              <span class="dept-name">{{ row.deptName || '—' }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="deptCode" label="部门编码" width="160">
          <template #default="{ row }">
            <span class="dept-code">{{ row.deptCode || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="sortOrder" label="排序" width="90" align="center" />
        <el-table-column label="操作" width="190" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDialog(row)">编辑</el-button>
            <el-button link type="primary" @click="openDialog(null, row.id)">添加子部门</el-button>
          </template>
        </el-table-column>
        <template #empty>
          <div class="empty-state">
            <el-icon class="empty-icon"><OfficeBuilding /></el-icon>
            <p class="empty-text">暂无部门数据</p>
            <p class="empty-sub">点击右上角「新增部门」搭建组织架构</p>
          </div>
        </template>
      </el-table>
    </div>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="480px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="部门名称" prop="deptName">
          <el-input v-model="form.deptName" placeholder="如 运维部" />
        </el-form-item>
        <el-form-item label="部门编码" prop="deptCode">
          <el-input v-model="form.deptCode" placeholder="如 DEPT_IT" :disabled="!!editingId" />
        </el-form-item>
        <el-form-item label="上级部门">
          <el-tree-select
            v-model="form.parentId" :data="tableData"
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
import { ElMessage } from 'element-plus'
import { OfficeBuilding, Plus } from '@element-plus/icons-vue'
import { getDeptTree, createDept, updateDept } from '@/api/user'

const loading = ref(false)
const saving = ref(false)
const tableData = ref([])
const dialogVisible = ref(false)
const editingId = ref(null)
const formRef = ref()
const form = reactive({ deptName: '', deptCode: '', parentId: null, sortOrder: 0 })
const rules = {
  deptName: [{ required: true, message: '请输入部门名称', trigger: 'change' }],
  deptCode: [{ required: true, message: '请输入部门编码', trigger: 'change' }]
}
const dialogTitle = computed(() => editingId.value ? '编辑部门' : '新增部门')

onMounted(() => fetchTree())

async function fetchTree() {
  loading.value = true
  try {
    const res = await getDeptTree()
    tableData.value = res.data || []
  } catch {} finally { loading.value = false }
}

function openDialog(row, parentId) {
  editingId.value = row?.id || null
  Object.assign(form, row
    ? { deptName: row.deptName, deptCode: row.deptCode, parentId: row.parentId, sortOrder: row.sortOrder ?? 0 }
    : { deptName: '', deptCode: '', parentId: parentId || null, sortOrder: 0 })
  dialogVisible.value = true
}

async function handleSave() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    if (editingId.value) {
      await updateDept(editingId.value, form)
      ElMessage.success(`部门「${form.deptName}」更新成功`)
    } else {
      await createDept(form)
      ElMessage.success(`部门「${form.deptName}」创建成功`)
    }
    dialogVisible.value = false
    fetchTree()
  } catch {} finally { saving.value = false }
}
</script>

<style lang="scss" scoped>
.dept-name-cell {
  display: flex;
  align-items: center;
  gap: $space-2;

  .dept-avatar {
    width: 28px;
    height: 28px;
    border-radius: $radius-sm;
    background: $success-light;
    color: $success;
    font-size: $text-sm;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .dept-name {
    font-weight: 600;
    color: $text-primary;
  }
}

.dept-code {
  font-family: $font-mono;
  font-size: $text-sm;
  color: $text-secondary;
  background: $gray-100;
  padding: 2px 8px;
  border-radius: $radius-xs;
  border: 1px solid $border-light;
}
</style>
