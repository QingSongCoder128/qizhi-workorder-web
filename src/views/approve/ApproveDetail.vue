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
              <el-button :loading="submitting" @click="showTransfer = true">
                <el-icon><Switch /></el-icon>转交
              </el-button>
            </div>
          </el-form-item>
        </el-form>
      </div>
    </div>

    <!-- 转交弹窗 -->
    <el-dialog v-model="showTransfer" title="转交审批" width="400px">
      <el-form label-width="80px">
        <el-form-item label="转交给">
          <el-input v-model="transferTo" placeholder="请输入审批人账号" />
        </el-form-item>
        <el-form-item label="转交原因">
          <el-input v-model="transferReason" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showTransfer = false">取消</el-button>
        <el-button type="primary" @click="handleTransfer">确认转交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getApprovalDetail, approveOrder, rejectOrder, transferOrder } from '@/api/approve'
import PriorityTag from '@/components/PriorityTag.vue'
import ApprovalTimeline from '@/components/ApprovalTimeline.vue'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const submitting = ref(false)
const detail = ref({})
const approvalNodes = ref([])
const comment = ref('')
const showTransfer = ref(false)
const transferTo = ref('')
const transferReason = ref('')

onMounted(async () => {
  loading.value = true
  try {
    const res = await getApprovalDetail(route.params.id)
    detail.value = res.data?.workOrder || {}
    approvalNodes.value = res.data?.nodes || []
  } catch {} finally { loading.value = false }
})

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

async function handleTransfer() {
  if (!transferTo.value) { ElMessage.warning('请输入转交人'); return }
  try {
    await transferOrder(route.params.id, { targetUsername: transferTo.value, reason: transferReason.value })
    ElMessage.success('已转交')
    showTransfer.value = false
    router.push('/approve/pending')
  } catch {}
}
</script>

<style scoped>
h4 { margin-bottom: 16px; font-size: 15px; }
.action-btns { display: flex; gap: 12px; }
</style>
