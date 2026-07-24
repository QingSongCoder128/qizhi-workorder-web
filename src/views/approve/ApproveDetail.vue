<template>
  <div class="page-container">
    <el-page-header @back="$router.back()" content="审批操作" style="margin-bottom: 20px;" />

    <div v-loading="loading">
      <!-- 工单信息 -->
      <div class="page-card" style="margin-bottom: 16px;">
        <h4>工单信息</h4>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="工单编号">{{ detail.orderNo }}</el-descriptions-item>
          <el-descriptions-item label="优先级"><PriorityTag v-if="detail.priority" :priority="detail.priority" /></el-descriptions-item>
          <el-descriptions-item label="标题">{{ detail.title }}</el-descriptions-item>
          <el-descriptions-item label="提交人">{{ detail.submitterName }}</el-descriptions-item>
          <el-descriptions-item label="详情" :span="2">{{ detail.detail }}</el-descriptions-item>
        </el-descriptions>
      </div>

      <!-- 审批流程 -->
      <div class="page-card" style="margin-bottom: 16px;">
        <h4>审批流程</h4>
        <ApprovalTimeline :nodes="approvalNodes" />
      </div>

      <!-- 审批操作 -->
      <div class="page-card">
        <h4>审批操作</h4>
        <el-form label-width="80px" style="max-width: 600px;">
          <el-form-item label="审批意见">
            <el-input v-model="comment" type="textarea" :rows="3" placeholder="请输入审批意见（选填）" />
          </el-form-item>
          <el-form-item>
            <div class="action-btns">
              <el-button type="success" :loading="submitting" @click="handleApprove">
                <el-icon><Check /></el-icon>通过
              </el-button>
              <el-button type="danger" :loading="submitting" @click="handleReject">
                <el-icon><Close /></el-icon>驳回
              </el-button>
              <el-button :loading="submitting" @click="openTransferDialog">
                <el-icon><Switch /></el-icon>转交
              </el-button>
              <el-button type="warning" :loading="submitting" @click="openAddNodeDialog">
                <el-icon><Plus /></el-icon>加签
              </el-button>
              <el-button v-if="pendingNodes.length > 0" type="info" :loading="submitting" @click="openRemoveNodeDialog">
                <el-icon><Minus /></el-icon>减签
              </el-button>
            </div>
          </el-form-item>
        </el-form>
      </div>
    </div>

    <!-- 转交弹窗 -->
    <el-dialog v-model="showTransfer" title="转交审批" width="420px">
      <el-form label-width="90px">
        <el-form-item label="转交给" required>
          <el-select v-model="transferForm.userId" placeholder="请选择审批人" style="width: 100%;" filterable>
            <el-option
              v-for="u in approverList"
              :key="u.id"
              :label="`${u.realName}（${u.username}）`"
              :value="u.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="转交理由" required>
          <el-input v-model="transferForm.reason" type="textarea" :rows="2" placeholder="请输入转交理由（必填）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showTransfer = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleTransfer">确认转交</el-button>
      </template>
    </el-dialog>

    <!-- 加签弹窗 -->
    <el-dialog v-model="showAddNode" title="加签（新增审批节点）" width="420px">
      <el-form label-width="90px">
        <el-form-item label="审批人" required>
          <el-select v-model="addNodeForm.approverId" placeholder="请选择加签审批人" style="width: 100%;" filterable>
            <el-option
              v-for="u in approverList"
              :key="u.id"
              :label="`${u.realName}（${u.username}）`"
              :value="u.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="节点名称">
          <el-input v-model="addNodeForm.nodeName" placeholder="默认：加签审批" />
        </el-form-item>
        <el-form-item label="加签理由" required>
          <el-input v-model="addNodeForm.reason" type="textarea" :rows="2" placeholder="请输入加签理由（必填，如：金额超限需总监确认）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddNode = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleAddNode">确认加签</el-button>
      </template>
    </el-dialog>

    <!-- 减签弹窗 -->
    <el-dialog v-model="showRemoveNode" title="减签（跳过后续节点）" width="420px">
      <el-form label-width="90px">
        <el-form-item label="跳过节点" required>
          <el-select v-model="removeNodeForm.nodeOrder" placeholder="请选择要跳过的节点" style="width: 100%;">
            <el-option
              v-for="node in pendingNodes"
              :key="node.nodeOrder"
              :label="`第${node.nodeOrder}级：${node.nodeName}（${node.approverName || '待分配'}）`"
              :value="node.nodeOrder"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="减签理由" required>
          <el-input v-model="removeNodeForm.reason" type="textarea" :rows="2" placeholder="请输入减签理由（必填，如：事项简单无需多级审批）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRemoveNode = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleRemoveNode">确认减签</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getApprovalDetail, approveOrder, rejectOrder, transferOrder, addApprovalNode, removeApprovalNode } from '@/api/approve'
import { getUsersByRole } from '@/api/user'
import PriorityTag from '@/components/PriorityTag.vue'
import ApprovalTimeline from '@/components/ApprovalTimeline.vue'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const submitting = ref(false)
const detail = ref({})
const approvalNodes = ref([])
const comment = ref('')
const approverList = ref([])

// 转交
const showTransfer = ref(false)
const transferForm = ref({ userId: null, reason: '' })

// 加签
const showAddNode = ref(false)
const addNodeForm = ref({ nodeName: '', approverId: null, reason: '' })

// 减签
const showRemoveNode = ref(false)
const removeNodeForm = ref({ nodeOrder: null, reason: '' })

// 计算后续待审批节点（用于减签）
const pendingNodes = computed(() => {
  const currentOrder = detail.value.currentOrder || 1
  return approvalNodes.value.filter(
    n => n.status === 'PENDING' && n.nodeOrder > currentOrder
  )
})

onMounted(async () => {
  loading.value = true
  try {
    const res = await getApprovalDetail(route.params.id)
    detail.value = res.data?.workOrder || {}
    approvalNodes.value = res.data?.nodes || []
  } catch {} finally { loading.value = false }
  // 加载审批人列表
  try {
    const res = await getUsersByRole('APPROVER')
    approverList.value = res.data || []
  } catch {}
})

// 刷新详情
async function refreshDetail() {
  try {
    const res = await getApprovalDetail(route.params.id)
    detail.value = res.data?.workOrder || {}
    approvalNodes.value = res.data?.nodes || []
  } catch {}
}

async function handleApprove() {
  submitting.value = true
  try {
    await approveOrder(route.params.id, { comment: comment.value })
    ElMessage.success('审批通过')
    router.push('/approve/pending')
  } catch {} finally { submitting.value = false }
}

async function handleReject() {
  if (!comment.value) {
    ElMessage.warning('驳回必须填写原因')
    return
  }
  try {
    await ElMessageBox.confirm('确定驳回该工单吗？', '确认')
    submitting.value = true
    await rejectOrder(route.params.id, { comment: comment.value })
    ElMessage.success('已驳回')
    router.push('/approve/pending')
  } catch {} finally { submitting.value = false }
}

function openTransferDialog() {
  transferForm.value = { userId: null, reason: '' }
  showTransfer.value = true
}

async function handleTransfer() {
  if (!transferForm.value.userId) {
    ElMessage.warning('请选择转交目标审批人')
    return
  }
  if (!transferForm.value.reason.trim()) {
    ElMessage.warning('请填写转交理由')
    return
  }
  const targetUser = approverList.value.find(u => u.id === transferForm.value.userId)
  submitting.value = true
  try {
    await transferOrder(route.params.id, {
      transferToUserId: transferForm.value.userId,
      transferToUserName: targetUser?.realName || '',
      reason: transferForm.value.reason
    })
    ElMessage.success('已转交')
    showTransfer.value = false
    router.push('/approve/pending')
  } catch {} finally { submitting.value = false }
}

function openAddNodeDialog() {
  addNodeForm.value = { nodeName: '', approverId: null, reason: '' }
  showAddNode.value = true
}

async function handleAddNode() {
  if (!addNodeForm.value.approverId) {
    ElMessage.warning('请选择加签审批人')
    return
  }
  if (!addNodeForm.value.reason.trim()) {
    ElMessage.warning('请填写加签理由')
    return
  }
  const targetUser = approverList.value.find(u => u.id === addNodeForm.value.approverId)
  submitting.value = true
  try {
    await addApprovalNode(route.params.id, {
      nodeName: addNodeForm.value.nodeName || '加签审批',
      approverId: addNodeForm.value.approverId,
      approverName: targetUser?.realName || '',
      reason: addNodeForm.value.reason
    })
    ElMessage.success('加签成功')
    showAddNode.value = false
    await refreshDetail()
  } catch {} finally { submitting.value = false }
}

function openRemoveNodeDialog() {
  removeNodeForm.value = { nodeOrder: null, reason: '' }
  showRemoveNode.value = true
}

async function handleRemoveNode() {
  if (!removeNodeForm.value.nodeOrder) {
    ElMessage.warning('请选择要跳过的节点')
    return
  }
  if (!removeNodeForm.value.reason.trim()) {
    ElMessage.warning('请填写减签理由')
    return
  }
  try {
    await ElMessageBox.confirm('确定跳过该审批节点吗？跳过后该节点审批人将无需审批。', '确认减签')
    submitting.value = true
    await removeApprovalNode(route.params.id, {
      nodeOrder: removeNodeForm.value.nodeOrder,
      reason: removeNodeForm.value.reason
    })
    ElMessage.success('减签成功')
    showRemoveNode.value = false
    await refreshDetail()
  } catch {} finally { submitting.value = false }
}
</script>

<style scoped>
h4 { margin-bottom: 16px; font-size: 15px; }
.action-btns { display: flex; gap: 12px; flex-wrap: wrap; }
</style>
