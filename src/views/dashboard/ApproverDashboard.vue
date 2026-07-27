<template>
  <div class="appr-dash page-container">
    <!-- 顶部欢迎区 -->
    <div class="dash-hero">
      <div class="hero-text">
        <h2 class="page-title">审批工作台</h2>
        <p class="page-subtitle">{{ userStore.realName || userStore.username }}，以下是您的待办审批概览</p>
      </div>
      <el-button type="primary" :icon="Stamp" round @click="$router.push('/approve/pending')">进入审批</el-button>
    </div>

    <!-- 指标卡片 -->
    <div v-loading="loading" class="stat-grid">
      <div v-for="c in cards" :key="c.label" class="stat-card" :class="c.cls" @click="$router.push('/approve/pending')">
        <div class="stat-icon" :style="{ background: c.bg, color: c.color }">
          <el-icon :size="18"><component :is="c.icon" /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ c.value }}</span>
          <span class="stat-label">{{ c.label }}</span>
        </div>
      </div>
    </div>

    <!-- 主体区域：左右两栏 -->
    <el-row :gutter="16">
      <!-- 左侧：待审批列表 -->
      <el-col :span="14">
        <div class="panel list-panel">
          <div class="panel-header">
            <span class="panel-title">待审批列表</span>
            <el-link type="primary" underline="never" @click="$router.push('/approve/pending')">全部待办 →</el-link>
          </div>
          <div class="order-list">
            <div v-for="p in quickList" :key="p.id" class="order-item" @click="$router.push(`/approve/detail/${p.id}`)">
              <div class="order-left">
                <span class="order-title">{{ p.title }}</span>
                <div class="order-meta">
                  <span class="order-no">{{ p.orderNo }}</span>
                  <span class="order-submitter">{{ p.submitterName }}</span>
                </div>
              </div>
              <div class="order-right">
                <el-tag :type="priorityTag(p.priority)" size="small" effect="light" round>{{ priorityLabel(p.priority) }}</el-tag>
                <el-tag v-if="isInstTimeout(p)" type="danger" size="small" effect="dark" round>超时</el-tag>
                <span class="order-time">{{ formatTime(p.createdAt) }}</span>
              </div>
            </div>
            <el-empty v-if="!quickList.length && !loading" description="暂无待审批工单" :image-size="56" />
          </div>
        </div>
      </el-col>

      <!-- 右侧：图表 + 督办消息 -->
      <el-col :span="10">
        <div class="right-stack">
          <div class="panel chart-panel">
            <div class="panel-header"><span class="panel-title">优先级分布</span></div>
            <div ref="pieRef" class="chart-body"></div>
          </div>
          <div class="panel msg-panel">
            <div class="panel-header">
              <span class="panel-title">督办消息</span>
              <el-link type="primary" underline="never" @click="$router.push('/message')">更多 →</el-link>
            </div>
            <div class="msg-list">
              <div v-for="m in urgeMessages.slice(0, 4)" :key="m.id" class="msg-item" @click="$router.push('/message')">
                <div class="msg-icon" :style="{ color: msgColor(m.msgType), background: msgBg(m.msgType) }">
                  <el-icon :size="13"><component :is="msgIcon(m.msgType)" /></el-icon>
                </div>
                <div class="msg-body">
                  <span class="msg-title">{{ m.title }}</span>
                  <span class="msg-time">{{ formatTime(m.createdAt) }}</span>
                </div>
                <i v-if="!m.isRead" class="unread-dot"></i>
              </div>
              <el-empty v-if="!urgeMessages.length && !loading" description="暂无消息" :image-size="36" />
            </div>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Stamp } from '@element-plus/icons-vue'
import * as echarts from 'echarts/core'
import { PieChart } from 'echarts/charts'
import { LegendComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { getPendingApprovals } from '@/api/approve'

echarts.use([PieChart, LegendComponent, TooltipComponent, CanvasRenderer])
import { getMessageList } from '@/api/message'
import { useUserStore } from '@/store/user'
import { PRIORITY, MSG_TYPE, resolveEnum } from '@/utils/constants'
import { formatTime } from '@/utils/time'

const userStore = useUserStore()
const loading = ref(false)
const pending = ref([])
const urgeMessages = ref([])
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
    { label: '待审批', value: list.length, icon: 'Document', bg: '#eff6ff', color: '#2563eb', cls: 'card-blue' },
    { label: '紧急待办', value: list.filter(p => p.priority === 'URGENT').length, icon: 'Warning', bg: '#fef2f2', color: '#dc2626', cls: 'card-red' },
    { label: '超时待办', value: list.filter(isInstTimeout).length, icon: 'AlarmClock', bg: '#fff7ed', color: '#ea580c', cls: 'card-orange' },
    { label: '流转中', value: list.filter(p => p.status === 'APPROVING').length, icon: 'Loading', bg: '#f0fdf4', color: '#16a34a', cls: 'card-green' }
  ]
})

const quickList = computed(() =>
  [...pending.value]
    .sort((a, b) => {
      const ta = isInstTimeout(a) ? 1 : 0, tb = isInstTimeout(b) ? 1 : 0
      if (ta !== tb) return tb - ta
      const pa = a.priority === 'URGENT' ? 2 : a.priority === 'NORMAL' ? 1 : 0
      const pb = b.priority === 'URGENT' ? 2 : b.priority === 'NORMAL' ? 1 : 0
      if (pa !== pb) return pb - pa
      return (a.createdAt || '').localeCompare(b.createdAt || '')
    })
    .slice(0, 8)
)

function priorityLabel(p) { return resolveEnum(PRIORITY, p, p) }
function priorityTag(p) { return PRIORITY[p]?.type || 'info' }
function msgIcon(t) { return MSG_TYPE[t]?.icon || 'Bell' }
function msgColor(t) { return MSG_TYPE[t]?.color || '#64748b' }
function msgBg(t) {
  const map = { TIMEOUT_NOTIFY: '#fef2f2', URGE_NOTIFY: '#fffbeb', TIMEOUT_REMIND: '#fef2f2', DELAY_REMIND: '#eff6ff' }
  return map[t] || '#f1f5f9'
}

async function fetchData() {
  loading.value = true
  try {
    const [pendRes, msgRes] = await Promise.all([
      getPendingApprovals({ current: 1, size: 200 }),
      getMessageList({ current: 1, size: 50 }).catch(() => ({ data: {} }))
    ])
    pending.value = pendRes.data?.records || []
    const all = msgRes.data?.records || []
    urgeMessages.value = all.filter(m => ['TIMEOUT_NOTIFY', 'URGE_NOTIFY', 'TIMEOUT_REMIND', 'DELAY_REMIND'].includes(m.msgType)).slice(0, 6)
    renderPie()
  } finally { loading.value = false }
}

function renderPie() {
  if (!pieChart) pieChart = echarts.init(pieRef.value)
  const groups = {}
  pending.value.forEach(p => { groups[p.priority] = (groups[p.priority] || 0) + 1 })
  const colorMap = { URGENT: '#dc2626', NORMAL: '#2563eb', LOW: '#059669' }
  const data = Object.keys(groups).map(k => ({ name: priorityLabel(k), value: groups[k], itemStyle: { color: colorMap[k] || '#94a3b8' } }))
  pieChart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c}单 ({d}%)', backgroundColor: '#fff', borderColor: '#e2e8f0', textStyle: { color: '#1e293b', fontSize: 12 } },
    legend: { bottom: 0, textStyle: { fontSize: 11, color: '#64748b' }, icon: 'circle', itemWidth: 8, itemHeight: 8 },
    series: [{
      type: 'pie', radius: ['45%', '70%'], center: ['50%', '42%'],
      itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
      label: { show: false }, emphasis: { label: { show: true, fontSize: 12, fontWeight: 600 } },
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

.dash-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 28px;
  margin-bottom: 20px;
  background: linear-gradient(135deg, #f0f7ff 0%, #e8f4fd 50%, #f5f0ff 100%);
  border-radius: 14px;
  border: 1px solid #dbeafe;

  .page-title { font-size: 22px; font-weight: 700; color: #1e293b; margin: 0; }
  .page-subtitle { font-size: 14px; color: #64748b; margin: 6px 0 0; }
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 20px;
}

.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 18px 20px;
  border: 1px solid #e8eef7;
  display: flex;
  align-items: center;
  gap: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    border-radius: 3px 3px 0 0;
  }
  &.card-blue::before { background: linear-gradient(90deg, #3b82f6, #60a5fa); }
  &.card-red::before { background: linear-gradient(90deg, #ef4444, #f87171); }
  &.card-orange::before { background: linear-gradient(90deg, #f97316, #fb923c); }
  &.card-green::before { background: linear-gradient(90deg, #22c55e, #4ade80); }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(37, 99, 235, 0.08);
    border-color: #c7d8f0;
  }

  .stat-icon {
    width: 40px; height: 40px;
    border-radius: 10px;
    display: grid; place-items: center;
    flex-shrink: 0;
  }

  .stat-info {
    display: flex; flex-direction: column;
    .stat-value { font-size: 24px; font-weight: 700; color: #1e293b; line-height: 1.2; font-variant-numeric: tabular-nums; }
    .stat-label { font-size: 13px; color: #94a3b8; margin-top: 2px; }
  }
}

.list-panel {
  height: 100%;
  min-height: 520px;
}

.order-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s ease;
  border-bottom: 1px solid #f1f5f9;

  &:last-child { border-bottom: none; }
  &:hover { background: #f8fafc; transform: translateX(2px); }

  .order-left {
    flex: 1; min-width: 0;
    .order-title {
      font-size: 14px; font-weight: 600; color: #1e293b;
      display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .order-meta {
      display: flex; gap: 12px; margin-top: 5px; font-size: 12px; color: #94a3b8;
      .order-no { font-family: 'JetBrains Mono', monospace; }
      .order-submitter { color: #64748b; }
    }
  }

  .order-right {
    display: flex; align-items: center; gap: 8px; flex-shrink: 0; margin-left: 16px;
    .order-time { font-size: 12px; color: #94a3b8; }
  }
}

.right-stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
}

.chart-panel {
  flex: 1;
  min-height: 240px;

  .chart-body { min-height: 180px; }
}

.msg-panel {
  flex: 1;

  .msg-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .msg-item {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 12px;
    border-radius: 8px;
    background: #fafcff;
    border: 1px solid #f1f5f9;
    cursor: pointer;
    transition: all 0.15s ease;

    &:hover { background: #f0f7ff; border-color: #dbeafe; }

    .msg-icon {
      width: 28px; height: 28px;
      border-radius: 7px;
      display: grid; place-items: center;
      flex-shrink: 0;
    }

    .msg-body {
      flex: 1; min-width: 0;
      .msg-title { display: block; font-size: 12px; color: #334155; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .msg-time { font-size: 11px; color: #94a3b8; margin-top: 1px; display: block; }
    }

    .unread-dot { width: 6px; height: 6px; border-radius: 50%; background: #3b82f6; flex-shrink: 0; }
  }
}
</style>
