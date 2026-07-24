<template>
  <div class="page-container">
    <div class="page-card">
      <div class="page-header">
        <h3>审批模板配置</h3>
        <el-button type="primary" @click="openDialog()">新增模板</el-button>
      </div>
      <el-table :data="templates" v-loading="loading" stripe>
        <el-table-column prop="name" label="模板名称" min-width="150" />
        <el-table-column prop="type" label="适用工单类型" width="150" />
        <el-table-column prop="totalNodes" label="审批节点数" width="120" />
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column label="操作" width="160">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDialog(row)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑模板' : '新增模板'" width="600px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="模板名称"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="适用类型">
          <el-select v-model="form.type" style="width: 100%;">
            <el-option v-for="(v, k) in ORDER_TYPE" :key="k" :label="v.label" :value="k" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述"><el-input v-model="form.description" type="textarea" :rows="2" /></el-form-item>
        <el-form-item label="审批节点">
          <div v-for="(node, i) in form.nodes" :key="i" class="node-row">
            <el-input v-model="node.name" placeholder="节点名称" style="width: 150px;" />
            <el-input v-model="node.approverRole" placeholder="审批角色" style="width: 150px;" />
            <el-input-number v-model="node.orderNum" :min="1" style="width: 120px;" />
            <el-button link type="danger" @click="form.nodes.splice(i, 1)">删除</el-button>
          </div>
          <el-button type="primary" link @click="form.nodes.push({ name: '', approverRole: '', orderNum: form.nodes.length + 1 })">+ 添加节点</el-button>
        </el-form-item>
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
import { ElMessage, ElMessageBox } from 'element-plus'
import { ORDER_TYPE } from '@/utils/constants'
import { getTemplateList, createTemplate, updateTemplate, deleteTemplate } from '@/api/approve'

const loading = ref(false)
const templates = ref([])
const dialogVisible = ref(false)
const editingId = ref(null)

const form = reactive({ name: '', type: '', description: '', nodes: [] })

onMounted(() => fetchList())

async function fetchList() {
  loading.value = true
  try {
    const res = await getTemplateList()
    templates.value = res.data?.records || res.data || []
  } catch {} finally { loading.value = false }
}

function openDialog(row) {
  if (row) {
    editingId.value = row.id
    Object.assign(form, { name: row.name, type: row.type, description: row.description, nodes: row.nodes || [] })
  } else {
    editingId.value = null
    Object.assign(form, { name: '', type: '', description: '', nodes: [] })
  }
  dialogVisible.value = true
}

async function handleSave() {
  try {
    if (editingId.value) {
      await updateTemplate(editingId.value, form)
    } else {
      await createTemplate(form)
    }
    ElMessage.success('保存成功')
    dialogVisible.value = false
    fetchList()
  } catch {}
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确定删除模板"${row.name}"吗？`, '确认')
    await deleteTemplate(row.id)
    ElMessage.success('已删除')
    fetchList()
  } catch {}
}
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-header h3 { font-size: 18px; }
.node-row { display: flex; gap: 8px; align-items: center; margin-bottom: 8px; }
</style>
