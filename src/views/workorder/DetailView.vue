<template>
  <div class="page-container">
    <el-page-header @back="$router.back()" content="工单详情" style="margin-bottom: 20px;" />

    <div v-loading="loading" class="detail-wrap">
      <!-- 基本信息 -->
      <div class="page-card" style="margin-bottom: 16px;">
        <h4>基本信息</h4>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="工单编号">{{ detail.orderNo }}</el-descriptions-item>
          <el-descriptions-item label="状态"><StatusTag :status="detail.status" /></el-descriptions-item>
          <el-descriptions-item label="标题">{{ detail.title }}</el-descriptions-item>
          <el-descriptions-item label="类型">{{ ORDER_TYPE[detail.type]?.label }}</el-descriptions-item>
          <el-descriptions-item label="优先级"><PriorityTag v-if="detail.priority" :priority="detail.priority" /></el-descriptions-item>
          <el-descriptions-item label="提交人">{{ detail.submitterName }}</el-descriptions-item>
          <el-descriptions-item label="关联部门">{{ detail.deptName || detail.deptCode }}</el-descriptions-item>
          <el-descriptions-item label="提交时间">{{ formatDate(detail.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="详情" :span="2">{{ detail.detail }}</el-descriptions-item>
        </el-descriptions>

        <!-- 附件 -->
        <div v-if="detail.attachments?.length" style="margin-top: 12px;">
          <span style="font-size: 13px; color: #666;">附件：</span>
          <el-image
            v-for="(url, i) in detail.attachments" :key="i"
            :src="url" :preview-src-list="detail.attachments"
            fit="cover" style="width: 80px; height: 80px; margin-right: 8px; border-radius: 4px;"
          />
        </div>
      </div>

      <!-- AI分析结果 -->
      <div v-if="detail.aiCategory || detail.aiPriority" class="page-card" style="margin-bottom: 16px;">
        <h4>AI 分析结果</h4>
        <el-descriptions :column="3" border>
          <el-descriptions-item label="分类">{{ AI_CATEGORY[detail.aiCategory] || '-' }}</el-descriptions-item>
          <el-descriptions-item label="置信度">{{ detail.aiConfidence ? (detail.aiConfidence * 100).toFixed(0) + '%' : '-' }}</el-descriptions-item>
          <el-descriptions-item label="优先级判定">{{ detail.aiPriorityReason || '-' }}</el-descriptions-item>
          <el-descriptions-item label="预审结果">{{ detail.aiPreAudit || '-' }}</el-descriptions-item>
          <el-descriptions-item label="敏感词" :span="2">{{ detail.aiSensitiveWords?.join('、') || '无' }}</el-descriptions-item>
        </el-descriptions>
      </div>

      <!-- 审批流转 -->
      <div v-if="approvalNodes.length" class="page-card" style="margin-bottom: 16px;">
        <h4>审批流程</h4>
        <ApprovalTimeline :nodes="approvalNodes" />
      </div>

      <!-- 状态历史 -->
      <div v-if="statusHistory.length" class="page-card">
        <h4>状态历史</h4>
        <WorkOrderTimeline :history="statusHistory" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ORDER_TYPE, AI_CATEGORY } from '@/utils/constants'
import { getWorkOrderDetail } from '@/api/workOrder'
import { formatDate } from '@/utils/format'
import StatusTag from '@/components/StatusTag.vue'
import PriorityTag from '@/components/PriorityTag.vue'
import ApprovalTimeline from '@/components/ApprovalTimeline.vue'
import WorkOrderTimeline from '@/components/WorkOrderTimeline.vue'

const route = useRoute()
const loading = ref(false)
const detail = ref({})
const approvalNodes = ref([])
const statusHistory = ref([])

onMounted(async () => {
  loading.value = true
  try {
    const res = await getWorkOrderDetail(route.params.id)
    detail.value = res.data || {}
    approvalNodes.value = res.data?.approvalNodes || []
    statusHistory.value = res.data?.statusHistory || []
  } catch {} finally {
    loading.value = false
  }
})
</script>

<style scoped>
.detail-wrap { min-height: 200px; }
h4 { margin-bottom: 16px; font-size: 15px; color: #333; }
</style>
