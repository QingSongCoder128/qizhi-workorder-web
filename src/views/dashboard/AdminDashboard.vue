<template>
  <div class="admin-dash page-container">
    <!-- 顶部操作栏 -->
    <div class="dash-header">
      <div>
        <h2 class="page-title">管理工作台</h2>
        <p class="page-subtitle">全局工单运营概览，{{ userStore.realName || userStore.username }}</p>
      </div>
      <div class="header-actions">
        <el-select v-model="deptFilter" placeholder="全部部门" clearable style="width: 130px">
          <el-option v-for="d in deptOptions" :key="d.deptCode" :label="d.deptName" :value="d.deptCode" />
        </el-select>
        <el-select v-model="typeFilter" placeholder="全部类型" clearable style="width: 130px">
          <el-option v-for="(v, k) in ORDER_TYPE" :key="k" :label="v.label" :value="k" />
        </el-select>
        <el-select v-model="dateRange" style="width: 110px">
          <el-option label="近7天" value="7" />
          <el-option label="近30天" value="30" />
          <el-option label="全部" value="all" />
        </el-select>
        <el-button type="primary" :icon="Download" :loading="exporting" @click="handleExport">导出报表</el-button>
      </div>
    </div>

    <!-- 指标 -->
    <div v-loading="dataLoading" class="stat-grid">
      <div v-for="card in statCards" :key="card.key" class="stat-card" @click="card.route && $router.push(card.route)">
        <div class="stat-icon" :style="{ background: card.bg, color: card.color }">
          <el-icon :size="17"><component :is="card.icon" /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ stats[card.key] ?? 0 }}</span>
          <span class="stat-label">{{ card.label }}</span>
        </div>
      </div>
    </div>

    <!-- 平均审批时长 -->
    <div class="avg-bar">
      <el-icon :size="15"><Timer /></el-icon>
      <span>平均审批时长</span>
      <b>{{ formatAvgTime(stats.avgApproveMinutes) }}</b>
    </div>

    <!-- 图表区域 -->
    <el-row :gutter="16" class="row-gap">
      <el-col :span="15">
        <div class="panel">
          <div class="panel-header">
            <span class="panel-title">工单趋势</span>
            <el-radio-group v-model="trendType" size="small" @change="updateLineChart">
              <el-radio-button value="create">新增</el-radio-button>
              <el-radio-button value="complete">完结</el-radio-button>
            </el-radio-group>
          </div>
          <div ref="lineChartRef" class="chart-body"></div>
        </div>
      </el-col>
      <el-col :span="9">
        <div class="panel">
          <div class="panel-header"><span class="panel-title">部门工单排行</span></div>
          <div class="dept-rank">
            <div v-for="(d, i) in deptList" :key="d.name" class="dept-item">
              <span class="dept-idx">{{ i + 1 }}</span>
              <span class="dept-name">{{ d.name }}</span>
              <div class="dept-bar-wrap">
                <div class="dept-bar" :style="{ width: deptPercent(d.value) + '%' }"></div>
              </div>
              <span class="dept-count">{{ d.value }}</span>
            </div>
            <el-empty v-if="!deptList.length" description="暂无数据" :image-size="40" />
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 状态占比 + 快捷入口 -->
    <el-row :gutter="16">
      <el-col :span="15">
        <div class="panel">
          <div class="panel-header"><span class="panel-title">状态占比</span></div>
          <div class="status-bar-wrap">
            <div class="status-bar">
              <div
                v-for="s in statusSegments" :key="s.label" class="status-segment"
                :style="{ width: s.percent + '%', background: s.color }"
                :title="`${s.label}: ${s.count}单 (${s.percent}%)`"
              ></div>
            </div>
            <div class="status-legend">
              <span v-for="s in statusSegments" :key="s.label" class="legend-item">
                <i :style="{ background: s.color }"></i>{{ s.label }}
                <b>{{ s.count }}</b>
              </span>
            </div>
          </div>
        </div>
      </el-col>
      <el-col :span="9">
        <div class="panel">
          <div class="panel-header"><span class="panel-title">快捷入口</span></div>
          <div class="quick-links">
            <div class="quick-item" @click="$router.push('/workorder/all')">
              <div class="quick-icon" style="background:#eff6ff;color:#2563eb"><el-icon :size="16"><Document /></el-icon></div>
              <span>全部工单</span>
            </div>
            <div class="quick-item" @click="$router.push('/system/user')">
              <div class="quick-icon" style="background:#ecfdf5;color:#059669"><el-icon :size="16"><User /></el-icon></div>
              <span>用户管理</span>
            </div>
            <div class="quick-item" @click="$router.push('/approve/template')">
              <div class="quick-icon" style="background:#fffbeb;color:#d97706"><el-icon :size="16"><Stamp /></el-icon></div>
              <span>审批模板</span>
            </div>
            <div class="quick-item" @click="$router.push('/system/dead-letter')">
              <div class="quick-icon" style="background:#fef2f2;color:#dc2626"><el-icon :size="16"><WarningFilled /></el-icon></div>
              <span>死信管理</span>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Download, Timer } from '@element-plus/icons-vue'
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import {
  GridComponent,
  LegendComponent,
  TooltipComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { exportExcel } from '@/api/statistics'

echarts.use([
  LineChart,
  GridComponent,
  LegendComponent,
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
const dateRange = ref('30')
const deptFilter = ref('')
const typeFilter = ref('')
const trendType = ref('create')
const exporting = ref(false)
const dataLoading = ref(false)
const lineChartRef = ref()
let lineChart = null

function formatAvgTime(minutes) {
  if (!minutes || minutes <= 0) return '暂无数据'
  if (minutes < 60) return `${minutes}分钟`
  const h = Math.floor(minutes / 60), m = minutes % 60
  return m > 0 ? `${h}小时${m}分钟` : `${h}小时`
}

const statCards = [
  { key: 'totalCount', label: '工单总量', icon: 'DataAnalysis', bg: '#eff6ff', color: '#2563eb' },
  { key: 'pendingCount', label: '待审批', icon: 'Clock', bg: '#fffbeb', color: '#d97706', route: '/workorder/all' },
  { key: 'approvedCount', label: '审批中', icon: 'Loading', bg: '#eff6ff', color: '#2563eb', route: '/workorder/all' },
  { key: 'completedCount', label: '已完结', icon: 'CircleCheck', bg: '#ecfdf5', color: '#059669' },
  { key: 'rejectedCount', label: '已驳回', icon: 'CircleClose', bg: '#fef2f2', color: '#dc2626' },
  { key: 'timeoutCount', label: '超时工单', icon: 'AlarmClock', bg: '#fef2f2', color: '#dc2626' }
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

// 近7日趋势：新增按创建时间、完结按办结时间（跟随部门/类型筛选）
const trendData = computed(() => {
  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - i)
    const next = new Date(d)
    next.setDate(next.getDate() + 1)
    const label = `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    let count = 0, completedCount = 0
    rawOrders.value.forEach(o => {
      if (deptFilter.value && o.departmentCode !== deptFilter.value) return
      if (typeFilter.value && o.type !== typeFilter.value) return
      const ct = o.createdAt ? new Date(o.createdAt).getTime() : null
      if (ct && ct >= d.getTime() && ct < next.getTime()) count++
      const ft = o.completedAt ? new Date(o.completedAt).getTime() : null
      if (ft && ft >= d.getTime() && ft < next.getTime()) completedCount++
    })
    days.push({ date: label, count, completedCount })
  }
  return days
})

const deptList = computed(() => (stats.value.deptDistribution || []).sort((a, b) => b.value - a.value))
function deptPercent(v) {
  const max = deptList.value[0]?.value || 1
  return Math.max(Math.round(v / max * 100), 4)
}

const statusSegments = computed(() => {
  const total = stats.value.totalCount || 1
  const items = [
    { label: '待审批', count: stats.value.pendingCount || 0, color: '#d97706' },
    { label: '审批中', count: stats.value.approvedCount || 0, color: '#2563eb' },
    { label: '已完结', count: stats.value.completedCount || 0, color: '#059669' },
    { label: '已驳回', count: stats.value.rejectedCount || 0, color: '#dc2626' }
  ]
  return items.map(i => ({ ...i, percent: Math.max(Math.round(i.count / total * 100), i.count > 0 ? 3 : 0) }))
})

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

function updateLineChart() {
  if (!lineChartRef.value) return
  if (!lineChart) lineChart = echarts.init(lineChartRef.value)
  const data = trendData.value || []
  const values = trendType.value === 'create' ? data.map(d => d.count) : data.map(d => d.completedCount || 0)
  const color = trendType.value === 'create' ? '#2563eb' : '#059669'
  lineChart.setOption({
    tooltip: { trigger: 'axis', backgroundColor: '#fff', borderColor: '#e2e8f0', textStyle: { color: '#1e293b', fontSize: 12 } },
    grid: { left: 36, right: 16, top: 16, bottom: 28 },
    xAxis: { type: 'category', boundaryGap: false, data: data.map(d => d.date), axisLine: { lineStyle: { color: '#e2e8f0' } }, axisLabel: { color: '#94a3b8', fontSize: 11 }, axisTick: { show: false } },
    yAxis: { type: 'value', minInterval: 1, axisLine: { show: false }, axisLabel: { color: '#94a3b8', fontSize: 11 }, splitLine: { lineStyle: { color: '#f1f5f9' } } },
    series: [{
      name: trendType.value === 'create' ? '新增工单' : '完结工单', type: 'line', smooth: true, symbol: 'circle', symbolSize: 5, data: values,
      areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: color + '14' }, { offset: 1, color: color + '02' }]) },
      lineStyle: { color, width: 2 }, itemStyle: { color, borderWidth: 2, borderColor: '#fff' }
    }]
  })
}

function handleResize() { lineChart?.resize() }
watch(trendData, () => nextTick(() => updateLineChart()))
onMounted(() => { fetchData(); window.addEventListener('resize', handleResize) })
onUnmounted(() => { lineChart?.dispose(); window.removeEventListener('resize', handleResize) })
</script>

<style scoped lang="scss">
@use './dashboard-common.scss';

.admin-dash {
  .stat-grid { grid-template-columns: repeat(6, 1fr); }
  @media (max-width: 1400px) { .stat-grid { grid-template-columns: repeat(3, 1fr); } }
  .header-actions { display: flex; gap: 10px; align-items: center; }
}

.avg-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: $brand-light;
  border: 1px solid $brand-subtle;
  border-radius: $radius-md;
  margin-bottom: $page-gap;
  font-size: $text-base;
  color: $text-secondary;

  .el-icon { color: $brand; }
  b { color: $brand; font-size: $text-md; font-weight: 600; }
}

// 部门排行
.dept-rank {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 4px;
}

.dept-item {
  display: flex;
  align-items: center;
  gap: 10px;

  .dept-idx {
    width: 18px;
    height: 18px;
    border-radius: $radius-xs;
    background: $bg-hover;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: 600;
    color: $text-muted;
    flex-shrink: 0;
  }

  .dept-name {
    width: 64px;
    font-size: $text-base;
    color: $text-primary;
    flex-shrink: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .dept-bar-wrap {
    flex: 1;
    height: 6px;
    background: $gray-200;
    border-radius: $radius-full;
    overflow: hidden;
  }

  .dept-bar {
    height: 100%;
    background: $brand;
    border-radius: $radius-full;
    transition: width $duration-slow $ease-out;
  }

  .dept-count {
    width: 28px;
    text-align: right;
    font-size: $text-base;
    font-weight: 600;
    color: $text-primary;
    font-variant-numeric: tabular-nums;
  }
}

// 状态条
.status-bar-wrap { padding: 8px 0; }
.status-bar { display: flex; height: 10px; border-radius: $radius-full; overflow: hidden; background: $gray-200; }
.status-segment { transition: width $duration-slow $ease-out; min-width: 2px; }
.status-legend { display: flex; gap: 16px; margin-top: 12px; flex-wrap: wrap; }
.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: $text-base;
  color: $text-secondary;
  i { width: 8px; height: 8px; border-radius: 2px; display: inline-block; }
  b { font-weight: 600; color: $text-primary; }
}

// 快捷入口
.quick-links { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.quick-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: $radius-md;
  border: 1px solid $border-light;
  cursor: pointer;
  transition: all $duration-fast;
  font-size: $text-base;
  font-weight: 500;
  color: $text-primary;

  &:hover { border-color: $gray-300; background: $bg-hover; }

  .quick-icon {
    width: 32px;
    height: 32px;
    border-radius: $radius-md;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
}
</style>
