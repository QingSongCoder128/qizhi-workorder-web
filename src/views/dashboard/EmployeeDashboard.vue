<template>
  <div class="emp-dash page-container">
    <!-- 欢迎区 -->
    <div class="dash-header">
      <div>
        <h2 class="page-title">{{ greeting }}，{{ userStore.realName || userStore.username }}</h2>
        <p class="page-subtitle">这是您的工单概览，祝您工作愉快</p>
      </div>
      <el-button type="primary" :icon="Plus" @click="$router.push('/workorder/create')">新建工单</el-button>
    </div>

    <!-- 指标 -->
    <div v-loading="loading" class="stat-grid">
      <div v-for="c in cards" :key="c.label" class="stat-card" @click="$router.push('/workorder/my')">
        <div class="stat-icon" :style="{ background: c.bg, color: c.color }">
          <el-icon :size="17"><component :is="c.icon" /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ c.value }}</span>
          <span class="stat-label">{{ c.label }}</span>
        </div>
      </div>
    </div>

    <!-- 趋势 + 状态分布 -->
    <el-row :gutter="16" class="row-gap">
      <el-col :span="14">
        <div class="panel">
          <div class="panel-header"><span class="panel-title">最近 7 天工单趋势</span></div>
          <div ref="trendRef" class="chart-body"></div>
        </div>
      </el-col>
      <el-col :span="10">
        <div class="panel">
          <div class="panel-header"><span class="panel-title">状态分布</span></div>
          <div ref="pieRef" class="chart-body"></div>
        </div>
      </el-col>
    </el-row>

    <!-- 最近工单 + 消息 -->
    <el-row :gutter="16" class="list-row">
      <el-col :span="14">
        <div class="panel">
          <div class="panel-header">
            <span class="panel-title">最近工单</span>
            <el-link type="primary" :underline="false" @click="$router.push('/workorder/my')">查看全部</el-link>
          </div>
          <div class="order-list">
            <div v-for="o in recentOrders" :key="o.id" class="order-item" @click="$router.push(`/workorder/detail/${o.id}`)">
              <div class="order-main">
                <span class="order-title">{{ o.title }}</span>
                <el-tag :type="statusTag(o.status)" size="small" effect="light" round>{{ statusLabel(o.status) }}</el-tag>
              </div>
              <div class="order-sub">
                <span class="order-no">{{ o.orderNo }}</span>
                <el-tag v-if="isTimeout(o)" type="danger" size="small" effect="plain" round>超时</el-tag>
                <span class="order-time">{{ formatTime(o.createdAt) }}</span>
              </div>
            </div>
            <el-empty v-if="!recentOrders.length && !loading" description="暂无工单" :image-size="48" />
          </div>
        </div>
      </el-col>
      <el-col :span="10">
        <div class="panel">
          <div class="panel-header">
            <span class="panel-title">最新消息</span>
            <el-link type="primary" :underline="false" @click="$router.push('/message')">消息中心</el-link>
          </div>
          <div class="msg-list">
            <div v-for="m in messages" :key="m.id" class="msg-item" @click="$router.push('/message')">
              <div class="msg-icon" :style="{ color: msgColor(m.msgType) }">
                <el-icon :size="15"><component :is="msgIcon(m.msgType)" /></el-icon>
              </div>
              <div class="msg-body">
                <span class="msg-title">{{ m.title }}</span>
                <span class="msg-time">{{ formatTime(m.createdAt) }}</span>
              </div>
              <i v-if="!m.isRead" class="unread-dot"></i>
            </div>
            <el-empty v-if="!messages.length && !loading" description="暂无消息" :image-size="48" />
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import * as echarts from 'echarts/core'
import { LineChart, PieChart } from 'echarts/charts'
import {
  GridComponent,
  LegendComponent,
  TooltipComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { getMyWorkOrders } from '@/api/workOrder'

echarts.use([
  LineChart,
  PieChart,
  GridComponent,
  LegendComponent,
  TooltipComponent,
  CanvasRenderer
])
import { getMessageList } from '@/api/message'
import { useUserStore } from '@/store/user'
import { ORDER_STATUS, MSG_TYPE, resolveEnum } from '@/utils/constants'
import { isOrderTimeout, formatTime } from '@/utils/time'

const userStore = useUserStore()
const loading = ref(false)
const myOrders = ref([])
const messages = ref([])
const trendRef = ref()
const pieRef = ref()
let trendChart = null
let pieChart = null

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 9) return '早上好'
  if (h < 12) return '上午好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
})

const cards = computed(() => {
  const list = myOrders.value
  const pending = list.filter(o => ['PENDING_AI', 'PENDING_APPROVE', 'APPROVING'].includes(o.status)).length
  return [
    { label: '工单总数', value: list.length, icon: 'Document', bg: '#eff6ff', color: '#2563eb' },
    { label: '待审批', value: pending, icon: 'Clock', bg: '#fffbeb', color: '#d97706' },
    { label: '已完结', value: list.filter(o => o.status === 'COMPLETED').length, icon: 'CircleCheck', bg: '#ecfdf5', color: '#059669' },
    { label: '已驳回', value: list.filter(o => o.status === 'REJECTED').length, icon: 'CircleClose', bg: '#fef2f2', color: '#dc2626' },
    { label: '已超时', value: list.filter(o => isOrderTimeout(o)).length, icon: 'AlarmClock', bg: '#fef2f2', color: '#dc2626' }
  ]
})

const recentOrders = computed(() =>
  [...myOrders.value].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')).slice(0, 5)
)

function statusLabel(s) { return resolveEnum(ORDER_STATUS, s, s) }
function statusTag(s) { return ORDER_STATUS[s]?.tag || 'info' }
function msgIcon(t) { return MSG_TYPE[t]?.icon || 'Bell' }
function msgColor(t) { return MSG_TYPE[t]?.color || '#64748b' }

async function fetchData() {
  loading.value = true
  try {
    const [orderRes, msgRes] = await Promise.all([
      getMyWorkOrders({ current: 1, size: 200 }),
      getMessageList({ current: 1, size: 5 })
    ])
    myOrders.value = orderRes.data?.records || []
    messages.value = msgRes.data?.records || []
    renderTrend()
    renderPie()
  } finally {
    loading.value = false
  }
}

function renderTrend() {
  if (!trendChart) trendChart = echarts.init(trendRef.value)
  const days = [], counts = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    days.push(`${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
    counts.push(myOrders.value.filter(o => (o.createdAt || '').startsWith(key)).length)
  }
  trendChart.setOption({
    tooltip: { trigger: 'axis', backgroundColor: '#fff', borderColor: '#e2e8f0', textStyle: { color: '#1e293b', fontSize: 12 } },
    grid: { left: 36, right: 16, top: 16, bottom: 28 },
    xAxis: { type: 'category', boundaryGap: false, data: days, axisLine: { lineStyle: { color: '#e2e8f0' } }, axisLabel: { color: '#94a3b8', fontSize: 11 }, axisTick: { show: false } },
    yAxis: { type: 'value', minInterval: 1, axisLabel: { color: '#94a3b8', fontSize: 11 }, splitLine: { lineStyle: { color: '#f1f5f9' } } },
    series: [{
      name: '工单数', type: 'line', smooth: true, symbol: 'circle', symbolSize: 5, data: counts,
      areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(37,99,235,0.08)' }, { offset: 1, color: 'rgba(37,99,235,0)' }]) },
      lineStyle: { color: '#2563eb', width: 2 }, itemStyle: { color: '#2563eb', borderWidth: 2, borderColor: '#fff' }
    }]
  })
}

function renderPie() {
  if (!pieChart) pieChart = echarts.init(pieRef.value)
  const groups = {}
  myOrders.value.forEach(o => { groups[o.status] = (groups[o.status] || 0) + 1 })
  const data = Object.keys(groups).map(k => ({ name: statusLabel(k), value: groups[k] }))
  pieChart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c}单 ({d}%)', backgroundColor: '#fff', borderColor: '#e2e8f0', textStyle: { color: '#1e293b', fontSize: 12 } },
    legend: { bottom: 0, textStyle: { fontSize: 11, color: '#64748b' }, icon: 'circle', itemWidth: 8, itemHeight: 8 },
    color: ['#2563eb', '#d97706', '#059669', '#dc2626', '#94a3b8'],
    series: [{
      type: 'pie', radius: ['45%', '70%'], center: ['50%', '42%'],
      itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
      label: { show: false }, emphasis: { label: { show: true, fontSize: 12, fontWeight: 600 } },
      data: data.length ? data : [{ name: '暂无数据', value: 0 }]
    }]
  })
}

function handleResize() { trendChart?.resize(); pieChart?.resize() }
onMounted(() => { fetchData(); window.addEventListener('resize', handleResize) })
onUnmounted(() => { trendChart?.dispose(); pieChart?.dispose(); window.removeEventListener('resize', handleResize) })
</script>

<style scoped lang="scss">
@use './dashboard-common.scss';
</style>
