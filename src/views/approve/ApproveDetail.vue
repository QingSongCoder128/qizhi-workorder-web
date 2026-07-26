<template>
  <div class="page-container approve-detail-page">
    <!-- 顶部信息横幅 -->
    <div class="detail-banner">
      <div class="banner-bg"></div>
      <div class="banner-body">
        <div class="banner-left">
          <el-button class="back-btn" circle @click="$router.back()">
            <el-icon><ArrowLeft /></el-icon>
          </el-button>
          <div class="banner-info">
            <div class="banner-title">
              {{ detail.title || '加载中...' }}
              <el-tag v-if="detail.priority === 'URGENT'" type="danger" size="small" effect="dark">紧急</el-tag>
              <el-tag v-if="detail.status" :type="ORDER_STATUS[detail.status]?.tag" size="small">
                {{ ORDER_STATUS[detail.status]?.label || detail.status }}
              </el-tag>
            </div>
            <div class="banner-meta">
              <span class="mono-text">{{ detail.orderNo }}</span>
              <span><el-icon><User /></el-icon>{{ submitterInfo.realName || detail.submitterName }}</span>
              <span><el-icon><Clock /></el-icon>{{ formatDate(detail.createdAt) }}</span>
              <span v-if="detail.type"><el-icon><Folder /></el-icon>{{ ORDER_TYPE[detail.type]?.label || detail.type }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-loading="loading">
      <el-row :gutter="20">
        <el-col :span="16">
          <!-- 工单信息 -->
          <div class="section-card">
            <div class="section-title"><el-icon><Document /></el-icon> 工单信息</div>
            <el-descriptions :column="2" border>
              <el-descriptions-item label="工单编号">
                <span class="mono-text">{{ detail.orderNo }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="优先级"><PriorityTag v-if="detail.priority" :priority="detail.priority" /></el-descriptions-item>
              <el-descriptions-item label="标题">
                <span class="order-title">{{ detail.title }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="提交人">
                <div class="submitter-cell">
                  <span class="submitter-name">{{ submitterInfo.realName || detail.submitterName }}</span>
                  <span v-if="submitterInfo.phone || submitterInfo.email" class="submitter-contact">
                    {{ submitterInfo.phone }}<template v-if="submitterInfo.phone && submitterInfo.email"> · </template>{{ submitterInfo.email }}
                  </span>
                </div>
              </el-descriptions-item>
              <el-descriptions-item label="工单类型">
                <el-tag size="small" effect="plain">{{ ORDER_TYPE[detail.type]?.label || detail.type || '-' }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="提交时间">{{ formatDate(detail.createdAt) }}</el-descriptions-item>
              <el-descriptions-item label="详情" :span="2">
                <div class="order-detail-text">{{ detail.detail }}</div>
              </el-descriptions-item>
            </el-descriptions>
          </div>

          <!-- AI分析 -->
          <div v-if="detail.aiCategory || detail.aiConfidence" class="section-card ai-section">
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
              <div v-if="detail.aiSuggestion" class="ai-item">
                <span class="ai-label">预审建议</span>
                <span class="ai-value">{{ detail.aiSuggestion }}</span>
              </div>
              <div class="ai-item">
                <span class="ai-label">敏感内容检测</span>
                <el-tag v-if="detail.aiSensitiveWords" type="danger" size="small">{{ detail.aiSensitiveWords }}</el-tag>
                <span v-else class="ai-safe-text">未检测到敏感内容</span>
              </div>
            </div>
          </div>

          <!-- 审批操作 -->
          <div class="section-card action-section">
            <div class="section-title"><el-icon><Edit /></el-icon> 审批操作</div>
            <el-form label-width="80px">
              <el-form-item label="审批意见">
                <el-input v-model="comment" type="textarea" :rows="3" placeholder="请输入审批意见（通过时选填，驳回时必填）" maxlength="500" show-word-limit />
              </el-form-item>
              <el-form-item>
                <div class="action-btns">
                  <el-button type="success" size="large" :loading="submitting" class="action-btn action-btn--main" @click="handleApprove">
                    <el-icon><Check /></el-icon>通过
                  </el-button>
                  <el-button type="danger" plain size="large" :loading="submitting" class="action-btn" @click="handleReject">
                    <el-icon><Close /></el-icon>驳回
                  </el-button>
                  <el-button plain size="large" :loading="submitting" class="action-btn" @click="openTransferDialog">
                    <el-icon><Switch /></el-icon>转交
                  </el-button>
                  <el-dropdown trigger="click" @command="handleMoreCommand">
                    <el-button size="large" class="action-btn action-btn--more">
                      更多操作<el-icon class="el-icon--right"><ArrowDown /></el-icon>
                    </el-button>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item command="addNode">
                          <el-icon><Plus /></el-icon>加签（新增审批节点）
                        </el-dropdown-item>
                        <el-dropdown-item command="removeNode" :disabled="pendingNodes.length === 0">
                          <el-icon><Minus /></el-icon>减签（跳过后续节点）
                        </el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </div>
                <div class="action-tips">
                  <span><el-icon><InfoFilled /></el-icon> 通过/驳回为最终操作，转交/加签/减签不结束审批</span>
                </div>
              </el-form-item>
            </el-form>
          </div>
        </el-col>

        <el-col :span="8">
          <!-- 审批流程 -->
          <div class="section-card">
            <div class="section-title"><el-icon><Stamp /></el-icon> 审批流程</div>
            <ApprovalTimeline :nodes="approvalNodes" />
          </div>

          <!-- 审批须知 -->
          <div class="section-card notice-card">
            <div class="section-title"><el-icon><Bell /></el-icon> 审批须知</div>
            <ul class="notice-list">
              <li>驳回操作必须填写驳回原因，提交人可修改后重新提交</li>
              <li>紧急工单审批时限 1 小时，普通工单 4 小时，低优先级 12 小时</li>
              <li>超时未处理将触发督办通知，并记录超时标记</li>
              <li>转交后由新审批人继续处理，加签会在当前节点后新增审批人</li>
            </ul>
          </div>
        </el-col>
      </el-row>
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
import { ArrowLeft, User, Clock, Folder, Bell } from '@element-plus/icons-vue'
import { getApprovalDetail, approveOrder, rejectOrder, transferOrder, addApprovalNode, removeApprovalNode } from '@/api/approve'
import { getUsersByRole, getUserList } from '@/api/user'
import { useUserStore } from '@/store/user'
import { ORDER_STATUS, ORDER_TYPE, AI_CATEGORY } from '@/utils/constants'
import { formatDate } from '@/utils/format'
import PriorityTag from '@/components/PriorityTag.vue'
import ApprovalTimeline from '@/components/ApprovalTimeline.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)
const submitting = ref(false)
const detail = ref({})
const approvalNodes = ref([])
const submitterInfo = ref({})
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

const confidenceColor = computed(() => {
  const v = (detail.value.aiConfidence || 0) * 100
  if (v >= 90) return '#10b981'
  if (v >= 70) return '#6366f1'
  return '#f59e0b'
})

onMounted(async () => {
  loading.value = true
  try {
    const res = await getApprovalDetail(route.params.id)
    detail.value = res.data?.workOrder || {}
    approvalNodes.value = res.data?.nodes || []
    // 提交人：按账号名查用户服务获取真实姓名与联系方式（仅管理员可查，非管理员自动降级为账号名）
    if (detail.value.submitterName && userStore.role === 'ADMIN') {
      try {
        const uRes = await getUserList({ keyword: detail.value.submitterName, page: 1, pageSize: 50 })
        const matched = (uRes.data?.records || []).find(u => u.username === detail.value.submitterName)
        if (matched) submitterInfo.value = matched
      } catch {}
    }
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
    await approveOrder(route.params.id, { comment: comment.value, versionNo: detail.value.versionNo })
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
    await rejectOrder(route.params.id, { comment: comment.value, versionNo: detail.value.versionNo })
    ElMessage.success('已驳回')
    router.push('/approve/pending')
  } catch {} finally { submitting.value = false }
}

function handleMoreCommand(command) {
  if (command === 'addNode') openAddNodeDialog()
  else if (command === 'removeNode') openRemoveNodeDialog()
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
      reason: transferForm.value.reason,
      versionNo: detail.value.versionNo
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
      reason: addNodeForm.value.reason,
      versionNo: detail.value.versionNo
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
      reason: removeNodeForm.value.reason,
      versionNo: detail.value.versionNo
    })
    ElMessage.success('减签成功')
    showRemoveNode.value = false
    await refreshDetail()
  } catch {} finally { submitting.value = false }
}
</script>

<style scoped lang="scss">
.approve-detail-page {
  // 顶部横幅
  .detail-banner {
    position: relative;
    border-radius: $radius-lg;
    overflow: hidden;
    margin-bottom: $page-gap;
    background: $bg-card;
    border: 1px solid $border-light;

    .banner-bg {
      height: 72px;
      background: $gray-950;
    }

    .banner-body {
      padding: 0 $space-6 18px;
      margin-top: -32px;
      position: relative;

      .banner-left {
        display: flex;
        align-items: flex-end;
        gap: $space-4;

        .back-btn {
          width: 40px;
          height: 40px;
          background: #fff;
          border: none;
          box-shadow: $shadow-md;
          font-size: 16px;
          flex-shrink: 0;

          &:hover { color: $brand; }
        }

        .banner-info {
          padding-bottom: 2px;
          min-width: 0;

          .banner-title {
            font-size: $text-xl;
            font-weight: 700;
            color: $text-primary;
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: $space-2;
          }

          .banner-meta {
            display: flex;
            gap: $space-5;
            font-size: $text-base;
            color: $text-secondary;
            flex-wrap: wrap;

            span {
              display: flex;
              align-items: center;
              gap: 5px;

              .el-icon {
                color: $brand;
                font-size: 14px;
              }
            }
          }
        }
      }
    }
  }

  // 通用卡片
  .section-card {
    background: $bg-card;
    border-radius: $radius-lg;
    padding: $space-5 $space-6;
    border: 1px solid $border-light;
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

  .order-title {
    font-weight: 600;
    font-size: $text-md;
  }

  .order-detail-text {
    line-height: $leading-relaxed;
    white-space: pre-wrap;
    color: $text-secondary;
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

  // AI 分析区域
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

      .ai-priority {
        display: flex;
        align-items: center;
      }

      .ai-note {
        font-size: $text-xs;
        color: $text-muted;
        line-height: $leading-normal;
      }

      .ai-safe-text {
        font-size: $text-sm;
        color: $success;
      }
    }
  }

  // 审批操作区域
  .action-section {
    border: 1px solid $brand-subtle;
    background: $brand-light;
  }

  .action-btns {
    display: flex;
    gap: 14px;
    flex-wrap: wrap;
    align-items: center;

    .action-btn {
      min-width: 100px;
      font-weight: 500;
      border-radius: $radius-md;
    }

    .action-btn--main {
      min-width: 130px;
      font-weight: 600;
      letter-spacing: 1px;
    }

    .action-btn--more {
      color: $text-secondary;
    }
  }

  .action-tips {
    margin-top: $space-3;
    font-size: $text-sm;
    color: $text-muted;
    display: flex;
    align-items: center;
    gap: 4px;

    .el-icon { font-size: 13px; }
  }

  // 审批须知
  .notice-card {
    background: $warning-light;
    border: 1px solid rgba(217, 119, 6, 0.15);

    .section-title .el-icon { color: $warning; }

    .notice-list {
      margin: 0;
      padding: 0;
      list-style: none;

      li {
        position: relative;
        padding: 8px 0 8px 18px;
        font-size: $text-base;
        color: #78350f;
        line-height: $leading-relaxed;

        &::before {
          content: '';
          position: absolute;
          left: 0;
          top: 15px;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: $warning;
        }

        & + li {
          border-top: 1px dashed rgba(217, 119, 6, 0.2);
        }
      }
    }
  }
}
</style>
