<template>
  <div class="admin-dash">
    <!-- 页面标题行 -->
    <section class="page-heading-row">
      <div>
        <h1>管理工作台</h1>
        <p>全局工单运营概览</p>
      </div>
      <div class="toolbar">
        <el-select v-model="deptFilter" placeholder="全部部门" clearable class="filter-select">
          <el-option v-for="d in deptOptions" :key="d.deptCode" :label="d.deptName" :value="d.deptCode" />
        </el-select>
        <el-select v-model="typeFilter" placeholder="全部类型" clearable class="filter-select">
          <el-option v-for="(v, k) in ORDER_TYPE" :key="k" :label="v.label" :value="k" />
        </el-select>
        <el-select v-model="dateRange" class="filter-select range-select">
          <el-option label="近7天" value="7" />
          <el-option label="近30天" value="30" />
          <el-option label="全部" value="all" />
        </el-select>
        <el-button type="primary" class="export-button" :loading="exporting" @click="handleExport">
          <el-icon><Download /></el-icon>
          导出报表
        </el-button>
      </div>
    </section>

    <!-- 指标卡片（迷你趋势线 + 周同比） -->
    <section v-loading="dataLoading" class="metrics-grid">
      <article
        v-for="card in statCards" :key="card.key" class="metric-card"
        @click="card.route && $router.push(card.route)"
      >
        <span class="metric-icon" :class="card.tone">
          <el-icon><component :is="card.icon" /></el-icon>
        </span>
        <div class="metric-copy">
          <strong>{{ stats[card.key] ?? 0 }}</strong>
          <span class="metric-label">{{ card.label }}</span>
          <span class="metric-change" :class="changeClass(card.key)">
            <i>{{ changeArrow(card.key) }}</i>较上周 {{ Math.abs(weekChange(card.key)) }}%
          </span>
        </div>
        <svg class="metric-spark" viewBox="0 0 64 26" preserveAspectRatio="none">
          <defs>
            <linearGradient :id="'sg-' + card.key" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" :stop-color="sparkColor(card.tone)" stop-opacity="0.28" />
              <stop offset="100%" :stop-color="sparkColor(card.tone)" stop-opacity="0" />
            </linearGradient>
          </defs>
          <path :d="sparkArea(card.key)" :fill="`url(#sg-${card.key})`" />
          <path :d="sparkPath(card.key)" fill="none" :stroke="sparkColor(card.tone)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" />
        </svg>
      </article>
    </section>

    <!-- 图表区域 -->
    <section class="dashboard-grid">
      <!-- 工单趋势分析（双线） -->
      <article class="panel-card trend-card">
        <div class="panel-header">
          <h2>工单趋势分析</h2>
        </div>
        <div ref="lineChartRef" class="trend-chart"></div>
      </article>

      <!-- 工单状态分布（环形图） -->
      <article class="panel-card pie-card">
        <div class="panel-header">
          <h2>工单状态分布</h2>
        </div>
        <div ref="pieChartRef" class="pie-chart"></div>
      </article>

      <!-- 部门工单排行 -->
      <article class="panel-card ranking-card">
        <div class="panel-header">
          <h2>部门工单排行</h2>
          <span class="panel-sub">TOP {{ deptList.length }}</span>
        </div>
        <div class="rank-list">
          <div v-for="(d, i) in deptList" :key="d.name" class="rank-row" :class="'lv' + (i + 1)">
            <span class="rank-index">{{ i + 1 }}</span>
            <span class="rank-name">{{ d.name }}</span>
            <div class="rank-track">
              <span class="rank-fill" :style="{ width: deptPercent(d.value) + '%' }"></span>
            </div>
            <strong>{{ d.value }}</strong>
            <span class="rank-share">{{ deptShare(d.value) }}%</span>
          </div>
          <el-empty v-if="!deptList.length" description="暂无数据" :image-size="40" />
        </div>
      </article>

      <!-- 审批效率 -->
      <article class="panel-card efficiency-card">
        <div class="panel-header">
          <h2>审批效率</h2>
        </div>
        <div class="eff-grid">
          <div class="eff-item">
            <div class="eff-ring" :style="{ background: `conic-gradient(#14aa7e ${efficiency.completionRate * 3.6}deg, #e8f0f9 0deg)` }">
              <div class="eff-inner">
                <strong>{{ efficiency.completionRate }}%</strong>
              </div>
            </div>
            <span class="eff-label">办结率</span>
            <span class="eff-delta" :class="efficiency.completionChange >= 0 ? 'up' : 'down'">{{ efficiency.completionChange >= 0 ? '↑' : '↓' }}{{ Math.abs(efficiency.completionChange) }}%</span>
          </div>
          <div class="eff-item">
            <div class="eff-ring" :style="{ background: `conic-gradient(#ff8c0a ${efficiency.timeoutRate * 3.6}deg, #e8f0f9 0deg)` }">
              <div class="eff-inner">
                <strong>{{ efficiency.timeoutRate }}%</strong>
              </div>
            </div>
            <span class="eff-label">超时率</span>
            <span class="eff-delta" :class="efficiency.timeoutChange <= 0 ? 'up' : 'down'">{{ efficiency.timeoutChange >= 0 ? '↑' : '↓' }}{{ Math.abs(efficiency.timeoutChange) }}%</span>
          </div>
          <div class="eff-item">
            <div class="eff-ring time-ring">
              <div class="eff-inner">
                <strong>{{ efficiency.avgHours }}h</strong>
              </div>
            </div>
            <span class="eff-label">平均处理时长</span>
            <span class="eff-delta" :class="efficiency.hoursChange <= 0 ? 'up' : 'down'">{{ efficiency.hoursChange >= 0 ? '↑' : '↓' }}{{ Math.abs(efficiency.hoursChange) }}h</span>
          </div>
        </div>
      </article>

      <!-- 风险预警 -->
      <article class="panel-card risk-card">
        <div class="panel-header">
          <h2>风险预警</h2>
          <span class="risk-total">{{ riskWarnings.urgent + riskWarnings.normal + riskWarnings.low }} 单待处理</span>
        </div>
        <div class="risk-list">
          <div class="risk-item urgent">
            <span class="risk-icon"><el-icon><WarningFilled /></el-icon></span>
            <div class="risk-copy">
              <span>紧急预警</span>
              <p>URGENT 工单未及时处理</p>
            </div>
            <div class="risk-num">
              <strong>{{ riskWarnings.urgent }}</strong>
              <i>单</i>
            </div>
            <span class="risk-bar" :style="{ width: riskPercent('urgent') + '%' }"></span>
          </div>
          <div class="risk-item normal">
            <span class="risk-icon"><el-icon><Warning /></el-icon></span>
            <div class="risk-copy">
              <span>一般风险</span>
              <p>NORMAL 工单等待审批中</p>
            </div>
            <div class="risk-num">
              <strong>{{ riskWarnings.normal }}</strong>
              <i>单</i>
            </div>
            <span class="risk-bar" :style="{ width: riskPercent('normal') + '%' }"></span>
          </div>
          <div class="risk-item low">
            <span class="risk-icon"><el-icon><CircleCheck /></el-icon></span>
            <div class="risk-copy">
              <span>低风险</span>
              <p>LOW 优先级工单正常流转</p>
            </div>
            <div class="risk-num">
              <strong>{{ riskWarnings.low }}</strong>
              <i>单</i>
            </div>
            <span class="risk-bar" :style="{ width: riskPercent('low') + '%' }"></span>
          </div>
        </div>
      </article>

      <!-- 近期动态 -->
      <article class="panel-card activity-card">
        <div class="panel-header">
          <h2>近期动态</h2>
          <span class="panel-extra" @click="$router.push('/workorder/all')">查看全部</span>
        </div>
        <div class="activity-list">
          <div v-for="a in activityFeed" :key="a.id" class="activity-item" @click="$router.push(`/workorder/detail/${a.id}`)">
            <span class="activity-dot" :style="{ background: a.color }"></span>
            <div class="activity-body">
              <p class="activity-title">{{ a.title }}</p>
              <p class="activity-meta">{{ a.orderNo }} · {{ a.submitterName }} · {{ a.dept }}</p>
            </div>
            <div class="activity-side">
              <span class="activity-status" :style="{ color: a.color, background: a.bg }">{{ a.statusLabel }}</span>
              <span class="activity-time">{{ a.time }}</span>
            </div>
          </div>
          <el-empty v-if="!activityFeed.length" description="暂无动态" :image-size="40" />
        </div>
      </article>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Download } from '@element-plus/icons-vue'
import * as echarts from 'echarts/core'
import { LineChart, PieChart } from 'echarts/charts'
import {
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { exportExcel } from '@/api/statistics'

echarts.use([
  LineChart,
  PieChart,
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent,
  CanvasRenderer
])
import { getAllWorkOrders } from '@/api/workOrder'
import { getDeptList } from '@/api/user'
import { useUserStore } from '@/store/user'
import { ORDER_TYPE, AI_CATEGORY } from '@/utils/constants'
import { isOrderTimeout } from '@/utils/time'

const userStore = useUserStore()
const rawOrders = ref([])
const deptOptions = ref([])
const dateRange = ref('all')
const deptFilter = ref('')
const typeFilter = ref('')
const exporting = ref(false)
const dataLoading = ref(false)
const lineChartRef = ref()
const pieChartRef = ref()
let lineChart = null
let pieChart = null

const statCards = [
  { key: 'totalCount', label: '工单总量', icon: 'Tickets', tone: 'blue', route: '/workorder/all' },
  { key: 'pendingCount', label: '待审批', icon: 'AlarmClock', tone: 'orange', route: '/workorder/all?status=PENDING_AI,PENDING_APPROVE' },
  { key: 'approvedCount', label: '审批中', icon: 'Loading', tone: 'indigo', route: '/workorder/all?status=APPROVING' },
  { key: 'completedCount', label: '已完结', icon: 'CircleCheck', tone: 'green', route: '/workorder/all?status=COMPLETED' },
  { key: 'rejectedCount', label: '已驳回', icon: 'CircleClose', tone: 'red', route: '/workorder/all?status=REJECTED' },
  { key: 'timeoutCount', label: '超时工单', icon: 'AlarmClock', tone: 'rose', route: '/workorder/all?status=TIMEOUT' }
]

// 部门名称映射（动态部门优先，AI分类兜底）
const deptNameMap = computed(() => {
  const m = {}
  deptOptions.value.forEach(d => { m[d.deptCode] = d.deptName })
  return m
})
function deptName(code) {
  return deptNameMap.value[code] || AI_CATEGORY[code] || code
}

// 日期范围筛选（按创建时间）
function inDateRange(order) {
  if (dateRange.value === 'all') return true
  if (!order.createdAt) return false
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - parseInt(dateRange.value))
  return new Date(order.createdAt).getTime() >= start.getTime()
}

// 当前筛选条件下的工单（部门 + 类型 + 日期范围）
const filteredOrders = computed(() => rawOrders.value.filter(o => {
  if (deptFilter.value && o.departmentCode !== deptFilter.value) return false
  if (typeFilter.value && o.type !== typeFilter.value) return false
  return inDateRange(o)
}))

// 看板指标：基于筛选后的工单实时聚合（口径与后端 getStats 一致）
const stats = computed(() => {
  const list = filteredOrders.value
  const count = st => list.filter(o => o.status === st).length
  let totalMin = 0, withTime = 0
  list.forEach(o => {
    if (o.status === 'COMPLETED' && o.createdAt && o.completedAt) {
      totalMin += (new Date(o.completedAt) - new Date(o.createdAt)) / 60000
      withTime++
    }
  })
  const deptCounts = {}
  list.forEach(o => { if (o.departmentCode) deptCounts[o.departmentCode] = (deptCounts[o.departmentCode] || 0) + 1 })
  const deptDistribution = Object.entries(deptCounts).map(([code, value]) => ({ name: deptName(code), value }))
  return {
    totalCount: list.length,
    pendingCount: count('PENDING_AI') + count('PENDING_APPROVE'),
    approvedCount: count('APPROVING'),
    completedCount: count('COMPLETED'),
    rejectedCount: count('REJECTED'),
    timeoutCount: list.filter(isOrderTimeout).length,
    avgApproveMinutes: withTime > 0 ? Math.round(totalMin / withTime) : 0,
    deptDistribution
  }
})

// 近7日趋势数据已迁移至 dailyMetrics（14天，后7天用于图表）

const deptList = computed(() => (stats.value.deptDistribution || []).sort((a, b) => b.value - a.value))
function deptPercent(v) {
  const max = deptList.value[0]?.value || 1
  return Math.max(Math.round(v / max * 100), 4)
}

// ─── 状态分布（环形图数据） ───
const statusSegments = computed(() => [
  { label: '待审批', count: stats.value.pendingCount || 0, color: '#ff8c0a' },
  { label: '审批中', count: stats.value.approvedCount || 0, color: '#2f6ff4' },
  { label: '已完结', count: stats.value.completedCount || 0, color: '#14aa7e' },
  { label: '已驳回', count: stats.value.rejectedCount || 0, color: '#ef2f39' }
])

// ─── 审批效率（前端聚合 + 周环比） ───
const efficiency = computed(() => {
  const total = stats.value.totalCount || 0
  const completed = stats.value.completedCount || 0
  const timeout = stats.value.timeoutCount || 0
  const pending = stats.value.pendingCount + stats.value.approvedCount
  const completionRate = total > 0 ? Math.round(completed / total * 100) : 0
  const timeoutRate = pending > 0 ? Math.round(timeout / pending * 100) : 0
  const avgHours = stats.value.avgApproveMinutes > 0 ? (stats.value.avgApproveMinutes / 60).toFixed(1) : '0'

  // 周环比：本周完结率 vs 上周完结率
  const now = Date.now(), week = 7 * 86400000
  const orders = filteredOrders.value
  const thisWeekCreated = orders.filter(o => o.createdAt && now - new Date(o.createdAt).getTime() < week)
  const thisWeekCompleted = thisWeekCreated.filter(o => o.status === 'COMPLETED').length
  const lastWeekCreated = orders.filter(o => o.createdAt && now - new Date(o.createdAt).getTime() >= week && now - new Date(o.createdAt).getTime() < 2 * week)
  const lastWeekCompleted = lastWeekCreated.filter(o => o.status === 'COMPLETED').length
  const curRate = thisWeekCreated.length > 0 ? Math.round(thisWeekCompleted / thisWeekCreated.length * 100) : 0
  const prevRate = lastWeekCreated.length > 0 ? Math.round(lastWeekCompleted / lastWeekCreated.length * 100) : 0
  const completionChange = curRate - prevRate

  // 超时率环比（近似：本周创建的工单超时情况 vs 上周）
  const curTimeout = thisWeekCreated.filter(isOrderTimeout).length
  const prevTimeout = lastWeekCreated.filter(isOrderTimeout).length
  const curTR = thisWeekCreated.length > 0 ? Math.round(curTimeout / thisWeekCreated.length * 100) : 0
  const prevTR = lastWeekCreated.length > 0 ? Math.round(prevTimeout / lastWeekCreated.length * 100) : 0
  const timeoutChange = curTR - prevTR

  // 平均时长环比
  const avgMs = list => {
    const done = list.filter(o => o.status === 'COMPLETED' && o.createdAt && o.completedAt)
    if (!done.length) return 0
    return done.reduce((s, o) => s + (new Date(o.completedAt) - new Date(o.createdAt)), 0) / done.length / 3600000
  }
  const hoursChange = +(avgMs(thisWeekCreated) - avgMs(lastWeekCreated)).toFixed(1)

  return { completionRate, timeoutRate, avgHours, completionChange, timeoutChange, hoursChange }
})

// ─── 风险预警（按优先级聚合未办结工单） ───
const riskWarnings = computed(() => {
  const active = filteredOrders.value.filter(o =>
    ['PENDING_AI', 'PENDING_APPROVE', 'APPROVING'].includes(o.status)
  )
  return {
    urgent: active.filter(o => o.priority === 'URGENT').length,
    normal: active.filter(o => o.priority === 'NORMAL').length,
    low: active.filter(o => o.priority === 'LOW').length
  }
})
function riskPercent(level) {
  const total = riskWarnings.value.urgent + riskWarnings.value.normal + riskWarnings.value.low
  if (!total) return 0
  return Math.round(riskWarnings.value[level] / total * 100)
}

// ─── 近14天逐日指标（支撑迷你趋势线 + 周同比 + 4系列趋势图） ───
const TIMEOUT_MIN = { URGENT: 60, NORMAL: 240, LOW: 720 }
const dailyMetrics = computed(() => {
  const days = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - i)
    const next = new Date(d); next.setDate(next.getDate() + 1)
    const dEnd = next.getTime() - 1
    let created = 0, completed = 0, rejected = 0, approving = 0, timeout = 0, pending = 0, pendingTotal = 0
    for (const o of rawOrders.value) {
      if (deptFilter.value && o.departmentCode !== deptFilter.value) continue
      if (typeFilter.value && o.type !== typeFilter.value) continue
      const ct = o.createdAt ? new Date(o.createdAt).getTime() : null
      const ft = o.completedAt ? new Date(o.completedAt).getTime() : null
      if (ct && ct >= d.getTime() && ct < next.getTime()) created++
      if (ft && ft >= d.getTime() && ft < next.getTime()) completed++
      // 当日活跃（创建了且未完结）
      const activeOnDay = ct && ct < next.getTime() && (!ft || ft >= d.getTime())
      if (activeOnDay) {
        if (['PENDING_AI', 'PENDING_APPROVE', 'APPROVING'].includes(o.status)) pendingTotal++
        if (o.status === 'APPROVING') approving++
        if (o.status === 'REJECTED' && ft && ft >= d.getTime() && ft < next.getTime()) rejected++
        // 当日超时：处于审批流程且已超过优先级阈值
        if (['PENDING_APPROVE', 'APPROVING'].includes(o.status)) {
          const th = TIMEOUT_MIN[o.priority] ?? 240
          if (dEnd - ct > th * 60000) timeout++
        }
      }
    }
    pending = pendingTotal - approving
    days.push({ date: `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`, created, completed, rejected, approving, timeout, pending })
  }
  return days
})

// 迷你趋势线数据映射
const sparkData = computed(() => ({
  totalCount: dailyMetrics.value.map(d => d.created),
  pendingCount: dailyMetrics.value.map(d => d.pending),
  approvedCount: dailyMetrics.value.map(d => d.approving),
  completedCount: dailyMetrics.value.map(d => d.completed),
  rejectedCount: dailyMetrics.value.map(d => d.rejected),
  timeoutCount: dailyMetrics.value.map(d => d.timeout)
}))

function sparkPath(key) {
  const vals = sparkData.value[key] || []
  const max = Math.max(...vals, 1)
  const pts = vals.map((v, i) => `${(i / 13 * 64).toFixed(1)},${(24 - (v / max) * 20).toFixed(1)}`)
  return `M${pts.join(' L')}`
}
function sparkArea(key) {
  const vals = sparkData.value[key] || []
  const max = Math.max(...vals, 1)
  const pts = vals.map((v, i) => `${(i / 13 * 64).toFixed(1)},${(24 - (v / max) * 20).toFixed(1)}`)
  return `M${pts.join(' L')} L64,26 L0,26 Z`
}
const SPARK_COLORS = { blue: '#2869f8', orange: '#ff9417', indigo: '#6366f1', green: '#14aa7e', red: '#ef4444', rose: '#f43f5e' }
function sparkColor(tone) { return SPARK_COLORS[tone] || '#2869f8' }

// 周同比（近7天 vs 前7天）
function weekChange(key) {
  const vals = sparkData.value[key] || []
  const cur = vals.slice(7).reduce((a, b) => a + b, 0)
  const prev = vals.slice(0, 7).reduce((a, b) => a + b, 0)
  if (prev === 0) return cur > 0 ? 100 : 0
  return Math.round((cur - prev) / prev * 100)
}
function changeArrow(key) { return weekChange(key) >= 0 ? '↑' : '↓' }
function changeClass(key) { return weekChange(key) >= 0 ? 'up' : 'down' }

// 部门占比
function deptShare(v) {
  const total = stats.value.totalCount || 1
  return Math.round(v / total * 100)
}

// ─── 近期动态（最新工单 + 相对时间） ───
function relativeTime(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return '刚刚'
  if (min < 60) return `${min}分钟前`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}小时前`
  const d = Math.floor(h / 24)
  if (d === 1) return '昨天'
  if (d < 7) return `${d}天前`
  return dateStr.slice(5, 10)
}
const STATUS_META = {
  PENDING_AI: { label: '待处理', color: '#8b5cf6', bg: '#f3efff' },
  PENDING_APPROVE: { label: '待审批', color: '#f59e0b', bg: '#fef7e8' },
  APPROVING: { label: '审批中', color: '#3b82f6', bg: '#edf4ff' },
  COMPLETED: { label: '已完结', color: '#10b981', bg: '#e9faf4' },
  REJECTED: { label: '已驳回', color: '#ef4444', bg: '#fff0f0' }
}
const activityFeed = computed(() =>
  [...rawOrders.value]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 6)
    .map(o => {
      const meta = STATUS_META[o.status] || { label: o.status, color: '#64748b', bg: '#f1f5f9' }
      return { id: o.id, orderNo: o.orderNo, title: o.title, submitterName: o.submitterName || '未知', dept: deptName(o.departmentCode), time: relativeTime(o.createdAt), ...meta }
    })
)

function buildParams() {
  const params = {}
  if (dateRange.value !== 'all') {
    const end = new Date(), start = new Date()
    start.setDate(start.getDate() - parseInt(dateRange.value))
    params.startDate = start.toISOString().slice(0, 10)
    params.endDate = end.toISOString().slice(0, 10)
  }
  if (deptFilter.value) params.deptCode = deptFilter.value
  if (typeFilter.value) params.type = typeFilter.value
  return params
}

async function fetchData() {
  dataLoading.value = true
  try {
    const [ordersRes, deptRes] = await Promise.all([
      getAllWorkOrders({ page: 1, pageSize: 5000 }),
      getDeptList()
    ])
    rawOrders.value = ordersRes.data?.records || []
    deptOptions.value = deptRes.data || []
  } catch {} finally { dataLoading.value = false }
}

async function handleExport() {
  exporting.value = true
  try {
    const res = await exportExcel(buildParams())
    const blob = new Blob([res], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `工单报表_${new Date().toISOString().slice(0, 10)}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch { ElMessage.error('导出失败') } finally { exporting.value = false }
}

// ─── 趋势图：4系列（提交 / 审批中 / 已完成 / 超时） ───
function updateLineChart() {
  if (!lineChartRef.value) return
  if (!lineChart) lineChart = echarts.init(lineChartRef.value)
  const data = dailyMetrics.value.slice(7) // 近7天
  lineChart.setOption({
    animationDuration: 800,
    animationEasing: 'cubicOut',
    legend: {
      data: ['提交', '审批中', '已完成', '超时'],
      top: 2, right: 8,
      itemWidth: 18, itemHeight: 3, itemGap: 18,
      textStyle: { color: '#5f7190', fontSize: 12 }
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255,255,255,.97)',
      borderColor: '#dbe6fb', borderWidth: 1,
      padding: [10, 14],
      textStyle: { color: '#253653', fontSize: 13 },
      extraCssText: 'box-shadow: 0 10px 28px rgba(31,72,132,.14); border-radius: 10px;'
    },
    grid: { left: 44, right: 20, top: 42, bottom: 34 },
    xAxis: {
      type: 'category', boundaryGap: false,
      data: data.map(d => d.date),
      axisLine: { lineStyle: { color: '#e3ebf7' } },
      axisTick: { show: false },
      axisLabel: { color: '#8799b8', fontSize: 12, margin: 12 }
    },
    yAxis: {
      type: 'value', minInterval: 1,
      axisLine: { show: false }, axisTick: { show: false },
      axisLabel: { color: '#8799b8', fontSize: 12 },
      splitLine: { lineStyle: { color: '#edf2fa', width: 1 } }
    },
    series: [
      { name: '提交', type: 'line', smooth: 0.45, symbol: 'circle', symbolSize: 6, data: data.map(d => d.created),
        lineStyle: { color: '#2869f8', width: 2.5 }, itemStyle: { color: '#2869f8', borderColor: '#fff', borderWidth: 2 },
        areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(40,105,248,.16)' }, { offset: 1, color: 'rgba(40,105,248,0)' }]) } },
      { name: '审批中', type: 'line', smooth: 0.45, symbol: 'circle', symbolSize: 6, data: data.map(d => d.approving),
        lineStyle: { color: '#8b5cf6', width: 2.5 }, itemStyle: { color: '#8b5cf6', borderColor: '#fff', borderWidth: 2 },
        areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(139,92,246,.12)' }, { offset: 1, color: 'rgba(139,92,246,0)' }]) } },
      { name: '已完成', type: 'line', smooth: 0.45, symbol: 'circle', symbolSize: 6, data: data.map(d => d.completed),
        lineStyle: { color: '#14aa7e', width: 2.5 }, itemStyle: { color: '#14aa7e', borderColor: '#fff', borderWidth: 2 },
        areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(20,170,126,.14)' }, { offset: 1, color: 'rgba(20,170,126,0)' }]) } },
      { name: '超时', type: 'line', smooth: 0.45, symbol: 'circle', symbolSize: 6, data: data.map(d => d.timeout),
        lineStyle: { color: '#f43f5e', width: 2, type: 'dashed' }, itemStyle: { color: '#f43f5e', borderColor: '#fff', borderWidth: 2 },
        areaStyle: null }
    ]
  }, true)
}

// ─── 状态分布环形图 ───
function updatePieChart() {
  if (!pieChartRef.value) return
  if (!pieChart) pieChart = echarts.init(pieChartRef.value)
  const segments = statusSegments.value
  const total = stats.value.totalCount || 0
  pieChart.setOption({
    animationDuration: 900,
    animationEasing: 'cubicOut',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255,255,255,.97)',
      borderColor: '#dbe6fb',
      borderWidth: 1,
      padding: [8, 12],
      textStyle: { color: '#253653', fontSize: 12 },
      extraCssText: 'box-shadow: 0 8px 24px rgba(31,72,132,.12); border-radius: 8px;',
      formatter: p => `${p.marker} ${p.name} <b>${p.value}</b> 单（${p.percent}%）`
    },
    legend: {
      orient: 'vertical',
      right: 12,
      top: 'center',
      itemWidth: 10,
      itemHeight: 10,
      itemGap: 14,
      icon: 'circle',
      textStyle: { color: '#5f7190', fontSize: 12 },
      formatter: name => {
        const seg = segments.find(s => s.label === name)
        const pct = total > 0 ? Math.round((seg?.count ?? 0) / total * 100) : 0
        return `${name}  ${seg?.count ?? 0}  ${pct}%`
      }
    },
    title: {
      text: String(total),
      subtext: '工单总量',
      left: '34%',
      top: '38%',
      textAlign: 'center',
      textStyle: { fontSize: 26, fontWeight: 700, color: '#10213d' },
      subtextStyle: { fontSize: 12, color: '#8799b8', lineHeight: 20 }
    },
    series: [{
      type: 'pie',
      radius: ['52%', '74%'],
      center: ['36%', '50%'],
      avoidLabelOverlap: false,
      label: { show: false },
      labelLine: { show: false },
      itemStyle: { borderColor: '#fff', borderWidth: 3, borderRadius: 6 },
      emphasis: {
        scaleSize: 6,
        itemStyle: { shadowBlur: 16, shadowColor: 'rgba(31,72,132,.18)' }
      },
      data: segments.map(s => ({ name: s.label, value: s.count, itemStyle: { color: s.color } }))
    }]
  }, true)
}

function handleResize() {
  lineChart?.resize()
  pieChart?.resize()
}
watch([dailyMetrics, statusSegments], () => nextTick(() => { updateLineChart(); updatePieChart() }))
onMounted(() => { fetchData(); window.addEventListener('resize', handleResize) })
onUnmounted(() => {
  lineChart?.dispose()
  pieChart?.dispose()
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped lang="scss">
.admin-dash {
  padding: 28px 40px 38px;
  max-width: 1460px;
}

// ─── 页面标题行 ───
.page-heading-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 28px;

  h1 {
    margin: 0;
    font-size: 27px;
    line-height: 1.2;
    letter-spacing: -0.7px;
    color: #10213d;
    font-weight: 700;
  }

  p {
    margin: 7px 0 0;
    color: #7788a7;
    font-size: 14px;
  }
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
}

.filter-select {
  width: 139px;

  &.range-select { width: 128px; }

  :deep(.el-select__wrapper) {
    min-height: 36px;
    padding: 0 13px;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 7px;
    box-shadow: 0 0 0 1px #dce5f1 inset !important;
  }

  :deep(.el-select__selected-item) {
    color: #71829f;
    font-size: 13px;
  }
}

.export-button {
  min-width: 119px;
  height: 36px;
  margin-left: 2px;
  font-weight: 600;
  border: 0;
  border-radius: 8px;
  background: linear-gradient(135deg, #2f74ff 0%, #1760ee 100%);
  box-shadow: 0 6px 14px rgba(39, 104, 244, 0.2);

  .el-icon { margin-right: 6px; }
}

// ─── 指标卡片 ───
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 18px;
  margin-top: 27px;
}

.metric-card {
  position: relative;
  min-width: 0;
  height: 118px;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 0 18px;
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid rgba(231, 237, 246, 0.95);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(41, 75, 126, 0.055);
  cursor: pointer;
  overflow: hidden;
  transition: box-shadow 0.2s ease, transform 0.2s ease;

  &:hover {
    box-shadow: 0 12px 28px rgba(41, 75, 126, 0.1);
    transform: translateY(-2px);
  }
}

.metric-icon {
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  display: grid;
  place-items: center;
  border-radius: 11px;

  .el-icon { font-size: 23px; }

  &.blue { color: #2869f8; background: #edf3ff; }
  &.orange { color: #ff9417; background: #fff5e6; }
  &.indigo { color: #2768f4; background: #eef3ff; }
  &.green { color: #14ad80; background: #e9faf4; }
  &.red { color: #ff4b55; background: #fff0f1; }
  &.rose { color: #ff4754; background: #fff0f2; }
}

.metric-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;

  strong {
    color: #10213d;
    font-size: 24px;
    line-height: 1;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  .metric-label {
    color: #8393ae;
    font-size: 12px;
    white-space: nowrap;
  }
}

.metric-change {
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;

  i { font-style: normal; margin-right: 2px; }
  &.up { color: #14aa7e; }
  &.down { color: #ef4444; }
}

.metric-spark {
  position: absolute;
  right: 10px;
  bottom: 8px;
  width: 64px;
  height: 26px;
  opacity: 0.9;
}

// ─── 面板网格（3行布局） ───
.dashboard-grid {
  display: grid;
  grid-template-columns: minmax(560px, 1.6fr) minmax(340px, 1fr);
  grid-template-rows: 320px auto auto;
  gap: 20px;
  margin-top: 20px;
}

.panel-card {
  position: relative;
  min-width: 0;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid #e8edf5;
  border-radius: 13px;
  box-shadow: 0 8px 24px rgba(41, 75, 126, 0.055);
}

.panel-header {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 21px;

  h2 {
    margin: 0;
    color: #142641;
    font-size: 16px;
    font-weight: 700;
  }
}

.panel-extra {
  font-size: 12px;
  color: #2f6ff4;
  cursor: pointer;
  font-weight: 500;

  &:hover { text-decoration: underline; }
}

// ─── 趋势图 ───
.trend-chart {
  width: 100%;
  height: 258px;
}

// ─── 环形图 ───
.pie-chart {
  width: 100%;
  height: 258px;
}

// ─── 部门排行 ───
.ranking-card { padding-bottom: 18px; }

.panel-sub {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: #8799b8;
  background: #f2f6fd;
  padding: 3px 9px;
  border-radius: 5px;
}

.rank-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 2px 18px 0;
}

.rank-row {
  display: grid;
  grid-template-columns: 26px 70px minmax(80px, 1fr) 30px 40px;
  align-items: center;
  gap: 10px;
  color: #253b5e;
  font-size: 13px;
  padding: 7px 8px;
  border-radius: 9px;
  transition: background 0.15s ease;

  &:hover { background: #f6f9fe; }

  strong {
    text-align: right;
    font-size: 14px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    color: #10213d;
  }

  // 每个名次独立配色
  &.lv1 {
    .rank-index { background: linear-gradient(135deg, #fbbf24, #f59e0b); box-shadow: 0 3px 8px rgba(245,158,11,.3); }
    .rank-fill { background: linear-gradient(90deg, #fbbf24, #f59e0b); }
  }
  &.lv2 {
    .rank-index { background: linear-gradient(135deg, #60a5fa, #3b82f6); box-shadow: 0 3px 8px rgba(59,130,246,.28); }
    .rank-fill { background: linear-gradient(90deg, #60a5fa, #3b82f6); }
  }
  &.lv3 {
    .rank-index { background: linear-gradient(135deg, #34d399, #10b981); box-shadow: 0 3px 8px rgba(16,185,129,.28); }
    .rank-fill { background: linear-gradient(90deg, #34d399, #10b981); }
  }
  &.lv4 {
    .rank-index { background: linear-gradient(135deg, #a78bfa, #8b5cf6); box-shadow: 0 3px 8px rgba(139,92,246,.25); }
    .rank-fill { background: linear-gradient(90deg, #a78bfa, #8b5cf6); }
  }
  &.lv5 {
    .rank-index { background: linear-gradient(135deg, #94a3b8, #64748b); box-shadow: 0 3px 8px rgba(100,116,139,.22); }
    .rank-fill { background: linear-gradient(90deg, #94a3b8, #64748b); }
  }
}

.rank-index {
  width: 22px;
  height: 22px;
  display: grid;
  place-items: center;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  border-radius: 7px;
}

.rank-name { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 500; }

.rank-track {
  height: 8px;
  overflow: hidden;
  background: #eef3fa;
  border-radius: 999px;
}

.rank-fill {
  display: block;
  height: 100%;
  border-radius: inherit;
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.rank-share {
  font-size: 11px;
  font-weight: 600;
  color: #8799b8;
  text-align: right;
  background: #f2f6fd;
  padding: 2px 6px;
  border-radius: 4px;
}

// ─── 审批效率 ───
.eff-grid {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 10px 20px 22px;
}

.eff-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.eff-ring {
  width: 86px;
  height: 86px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: conic-gradient(#14aa7e 0deg, #e8f0f9 0deg);
  transition: background 0.6s ease;
}

.eff-inner {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #fff;
  display: grid;
  place-items: center;
  box-shadow: 0 2px 8px rgba(41, 75, 126, 0.06);

  strong {
    font-size: 16px;
    font-weight: 700;
    color: #10213d;
    font-variant-numeric: tabular-nums;
  }
}

.time-ring {
  background: conic-gradient(#2f6ff4 0deg, #7db3ff 120deg, #e8f0f9 120deg) !important;
}

.eff-label {
  font-size: 13px;
  color: #6f809c;
}

.eff-delta {
  font-size: 11px;
  font-weight: 600;

  &.up { color: #14aa7e; }
  &.down { color: #ef4444; }
}

// ─── 风险预警 ───
.risk-total {
  font-size: 11px;
  font-weight: 600;
  color: #dc2626;
  background: #fef2f2;
  border: 1px solid #fecaca;
  padding: 3px 10px;
  border-radius: 999px;
}

.risk-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 4px 18px 18px;
}

.risk-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 14px 16px 16px;
  border-radius: 11px;
  border: 1px solid transparent;
  border-left: 4px solid transparent;
  overflow: hidden;
  transition: transform 0.18s ease, box-shadow 0.18s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 20px rgba(41, 75, 126, 0.09);
  }

  &.urgent {
    background: linear-gradient(135deg, #fff5f5 0%, #fef2f2 100%);
    border-color: #ffe4e4;
    border-left-color: #ef4444;
    .risk-icon { color: #fff; background: linear-gradient(135deg, #f87171, #dc2626); box-shadow: 0 4px 10px rgba(220,38,38,.28); }
    .risk-num strong { color: #dc2626; }
    .risk-bar { background: linear-gradient(90deg, #f87171, #dc2626); }
  }

  &.normal {
    background: linear-gradient(135deg, #fffbeb 0%, #fef9ee 100%);
    border-color: #fde9c8;
    border-left-color: #f59e0b;
    .risk-icon { color: #fff; background: linear-gradient(135deg, #fbbf24, #d97706); box-shadow: 0 4px 10px rgba(217,119,6,.25); }
    .risk-num strong { color: #d97706; }
    .risk-bar { background: linear-gradient(90deg, #fbbf24, #d97706); }
  }

  &.low {
    background: linear-gradient(135deg, #f0fdf7 0%, #ecfdf5 100%);
    border-color: #d1fae5;
    border-left-color: #10b981;
    .risk-icon { color: #fff; background: linear-gradient(135deg, #34d399, #059669); box-shadow: 0 4px 10px rgba(5,150,105,.22); }
    .risk-num strong { color: #059669; }
    .risk-bar { background: linear-gradient(90deg, #34d399, #059669); }
  }
}

.risk-icon {
  width: 38px;
  height: 38px;
  flex: 0 0 38px;
  display: grid;
  place-items: center;
  border-radius: 10px;

  .el-icon { font-size: 19px; }
}

.risk-copy {
  flex: 1;
  min-width: 0;

  span {
    font-size: 14px;
    font-weight: 650;
    color: #1e293b;
  }

  p {
    margin: 3px 0 0;
    font-size: 11px;
    color: #8799b8;
  }
}

.risk-num {
  display: flex;
  align-items: baseline;
  gap: 3px;

  strong {
    font-size: 24px;
    font-weight: 800;
    font-variant-numeric: tabular-nums;
  }

  i {
    font-style: normal;
    font-size: 11px;
    color: #8799b8;
  }
}

.risk-bar {
  position: absolute;
  left: 0;
  bottom: 0;
  height: 3px;
  border-radius: 0 3px 3px 0;
  opacity: 0.55;
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

// ─── 近期动态 ───
.activity-list {
  display: flex;
  flex-direction: column;
  padding: 2px 18px 14px;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 8px;
  border-radius: 9px;
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover { background: #f5f8fd; }

  & + .activity-item { border-top: 1px solid #f0f4fa; }
}

.activity-dot {
  width: 8px;
  height: 8px;
  flex: 0 0 8px;
  border-radius: 50%;
}

.activity-body {
  flex: 1;
  min-width: 0;

  .activity-title {
    margin: 0;
    font-size: 13px;
    font-weight: 550;
    color: #253b5e;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .activity-meta {
    margin: 3px 0 0;
    font-size: 11px;
    color: #8799b8;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.activity-side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  flex-shrink: 0;
}

.activity-status {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 5px;
}

.activity-time {
  font-size: 11px;
  color: #a3b0c2;
}

// ─── 响应式 ───
@media (max-width: 1450px) {
  .admin-dash { padding: 24px 28px 32px; }
  .metrics-grid { gap: 12px; }
  .metric-card { gap: 10px; padding: 0 12px; }
  .metric-icon { width: 38px; height: 38px; flex-basis: 38px; }
  .metric-spark { display: none; }
  .dashboard-grid { grid-template-columns: minmax(480px, 1.5fr) minmax(300px, 1fr); }
}

@media (max-width: 1230px) {
  .metrics-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .metric-spark { display: block; }
  .dashboard-grid {
    grid-template-columns: 1fr;
    grid-template-rows: auto;
  }
}
</style>
