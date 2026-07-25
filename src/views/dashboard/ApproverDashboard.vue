<template>
  <div class="appr-dash">
    <!-- 顶部 -->
    <div class="dash-header">
      <div>
        <h2 class="page-title"><el-icon><Stamp /></el-icon> 审批工作台</h2>
        <p class="page-subtitle">{{ userStore.realName || userStore.username }}，以下是您的待办审批概览</p>
      </div>
      <el-button type="primary" :icon="Stamp" @click="$router.push('/approve/pending')">进入审批</el-button>
    </div>

    <!-- 统计卡片 -->
    <div class="stat-grid" v-loading="loading">
      <div class="stat-card" v-for="c in cards" :key="c.label" @click="$router.push('/approve/pending')">
        <div class="stat-icon" :style="{ background: c.gradient }">
          <el-icon :size="20" color="#fff"><component :is="c.icon" /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ c.value }}</span>
          <span class="stat-label">{{ c.label }}</span>
        </div>
      </div>
    </div>

    <!-- 平均处理时长 -->
    <div class="avg-bar">
      <el-icon><Timer /></el-icon>
      <span>全局平均审批时长：</span>
      <b>{{ formatAvg(avgMinutes) }}</b>
    </div>

    <el-row :gutter="20" class="row-gap">
      <!-- 待审批快捷列表 -->
      <el-col :span="14">
        <div class="panel">
          <div class="panel-header">
            <span class="panel-title">待审批快捷列表</span>
            <el-link type="primary" :underline="false" @click="$router.push('/approve/pending')">全部待办</el-link>
          </div>
          <div class="order-list">
            <div class="order-item" v-for="p in quickList" :key="p.id" @click="$router.push(`/approve/detail/${p.id}`)">
              <div class="order-main">
                <span class="order-title">{{ p.title }}</span>
                <el-tag :type="priorityTag(p.priority)" size="small" effect="light">{{ priorityLabel(p.priority) }}</el-tag>
              </div>
              <div class="order-sub">
                <span class="order-no">{{ p.orderNo }}</span>
                <span>提交人：{{ p.submitterName }}</span>
                <el-tag v-if="isInstTimeout(p)" type="danger" size="small" effect="plain">已超时</el-tag>
                <span class="order-time">{{ formatTime(p.createdAt) }}</span>
              </div>
            </div>
            <el-empty v-if="!quickList.length && !loading" description="暂无待审批工单" :image-size="60" />
          </div>
        </div>
      </el-col>

      <!-- 优先级分布 -->
      <el-col :span="10">
        <div class="panel">
          <div class="panel-header"><span class="panel-title">待办优先级分布</span></div>
          <div ref="pieRef" class="chart-body"></div>
        </div>
      </el-col>
    </el-row>

    <!-- 督办消息 -->
    <el-row :gutter="20">
      <el-col :span="24">
        <div class="panel">
          <div class="panel-header">
            <span class="panel-title">督办消息</span>
            <el-link type="primary" :underline="false" @click="$router.push('/message')">消息中心</el-link>
          </div>
          <div class="msg-list">
            <div class="msg-item" v-for="m in urgeMessages" :key="m.id">
              <el-icon class="msg-icon" :style="{ color: msgColor(m.msgType) }"><component :is="msgIcon(m.msgType)" /></el-icon>
              <div class="msg-body">
                <span class="msg-title">{{ m.title }}</span>
                <span class="msg-time">{{ formatTime(m.createdAt) }}</span>
              </div>
              <i v-if="!m.isRead" class="unread-dot"></i>
            </div>
            <el-empty v-if="!urgeMessages.length && !loading" description="暂无督办消息" :image-size="60" />
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Stamp, Timer } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { getPendingApprovals } from '@/api/approve'
import { getDashboard } from '@/api/statistics'
import { getMessageList } from '@/api/message'
import { useUserStore } from '@/store/user'
import { PRIORITY, MSG_TYPE, resolveEnum } from '@/utils/constants'
import { formatTime } from '@/utils/time'

const userStore = useUserStore()
const loading = ref(false)
const pending = ref([])
const urgeMessages = ref([])
const avgMinutes = ref(0)
const pieRef = ref()
let pieChart = null

const INST_TIMEOUT = { URGENT: 60, NORMAL: 240, LOW: 720 }
function isInstTimeout(p) {
  if (!p.createdAt) return false
  const th = INST_TIMEOUT[p.priority] ?? INST_TIMEOUT.NORMAL
  return (Date.now() - new Date(p.createdAt).getTime()) / 60000 > th
}

const cards = computed(() => {
  const list = pending.value
  return [
    { label: '我的待审批', value: list.length, icon: 'Document', gradient: 'linear-gradient(135deg,#4f6ef7,#7c3aed)' },
    { label: '紧急待办', value: list.filter(p => p.priority === 'URGENT').length, icon: 'Warning', gradient: 'linear-gradient(135deg,#ef4444,#dc2626)' },
    { label: '超时待办', value: list.filter(isInstTimeout).length, icon: 'AlarmClock', gradient: 'linear-gradient(135deg,#f43f5e,#e11d48)' },
    { label: '流转中（二级审批）', value: list.filter(p => p.status === 'APPROVING').length, icon: 'Loading', gradient: 'linear-gradient(135deg,#3b82f6,#2563eb)' }
  ]
})

// 排序：超时优先 → 紧急优先 → 先提交先处理
const quickList = computed(() =>
  [...pending.value]
    .sort((a, b) => {
      const ta = isInstTimeout(a) ? 1 : 0
      const tb = isInstTimeout(b) ? 1 : 0
      if (ta !== tb) return tb - ta
      const pa = a.priority === 'URGENT' ? 2 : a.priority === 'NORMAL' ? 1 : 0
      const pb = b.priority === 'URGENT' ? 2 : b.priority === 'NORMAL' ? 1 : 0
      if (pa !== pb) return pb - pa
      return (a.createdAt || '').localeCompare(b.createdAt || '')
    })
    .slice(0, 6)
)

function priorityLabel(p) { return resolveEnum(PRIORITY, p, p) }
function priorityTag(p) { return PRIORITY[p]?.type || 'info' }
function msgIcon(t) { return MSG_TYPE[t]?.icon || 'Bell' }
function msgColor(t) { return MSG_TYPE[t]?.color || '#64748b' }

function formatAvg(mins) {
  if (!mins || mins <= 0) return '暂无数据'
  if (mins < 60) return `${mins}分钟`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}小时${m}分钟` : `${h}小时`
}

async function fetchData() {
  loading.value = true
  try {
    const [pendRes, dashRes, msgRes] = await Promise.all([
      getPendingApprovals({ current: 1, size: 200 }),
      getDashboard({}).catch(() => ({ data: {} })),
      getMessageList({ current: 1, size: 50 }).catch(() => ({ data: {} }))
    ])
    pending.value = pendRes.data?.records || []
    avgMinutes.value = dashRes.data?.avgApproveMinutes || 0
    const all = msgRes.data?.records || []
    urgeMessages.value = all.filter(m => ['TIMEOUT_NOTIFY', 'URGE_NOTIFY', 'TIMEOUT_REMIND', 'DELAY_REMIND'].includes(m.msgType)).slice(0, 6)
    renderPie()
  } finally {
    loading.value = false
  }
}

function renderPie() {
  if (!pieChart) pieChart = echarts.init(pieRef.value)
  const groups = {}
  pending.value.forEach(p => { groups[p.priority] = (groups[p.priority] || 0) + 1 })
  const colorMap = { URGENT: '#ef4444', NORMAL: '#4f6ef7', LOW: '#10b981' }
  const data = Object.keys(groups).map(k => ({ name: priorityLabel(k), value: groups[k], itemStyle: { color: colorMap[k] || '#94a3b8' } }))
  pieChart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c}单 ({d}%)' },
    legend: { bottom: 0, textStyle: { fontSize: 11, color: '#64748b' } },
    series: [{
      type: 'pie', radius: ['42%', '68%'], center: ['50%', '42%'],
      itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 3 },
      label: { show: false }, emphasis: { label: { show: true, fontSize: 13, fontWeight: 600 } },
      data: data.length ? data : [{ name: '暂无待办', value: 0 }]
    }]
  })
}

function handleResize() { pieChart?.resize() }
onMounted(() => { fetchData(); window.addEventListener('resize', handleResize) })
onUnmounted(() => { pieChart?.dispose(); window.removeEventListener('resize', handleResize) })
</script>

<style scoped lang="scss">
@use './dashboard-common.scss';

.avg-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
  border-radius: $border-radius-sm;
  margin-bottom: 20px;
  font-size: 13px;
  color: $text-secondary;

  .el-icon { color: #0ea5e9; font-size: 16px; }
  b { color: #0284c7; font-size: 15px; }
}
</style>
