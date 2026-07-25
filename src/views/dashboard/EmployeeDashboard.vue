<template>
  <div class="emp-dash">
    <!-- 顶部 -->
    <div class="dash-header">
      <div>
        <h2 class="page-title"><el-icon><User /></el-icon> 我的工作台</h2>
        <p class="page-subtitle">欢迎回来，{{ userStore.realName || userStore.username }}，这是您的工单概览</p>
      </div>
      <el-button type="primary" :icon="Plus" @click="$router.push('/workorder/create')">新建工单</el-button>
    </div>

    <!-- 统计卡片 -->
    <div class="stat-grid" v-loading="loading">
      <div class="stat-card" v-for="c in cards" :key="c.label" @click="c.route && $router.push(c.route)">
        <div class="stat-icon" :style="{ background: c.gradient }">
          <el-icon :size="20" color="#fff"><component :is="c.icon" /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ c.value }}</span>
          <span class="stat-label">{{ c.label }}</span>
        </div>
      </div>
    </div>

    <!-- 趋势 + 状态分布 -->
    <el-row :gutter="20" class="row-gap">
      <el-col :span="14">
        <div class="panel">
          <div class="panel-header"><span class="panel-title">最近 7 天我的工单趋势</span></div>
          <div ref="trendRef" class="chart-body"></div>
        </div>
      </el-col>
      <el-col :span="10">
        <div class="panel">
          <div class="panel-header"><span class="panel-title">我的工单状态分布</span></div>
          <div ref="pieRef" class="chart-body"></div>
        </div>
      </el-col>
    </el-row>

    <!-- 最近工单 + 最新消息 -->
    <el-row :gutter="20">
      <el-col :span="14">
        <div class="panel">
          <div class="panel-header">
            <span class="panel-title">最近工单</span>
            <el-link type="primary" :underline="false" @click="$router.push('/workorder/my')">查看全部</el-link>
          </div>
          <div class="order-list">
            <div class="order-item" v-for="o in recentOrders" :key="o.id" @click="$router.push(`/workorder/detail/${o.id}`)">
              <div class="order-main">
                <span class="order-title">{{ o.title }}</span>
                <el-tag :type="statusTag(o.status)" size="small" effect="light">{{ statusLabel(o.status) }}</el-tag>
              </div>
              <div class="order-sub">
                <span class="order-no">{{ o.orderNo }}</span>
                <el-tag v-if="isTimeout(o)" type="danger" size="small" effect="plain">已超时</el-tag>
                <span class="order-time">{{ formatTime(o.createdAt) }}</span>
              </div>
            </div>
            <el-empty v-if="!recentOrders.length && !loading" description="暂无工单" :image-size="60" />
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
            <div class="msg-item" v-for="m in messages" :key="m.id" :class="{ unread: !m.isRead }">
              <el-icon class="msg-icon" :style="{ color: msgColor(m.msgType) }"><component :is="msgIcon(m.msgType)" /></el-icon>
              <div class="msg-body">
                <span class="msg-title">{{ m.title }}</span>
                <span class="msg-time">{{ formatTime(m.createdAt) }}</span>
              </div>
              <i v-if="!m.isRead" class="unread-dot"></i>
            </div>
            <el-empty v-if="!messages.length && !loading" description="暂无消息" :image-size="60" />
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Plus, User } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { getMyWorkOrders } from '@/api/workOrder'
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

const cards = computed(() => {
  const list = myOrders.value
  const pending = list.filter(o => ['PENDING_AI', 'PENDING_APPROVE', 'APPROVING'].includes(o.status)).length
  return [
    { label: '我的工单总数', value: list.length, icon: 'Document', gradient: 'linear-gradient(135deg,#4f6ef7,#7c3aed)', route: '/workorder/my' },
    { label: '待审批', value: pending, icon: 'Clock', gradient: 'linear-gradient(135deg,#f59e0b,#f97316)', route: '/workorder/my' },
    { label: '已完结', value: list.filter(o => o.status === 'COMPLETED').length, icon: 'CircleCheck', gradient: 'linear-gradient(135deg,#10b981,#059669)', route: '/workorder/my' },
    { label: '已驳回', value: list.filter(o => o.status === 'REJECTED').length, icon: 'CircleClose', gradient: 'linear-gradient(135deg,#ef4444,#dc2626)', route: '/workorder/my' },
    { label: '已超时', value: list.filter(o => isOrderTimeout(o)).length, icon: 'AlarmClock', gradient: 'linear-gradient(135deg,#f43f5e,#e11d48)', route: '/workorder/my' }
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
  const days = []
  const counts = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    days.push(`${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
    counts.push(myOrders.value.filter(o => (o.createdAt || '').startsWith(key)).length)
  }
  trendChart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 20, top: 20, bottom: 30 },
    xAxis: { type: 'category', boundaryGap: false, data: days, axisLine: { lineStyle: { color: '#e2e8f0' } }, axisLabel: { color: '#64748b', fontSize: 11 } },
    yAxis: { type: 'value', minInterval: 1, axisLabel: { color: '#94a3b8' }, splitLine: { lineStyle: { color: '#f1f5f9' } } },
    series: [{
      name: '我的工单', type: 'line', smooth: true, symbol: 'circle', symbolSize: 6, data: counts,
      areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#4f6ef730' }, { offset: 1, color: '#4f6ef705' }]) },
      lineStyle: { color: '#4f6ef7', width: 2.5 }, itemStyle: { color: '#4f6ef7', borderWidth: 2, borderColor: '#fff' }
    }]
  })
}

function renderPie() {
  if (!pieChart) pieChart = echarts.init(pieRef.value)
  const groups = {}
  myOrders.value.forEach(o => { groups[o.status] = (groups[o.status] || 0) + 1 })
  const data = Object.keys(groups).map(k => ({ name: statusLabel(k), value: groups[k] }))
  pieChart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c}单 ({d}%)' },
    legend: { bottom: 0, textStyle: { fontSize: 11, color: '#64748b' } },
    color: ['#f59e0b', '#4f6ef7', '#10b981', '#ef4444', '#94a3b8'],
    series: [{
      type: 'pie', radius: ['42%', '68%'], center: ['50%', '42%'],
      itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 3 },
      label: { show: false }, emphasis: { label: { show: true, fontSize: 13, fontWeight: 600 } },
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
