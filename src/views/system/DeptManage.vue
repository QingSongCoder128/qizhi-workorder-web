<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title"><el-icon><OfficeBuilding /></el-icon> 部门管理</div>
      <el-button type="primary" :icon="Plus" @click="openDialog()">新增部门</el-button>
    </div>

    <div class="page-card">
      <el-table :data="tableData" v-loading="loading" row-key="id" default-expand-all :tree-props="{ children: 'children' }" empty-text=" ">
        <el-table-column prop="name" label="部门名称" min-width="200" />
        <el-table-column prop="code" label="部门编码" width="140" />
        <el-table-column prop="sort" label="排序" width="80" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDialog(row)">编辑</el-button>
            <el-button link type="primary" @click="openDialog(null, row.id)">添加子部门</el-button>
          </template>
        </el-table-column>
        <template #empty>
          <div class="empty-state">
            <el-icon class="empty-icon"><OfficeBuilding /></el-icon>
            <p class="empty-text">暂无部门数据</p>
          </div>
        </template>
      </el-table>
    </div>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="480px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="部门名称" prop="name"><el-input v-model="form.name" placeholder="如 运维部" /></el-form-item>
        <el-form-item label="部门编码" prop="code"><el-input v-model="form.code" placeholder="如 DEPT_IT" /></el-form-item>
        <el-form-item label="上级部门">
          <el-tree-select v-model="form.parentId" :data="tableData" :props="{ label: 'name', value: 'id', children: 'children' }" check-strictly clearable style="width:100%;" placeholder="无（顶级部门）" />
        </el-form-item>
        <el-form-item label="排序"><el-input-number v-model="form.sort" :min="0" :max="999" /></el-form-item>
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
const form = reactive({ name: '', code: '', parentId: null, sort: 0 })
const rules = {
  name: [{ required: true, message: '请输入部门名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入部门编码', trigger: 'blur' }]
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
  Object.assign(form, row || { name: '', code: '', parentId: parentId || null, sort: 0 })
  dialogVisible.value = true
}

async function handleSave() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    if (editingId.value) {
      await updateDept(editingId.value, form)
      ElMessage.success(`部门「${form.name}」更新成功`)
    } else {
      await createDept(form)
      ElMessage.success(`部门「${form.name}」创建成功`)
    }
    dialogVisible.value = false
    fetchTree()
  } catch {} finally { saving.value = false }
}
</script>

<style lang="scss" scoped>
</style>
