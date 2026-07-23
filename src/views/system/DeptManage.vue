<template>
  <div class="page-container">
    <div class="page-card">
      <div class="page-header">
        <h3>部门管理</h3>
        <el-button type="primary" @click="openDialog()">新增部门</el-button>
      </div>
      <el-table :data="tableData" v-loading="loading" row-key="id" default-expand-all :tree-props="{ children: 'children' }">
        <el-table-column prop="name" label="部门名称" min-width="200" />
        <el-table-column prop="code" label="部门编码" width="140" />
        <el-table-column prop="sort" label="排序" width="80" />
        <el-table-column label="操作" width="180">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDialog(row)">编辑</el-button>
            <el-button link type="primary" @click="openDialog(null, row.id)">添加子部门</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑部门' : '新增部门'" width="480px">
      <el-form :model="form" label-width="90px">
        <el-form-item label="部门名称"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="部门编码"><el-input v-model="form.code" /></el-form-item>
        <el-form-item label="上级部门">
          <el-tree-select v-model="form.parentId" :data="tableData" :props="{ label: 'name', value: 'id', children: 'children' }" check-strictly clearable style="width:100%;" />
        </el-form-item>
        <el-form-item label="排序"><el-input-number v-model="form.sort" :min="0" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getDeptTree, createDept, updateDept } from '@/api/user'

const loading = ref(false)
const tableData = ref([])
const dialogVisible = ref(false)
const editingId = ref(null)
const form = reactive({ name: '', code: '', parentId: null, sort: 0 })

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
  try {
    if (editingId.value) { await updateDept(editingId.value, form) }
    else { await createDept(form) }
    ElMessage.success('保存成功')
    dialogVisible.value = false
    fetchTree()
  } catch {}
}
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-header h3 { font-size: 18px; }
</style>
