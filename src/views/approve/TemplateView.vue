<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title"><el-icon><Setting /></el-icon> 审批模板配置</div>
      <el-button type="primary" :icon="Plus" @click="openDialog()">新增模板</el-button>
    </div>

    <div class="tpl-list" v-loading="loading">
      <div v-for="tpl in templates" :key="tpl.id" class="tpl-card">
        <div class="tpl-card__header">
          <div class="tpl-card__title">
            <span class="tpl-name">{{ tpl.templateName }}</span>
            <el-tag size="small" effect="plain">{{ ORDER_TYPE[tpl.workType]?.label || '通用类型' }}</el-tag>
            <el-tag size="small" type="info" effect="plain">{{ DEPT_MAP[tpl.deptCode] || '通用部门' }}</el-tag>
          </div>
          <div class="tpl-card__ops">
            <el-button link type="primary" @click="openDialog(tpl)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(tpl)">删除</el-button>
          </div>
        </div>

        <!-- 可视化审批流程节点 -->
        <div class="tpl-flow">
          <div class="tpl-flow__start">
            <el-icon><Promotion /></el-icon><span>提交</span>
          </div>
          <template v-for="node in nodesOf(tpl.id)" :key="node.id">
            <div class="tpl-flow__arrow"><el-icon><Right /></el-icon></div>
            <div class="tpl-flow__node">
              <span class="node-badge">第{{ node.nodeOrder }}级</span>
              <span class="node-name">{{ node.nodeName }}</span>
              <span class="node-role">{{ ROLES[node.approverRole] || node.approverRole || '审批人' }}</span>
            </div>
          </template>
          <div class="tpl-flow__arrow"><el-icon><Right /></el-icon></div>
          <div class="tpl-flow__end">
            <el-icon><CircleCheck /></el-icon><span>办结</span>
          </div>
        </div>

        <div class="tpl-card__footer">
          <span class="node-count"><el-icon><Stamp /></el-icon>{{ nodesOf(tpl.id).length }} 级审批</span>
        </div>
      </div>

      <div v-if="templates.length === 0 && !loading" class="page-card">
        <div class="empty-state">
          <el-icon class="empty-icon"><Setting /></el-icon>
          <p class="empty-text">暂无审批模板，请点击"新增模板"创建</p>
        </div>
      </div>
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑模板' : '新增模板'" width="600px" destroy-on-close>
      <el-form :model="form" label-width="100px">
        <el-form-item label="模板名称" required><el-input v-model="form.templateName" placeholder="如 运维工单审批流程" maxlength="50" show-word-limit /></el-form-item>
        <el-form-item label="适用类型">
          <el-select v-model="form.workType" placeholder="通用（全部类型）" clearable style="width: 100%;">
            <el-option v-for="(v, k) in ORDER_TYPE" :key="k" :label="v.label" :value="k" />
          </el-select>
        </el-form-item>
        <el-form-item label="适用部门">
          <el-select v-model="form.deptCode" placeholder="通用（全部部门）" clearable style="width: 100%;">
            <el-option v-for="(v, k) in DEPT_MAP" :key="k" :label="v" :value="k" />
          </el-select>
        </el-form-item>
        <el-form-item label="审批节点">
          <div v-for="(node, i) in form.nodes" :key="i" class="node-row">
            <el-input-number v-model="node.nodeOrder" :min="1" style="width: 90px;" controls-position="right" />
            <el-input v-model="node.nodeName" placeholder="节点名称" style="width: 180px;" />
            <el-select v-model="node.approverRole" placeholder="审批角色" style="width: 140px;">
              <el-option v-for="(label, code) in ROLES" :key="code" :label="label" :value="code" />
            </el-select>
            <el-button link type="danger" @click="form.nodes.splice(i, 1)">删除</el-button>
          </div>
          <el-button type="primary" link @click="addNode">+ 添加节点</el-button>
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
import { Setting, Plus, Right, CircleCheck, Promotion, Stamp } from '@element-plus/icons-vue'
import { ORDER_TYPE, DEPT_MAP, ROLES } from '@/utils/constants'
import { getTemplateList, getTemplateNodes, createTemplate, updateTemplate, deleteTemplate } from '@/api/approve'

const loading = ref(false)
const saving = ref(false)
const templates = ref([])
const nodesMap = ref({})
const dialogVisible = ref(false)
const editingId = ref(null)

const form = reactive({ templateName: '', workType: '', deptCode: '', nodes: [] })

function nodesOf(templateId) {
  return nodesMap.value[templateId] || []
}

function addNode() {
  form.nodes.push({ nodeOrder: form.nodes.length + 1, nodeName: '', approverRole: 'APPROVER' })
}

onMounted(() => fetchList())

async function fetchList() {
  loading.value = true
  try {
    const res = await getTemplateList()
    templates.value = res.data?.records || res.data || []
    // 并发拉取每个模板的审批节点（审批流真实数据源）
    const entries = await Promise.all(
      templates.value.map(async tpl => {
        try {
          const r = await getTemplateNodes(tpl.id)
          return [tpl.id, r.data || []]
        } catch {
          return [tpl.id, []]
        }
      })
    )
    nodesMap.value = Object.fromEntries(entries)
  } catch {} finally { loading.value = false }
}

function openDialog(row) {
  if (row) {
    editingId.value = row.id
    const nodes = nodesOf(row.id).map(n => ({
      nodeOrder: n.nodeOrder,
      nodeName: n.nodeName,
      approverRole: n.approverRole || 'APPROVER'
    }))
    Object.assign(form, { templateName: row.templateName, workType: row.workType || '', deptCode: row.deptCode || '', nodes })
  } else {
    editingId.value = null
    Object.assign(form, { templateName: '', workType: '', deptCode: '', nodes: [] })
  }
  dialogVisible.value = true
}

async function handleSave() {
  if (!form.templateName.trim()) {
    ElMessage.warning('请输入模板名称')
    return
  }
  saving.value = true
  try {
    const payload = {
      templateName: form.templateName,
      workType: form.workType || null,
      deptCode: form.deptCode || null,
      nodes: form.nodes.map((n, i) => ({
        nodeOrder: n.nodeOrder || i + 1,
        nodeName: n.nodeName,
        approverRole: n.approverRole
      }))
    }
    if (editingId.value) {
      await updateTemplate(editingId.value, payload)
      ElMessage.success(`模板「${form.templateName}」更新成功`)
    } else {
      await createTemplate(payload)
      ElMessage.success(`模板「${form.templateName}」创建成功`)
    }
    dialogVisible.value = false
    fetchList()
  } catch {} finally { saving.value = false }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确定删除模板「${row.templateName}」吗？删除后不可恢复。`, '确认删除', { type: 'warning' })
    await deleteTemplate(row.id)
    ElMessage.success(`模板「${row.templateName}」已删除`)
    fetchList()
  } catch {}
}
</script>

<style scoped lang="scss">
.tpl-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.tpl-card {
  background: #fff;
  border: 1px solid #eef2f7;
  border-radius: $border-radius;
  padding: 20px 24px;
  box-shadow: $shadow-card;
  transition: all $transition-fast;

  &:hover {
    border-color: rgba(79, 110, 247, 0.25);
    box-shadow: 0 4px 16px rgba(79, 110, 247, 0.08);
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 18px;
  }

  &__title {
    display: flex;
    align-items: center;
    gap: 10px;

    .tpl-name {
      font-size: 15px;
      font-weight: 600;
      color: $text-primary;
    }
  }

  &__ops {
    display: flex;
    gap: 4px;
  }

  &__footer {
    margin-top: 14px;
    padding-top: 12px;
    border-top: 1px dashed #f1f5f9;

    .node-count {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 12px;
      color: $text-muted;

      .el-icon { color: $primary-color; }
    }
  }
}

.tpl-flow {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 14px 16px;
  background: #f8fafc;
  border-radius: $border-radius-sm;

  &__start,
  &__end {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    font-weight: 600;
    padding: 7px 12px;
    border-radius: 20px;
    flex-shrink: 0;
  }

  &__start {
    background: #eef2ff;
    color: #4f6ef7;
  }

  &__end {
    background: #ecfdf5;
    color: #10b981;
  }

  &__arrow {
    color: #cbd5e1;
    font-size: 14px;
    flex-shrink: 0;
  }

  &__node {
    display: flex;
    align-items: center;
    gap: 8px;
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 8px 12px;
    flex-shrink: 0;

    .node-badge {
      font-size: 11px;
      color: #4f6ef7;
      background: #eef2ff;
      padding: 1px 7px;
      border-radius: 4px;
      font-weight: 600;
    }

    .node-name {
      font-size: 13px;
      font-weight: 600;
      color: $text-primary;
    }

    .node-role {
      font-size: 12px;
      color: $text-secondary;
    }
  }
}

.node-row {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
}
</style>
