<template>
  <div class="page-container">
    <el-page-header style="margin-bottom: 20px;" @back="$router.back()">
      <template #content>
        <div class="detail-header">
          <span class="detail-header-title">{{ detail.title || '工单详情' }}</span>
          <el-tag v-if="detail.status" size="small" :type="ORDER_STATUS[detail.status]?.tag">
            {{ ORDER_STATUS[detail.status]?.label || detail.status }}
          </el-tag>
          <PriorityTag v-if="detail.priority" :priority="detail.priority" />
        </div>
      </template>
    </el-page-header>

    <div v-loading="loading" class="detail-wrap">
      <!-- 步骤条 -->
      <div class="page-card steps-card">
        <el-steps :active="currentStep" finish-status="success" align-center>
          <el-step title="提交工单" :icon="Edit" />
          <el-step title="AI智能分析" :icon="MagicStick" />
          <el-step title="审批流转" :icon="Stamp" />
          <el-step title="办结完成" :icon="CircleCheck" />
        </el-steps>
      </div>

      <el-row :gutter="20">
        <!-- 左侧主信息 -->
        <el-col :span="15">
          <!-- 基本信息 -->
          <div class="page-card section-card">
            <div class="section-title"><el-icon><Document /></el-icon> 基本信息</div>
            <el-descriptions :column="2" border size="default">
              <el-descriptions-item label="工单编号">
                <span class="mono-text">{{ detail.orderNo }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="工单类型">
                <el-tag size="small" effect="plain">{{ ORDER_TYPE[detail.type]?.label || detail.type }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="标题" :span="2">
                <span class="detail-title">{{ detail.title }}</span>
                <el-icon v-if="detail.urgent" class="urgent-badge"><WarningFilled /></el-icon>
              </el-descriptions-item>
              <el-descriptions-item label="优先级">
                <PriorityTag v-if="detail.priority" :priority="detail.priority" />
              </el-descriptions-item>
              <el-descriptions-item label="提交人">
                <div class="submitter-cell">
                  <span class="submitter-name">{{ submitterInfo.realName || detail.submitterName }}</span>
                  <span v-if="submitterInfo.phone || submitterInfo.email" class="submitter-contact">
                    {{ submitterInfo.phone }}<template v-if="submitterInfo.phone && submitterInfo.email"> · </template>{{ submitterInfo.email }}
                  </span>
                </div>
              </el-descriptions-item>
              <el-descriptions-item label="关联部门">{{ DEPT_MAP[detail.departmentCode] || detail.deptName || '—' }}</el-descriptions-item>
              <el-descriptions-item label="提交时间">{{ formatDate(detail.createdAt) }}</el-descriptions-item>
              <el-descriptions-item label="详情描述" :span="2">
                <div class="detail-content">{{ detail.detail }}</div>
              </el-descriptions-item>
            </el-descriptions>

            <!-- 附件 -->
            <div v-if="detail.attachments?.length" class="attachment-section">
              <span class="attach-label">附件：</span>
              <el-image
                v-for="(url, i) in detail.attachments" :key="i"
                :src="url" :preview-src-list="detail.attachments"
                fit="cover" class="attach-img"
              />
            </div>

            <!-- 驳回原因 + 重新提交 -->
            <div v-if="detail.status === 'REJECTED'" class="reject-section">
              <el-alert type="error" :closable="false" show-icon>
                <template #title>工单已被驳回</template>
                <p>{{ rejectReason || '审批人未填写驳回原因' }}</p>
              </el-alert>
              <el-button type="warning" style="margin-top: 12px;" @click="openResubmit">
                <el-icon><RefreshRight /></el-icon> 修改后重新提交
              </el-button>
            </div>

            <!-- 撤销按钮（仅待审批状态可撤销） -->
            <div v-if="detail.status === 'PENDING_APPROVE'" class="revoke-section">
              <el-button type="danger" plain @click="handleRevoke">
                <el-icon><RemoveFilled /></el-icon> 撤销工单
              </el-button>
              <span class="revoke-hint">仅待审批状态的工单可以撤销</span>
            </div>
          </div>

          <!-- AI分析结果 -->
          <div v-if="detail.aiCategory || detail.aiPriorityReason || detail.aiSuggestion" class="page-card section-card ai-section">
            <div class="section-title ai-title">
              <div class="ai-title-icon"><el-icon><MagicStick /></el-icon></div>
              AI 智能分析结果
              <el-tag v-if="detail.aiAbnormal" type="danger" size="small" style="margin-left: 8px;">识别异常</el-tag>
              <el-tag v-else type="success" size="small" style="margin-left: 8px;">分析完成</el-tag>
            </div>
            <div class="ai-grid">
              <div class="ai-item">
                <span class="ai-label">AI 分派至</span>
                <span class="ai-value ai-highlight">{{ AI_CATEGORY[detail.aiCategory] || detail.aiCategory || '待分析' }}</span>
                <span class="ai-note">AI 识别的处理部门/类别</span>
              </div>
              <div class="ai-item">
                <span class="ai-label">分类置信度</span>
                <div class="confidence-bar">
                  <el-progress
                    :percentage="Math.round((detail.aiConfidence || 0) * 100)"
                    :stroke-width="10" :color="confidenceColor" :format="(p) => p + '%'"
                  />
                </div>
              </div>
              <div class="ai-item">
                <span class="ai-label">优先级判定</span>
                <div class="ai-priority">
                  <PriorityTag v-if="detail.priority" :priority="detail.priority" />
                  <span v-else class="ai-value">正常</span>
                </div>
                <span v-if="detail.aiPriorityReason" class="ai-note">判定依据：{{ detail.aiPriorityReason }}</span>
              </div>
              <div class="ai-item">
                <span class="ai-label">预审建议</span>
                <span class="ai-value">{{ safeText(detail.aiSuggestion) }}</span>
              </div>
              <div class="ai-item">
                <span class="ai-label">敏感内容检测</span>
                <el-tag v-if="detail.aiSensitiveWords" type="danger" size="small">{{ detail.aiSensitiveWords }}</el-tag>
                <span v-else class="ai-safe-text">未检测到敏感内容</span>
              </div>
              <div v-if="detail.aiAbnormal" class="ai-item">
                <span class="ai-label">异常标记</span>
                <el-alert type="warning" :closable="false" show-icon style="padding: 4px 12px;">
                  <template #title>AI识别异常，请人工核对</template>
                </el-alert>
              </div>
            </div>
          </div>
        </el-col>

        <!-- 右侧审批流程 + 历史 -->
        <el-col :span="9">
          <!-- 审批流转 -->
          <div v-if="approvalNodes.length" class="page-card section-card">
            <div class="section-title"><el-icon><Stamp /></el-icon> 审批流程</div>
            <div v-if="currentApproverName" class="current-approver">
              <el-icon><User /></el-icon>
              <span>当前审批人：<b>{{ currentApproverName }}</b></span>
              <span v-if="currentApprovalNode?.nodeName" class="current-node">（{{ currentApprovalNode.nodeName }}）</span>
            </div>
            <ApprovalTimeline :nodes="approvalNodes" />
          </div>

          <!-- 状态历史 -->
          <div v-if="statusHistory.length" class="page-card section-card">
            <div class="section-title"><el-icon><Clock /></el-icon> 状态变更</div>
            <WorkOrderTimeline :history="statusHistory" />
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 重新提交弹窗 -->
    <el-dialog v-model="resubmitVisible" title="修改后重新提交" width="560px" destroy-on-close>
      <el-form :model="resubmitForm" label-width="80px">
        <el-form-item label="工单标题">
          <el-input v-model="resubmitForm.title" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item label="详情描述">
          <el-input v-model="resubmitForm.detail" type="textarea" :rows="5" maxlength="2000" show-word-limit />
        </el-form-item>
        <el-form-item label="紧急标记">
          <el-switch v-model="resubmitForm.urgent" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="resubmitVisible = false">取消</el-button>
        <el-button type="primary" :loading="resubmitting" @click="doResubmit">确认重新提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Edit, MagicStick, Stamp, CircleCheck, WarningFilled, RefreshRight, RemoveFilled, User } from '@element-plus/icons-vue'
import { ORDER_STATUS, ORDER_TYPE, AI_CATEGORY, DEPT_MAP, safeText } from '@/utils/constants'
import { getWorkOrderDetail, resubmitWorkOrder, revokeWorkOrder } from '@/api/workOrder'
import { getApprovalRecordsByWorkOrder } from '@/api/approve'
import { getUserList } from '@/api/user'
import { useUserStore } from '@/store/user'
import { formatDate } from '@/utils/format'
import PriorityTag from '@/components/PriorityTag.vue'
import ApprovalTimeline from '@/components/ApprovalTimeline.vue'
import WorkOrderTimeline from '@/components/WorkOrderTimeline.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)
const detail = ref({})
const approvalNodes = ref([])
const statusHistory = ref([])
const submitterInfo = ref({})

const resubmitVisible = ref(false)
const resubmitting = ref(false)
const resubmitForm = reactive({ title: '', detail: '', urgent: false })

const currentStep = computed(() => {
  const s = detail.value.status
  if (!s) return 0
  if (s === 'PENDING_AI') return 1
  if (s === 'PENDING_APPROVE' || s === 'APPROVING') return 2
  if (s === 'APPROVED' || s === 'COMPLETED') return 3
  if (s === 'REJECTED') return 2
  return 0
})

const confidenceColor = computed(() => {
  const v = (detail.value.aiConfidence || 0) * 100
  if (v >= 90) return '#10b981'
  if (v >= 70) return '#6366f1'
  return '#f59e0b'
})

const rejectReason = computed(() => {
  const rejected = approvalNodes.value.find(n => n.status === 'REJECTED')
  return rejected?.opinion || ''
})

// 当前审批节点与审批人（审批流中第一个 PENDING/APPROVING 节点）
const currentApprovalNode = computed(() =>
  approvalNodes.value.find(n => n.status === 'PENDING' || n.status === 'APPROVING')
)
const currentApproverName = computed(() =>
  currentApprovalNode.value?.approverName || detail.value.currentApproverName || ''
)

onMounted(async () => {
  loading.value = true
  try {
    const res = await getWorkOrderDetail(route.params.id)
    detail.value = res.data || {}
    statusHistory.value = res.data?.statusHistory || []
    // 提交人：按账号名查用户服务获取真实姓名与联系方式（仅管理员可查，非管理员自动降级为账号名）
    if (detail.value.submitterName && userStore.role === 'ADMIN') {
      try {
        const uRes = await getUserList({ keyword: detail.value.submitterName, page: 1, pageSize: 50 })
        const matched = (uRes.data?.records || []).find(u => u.username === detail.value.submitterName)
        if (matched) submitterInfo.value = matched
      } catch {}
    }
    // 审批流：直连审批服务获取完整审批记录（含审批人、节点状态、序号）
    try {
      const recRes = await getApprovalRecordsByWorkOrder(route.params.id)
      approvalNodes.value = recRes.data || []
    } catch {
      approvalNodes.value = res.data?.approvalNodes || []
    }
  } catch {} finally {
    loading.value = false
  }
})

function openResubmit() {
  resubmitForm.title = detail.value.title
  resubmitForm.detail = detail.value.detail
  resubmitForm.urgent = !!detail.value.urgent
  resubmitVisible.value = true
}

async function doResubmit() {
  resubmitting.value = true
  try {
    await resubmitWorkOrder(route.params.id, resubmitForm)
    ElMessage.success('重新提交成功，工单将重新进入审批流程')
    resubmitVisible.value = false
    router.push('/workorder/my')
  } catch {
    ElMessage.error('提交失败')
  } finally {
    resubmitting.value = false
  }
}

async function handleRevoke() {
  try {
    await ElMessageBox.confirm('确定撤销该工单吗？撤销后不可恢复。', '撤销确认', {
      type: 'warning',
      confirmButtonText: '确定撤销',
      cancelButtonText: '取消'
    })
    await revokeWorkOrder(route.params.id)
    ElMessage.success('工单已撤销')
    router.push('/workorder/my')
  } catch {}
}
</script>

<style scoped lang="scss">
.detail-header {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.detail-header-title {
  font-size: $text-lg;
  font-weight: 600;
  max-width: 480px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.steps-card {
  margin-bottom: $page-gap;
  padding: 28px 40px;
}

.section-card {
  margin-bottom: $page-gap;
}

.section-title {
  font-size: $text-md;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: $space-4;
  display: flex;
  align-items: center;
  gap: $space-2;

  .el-icon { color: $brand; }
}

.mono-text {
  font-family: $font-mono;
  font-size: $text-base;
  color: $text-secondary;
}

.detail-title {
  font-weight: 600;
  font-size: $text-md;
}

.urgent-badge {
  color: $danger;
  margin-left: 6px;
  font-size: 16px;
}

.detail-content {
  line-height: $leading-relaxed;
  color: $text-secondary;
  white-space: pre-wrap;
}

.attachment-section {
  margin-top: $space-4;
  display: flex;
  align-items: center;
  gap: $space-2;

  .attach-label {
    font-size: $text-base;
    color: $text-secondary;
  }

  .attach-img {
    width: 72px;
    height: 72px;
    border-radius: $radius-md;
    border: 1px solid $border-color;
  }
}

.reject-section {
  margin-top: $page-gap;
  padding-top: $space-4;
  border-top: 1px solid $border-light;
}

.ai-section {
  background: $info-light;
  border: 1px solid rgba(99, 102, 241, 0.12);
}

.ai-title {
  .ai-title-icon {
    width: 28px;
    height: 28px;
    border-radius: $radius-md;
    background: $info;
    display: flex;
    align-items: center;
    justify-content: center;
    .el-icon { color: #fff; font-size: 14px; }
  }
}

.ai-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;

  .ai-item {
    display: flex;
    flex-direction: column;
    gap: 6px;

    .ai-label {
      font-size: $text-sm;
      color: $text-muted;
      font-weight: 500;
    }

    .ai-value {
      font-size: $text-base;
      color: $text-primary;
      line-height: $leading-normal;
    }

    .ai-highlight {
      font-weight: 600;
      color: $info;
      font-size: $text-md;
    }

    .confidence-bar {
      width: 100%;
      max-width: 200px;
    }

    .ai-safe-text {
      font-size: $text-base;
      color: $success;
    }

    .ai-note {
      font-size: $text-xs;
      color: $text-muted;
      line-height: $leading-normal;
    }

    .ai-priority {
      display: flex;
      align-items: center;
      gap: $space-2;
    }
  }
}

.submitter-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;

  .submitter-name {
    font-weight: 600;
    color: $text-primary;
  }

  .submitter-contact {
    font-size: $text-sm;
    color: $text-muted;
    font-variant-numeric: tabular-nums;
  }
}

.current-approver {
  display: flex;
  align-items: center;
  gap: $space-2;
  padding: 10px 14px;
  background: $brand-light;
  border: 1px solid $brand-subtle;
  border-radius: $radius-md;
  margin-bottom: $space-4;
  font-size: $text-base;
  color: $text-secondary;

  .el-icon { color: $brand; }
  b { color: $brand; font-weight: 600; }
  .current-node { color: $text-muted; font-size: $text-sm; }
}

.revoke-section {
  margin-top: $space-4;
  padding-top: $space-4;
  border-top: 1px solid $border-light;
  display: flex;
  align-items: center;
  gap: $space-3;

  .revoke-hint {
    font-size: $text-sm;
    color: $text-muted;
  }
}
</style>
