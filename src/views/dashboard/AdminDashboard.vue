<template>
  <div class="admin-dash">
    <!-- 顶部操作栏 -->
    <div class="dash-header">
      <div>
        <h2 class="page-title"><el-icon><DataAnalysis /></el-icon> 管理工作台</h2>
        <p class="page-subtitle">全局工单运营概览，{{ userStore.realName || userStore.username }}</p>
      </div>
      <div class="header-actions">
        <el-select v-model="deptFilter" placeholder="全部部门" clearable style="width: 130px" @change="fetchData">
          <el-option v-for="(v, k) in DEPT_MAP" :key="k" :label="v" :value="k" />
        </el-select>
        <el-select v-model="dateRange" style="width: 120px" @change="fetchData">
          <el-option label="近7天" value="7" />
          <el-option label="近30天" value="30" />
          <el-option label="全部" value="all" />
        </el-select>
        <el-button type="primary" :icon="Download" @click="handleExport" :loading="exporting">导出报表</el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stat-grid" v-loading="dataLoading">
      <div class="stat-card" v-for="card in statCards" :key="card.key" @click="card.route && $router.push(card.route)">
        <div class="stat-icon" :style="{ background: card.gradient }">
          <el-icon :size="20" color="#fff"><component :is="card.icon" /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ stats[card.key] ?? 0 }}</span>
          <span class="stat-label">{{ card.label }}</span>
        </div>
      </div>
    </div>

    <!-- 平均审批时长 -->
    <div class="avg-bar">
      <el-icon><Timer /></el-icon>
      <span>平均审批时长：</span>
      <b>{{ formatAvgTime(stats.avgApproveMinutes) }}</b>
    </div>

    <!-- 图表区域 -->
    <el-row :gutter="20" class="row-gap">
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
          <div ref="pieChartRef" class="chart-body"></div>
        </div>
      </el-col>
    </el-row>

    <!-- 状态占比 + 快捷入口 -->
    <el-row :gutter="20">
      <el-col :span="15">
        <div class="panel">
          <div class="panel-header"><span class="panel-title">状态占比</span></div>
          <div class="status-bar-wrap">
            <div class="status-bar">
              <div v-for="s in statusSegments" :key="s.label" class="status-segment"
                   :style="{ width: s.percent + '%', background: s.color }"
                   :title="`${s.label}: ${s.count}单 (${s.percent}%)`"></div>
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
              <div class="quick-icon" style="background: linear-gradient(135deg,#4f6ef7,#7c3aed)"><el-icon :size="18" color="#fff"><Document /></el-icon></div>
              <span>全部工单</span>
            </div>
            <div class="quick-item" @click="$router.push('/system/user')">
              <div class="quick-icon" style="background: linear-gradient(135deg,#10b981,#059669)"><el-icon :size="18" color="#fff"><User /></el-icon></div>
              <span>用户管理</span>
            </div>
            <div class="quick-item" @click="$router.push('/approve/template')">
              <div class="quick-icon" style="background: linear-gradient(135deg,#f59e0b,#f97316)"><el-icon :size="18" color="#fff"><Stamp /></el-icon></div>
              <span>审批模板</span>
            </div>
            <div class="quick-item" @click="$router.push('/system/dead-letter')">
              <div class="quick-icon" style="background: linear-gradient(135deg,#ef4444,#dc2626)"><el-icon :size="18" color="#fff"><Warning /></el-icon></div>
              <span>死信管理</span>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Download, Timer, DataAnalysis } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { getDashboard, exportExcel } from '@/api/statistics'
import { useUserStore } from '@/store/user'
import { DEPT_MAP } from '@/utils/constants'

const userStore = useUserStore()
const stats = ref({})
const dateRange = ref('30')
const deptFilter = ref('')
const trendType = ref('create')
const exporting = ref(false)
const dataLoading = ref(false)
const pieChartRef = ref()
const lineChartRef = ref()
let pieChart = null
let lineChart = null
let trendData = []

function formatAvgTime(minutes) {
  if (!minutes || minutes <= 0) return '暂无数据'
  if (minutes < 60) return `${minutes}分钟`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}小时${m}分钟` : `${h}小时`
}

const statCards = [
  { key: 'totalCount', label: '工单总量', icon: 'DataAnalysis', gradient: 'linear-gradient(135deg,#4f6ef7,#7c3aed)' },
  { key: 'pendingCount', label: '待审批', icon: 'Clock', gradient: 'linear-gradient(135deg,#f59e0b,#f97316)', route: '/workorder/all' },
  { key: 'approvedCount', label: '审批中', icon: 'Loading', gradient: 'linear-gradient(135deg,#3b82f6,#2563eb)', route: '/workorder/all' },
  { key: 'completedCount', label: '已完结', icon: 'CircleCheck', gradient: 'linear-gradient(135deg,#10b981,#059669)' },
  { key: 'rejectedCount', label: '已驳回', icon: 'CircleClose', gradient: 'linear-gradient(135deg,#ef4444,#dc2626)' },
  { key: 'timeoutCount', label: '超时工单', icon: 'AlarmClock', gradient: 'linear-gradient(135deg,#f43f5e,#e11d48)' }
]

const statusSegments = computed(() => {
  const total = stats.value.totalCount || 1
  const items = [
    { label: '待审批', count: stats.value.pendingCount || 0, color: '#f59e0b' },
    { label: '审批中', count: stats.value.approvedCount || 0, color: '#3b82f6' },
    { label: '已完结', count: stats.value.completedCount || 0, color: '#10b981' },
    { label: '已驳回', count: stats.value.rejectedCount || 0, color: '#ef4444' }
  ]
  return items.map(i => ({ ...i, percent: Math.max(Math.round(i.count / total * 100), i.count > 0 ? 3 : 0) }))
})

function buildParams() {
  const params = {}
  if (dateRange.value !== 'all') {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - parseInt(dateRange.value))
    params.startDate = start.toISOString().slice(0, 10)
    params.endDate = end.toISOString().slice(0, 10)
  }
  if (deptFilter.value) params.deptCode = deptFilter.value
  return params
}

async function fetchData() {
  dataLoading.value = true
  try {
    const res = await getDashboard(buildParams())
    stats.value = res.data || {}
    trendData = stats.value.trend || []
    initPieChart(stats.value.deptDistribution || [])
    updateLineChart()
  } catch {
    initPieChart([])
    updateLineChart()
  } finally {
    dataLoading.value = false
  }
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
  } catch {
    ElMessage.error('导出失败')
  } finally {
    exporting.value = false
  }
}

function updateLineChart() {
  if (!lineChart) lineChart = echarts.init(lineChartRef.value)
  const data = trendData || []
  const values = trendType.value === 'create' ? data.map(d => d.count) : data.map(d => d.completedCount || 0)
  const color = trendType.value === 'create' ? '#4f6ef7' : '#10b981'
  lineChart.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'cross', crossStyle: { color: '#999' } } },
    grid: { left: 40, right: 20, top: 20, bottom: 30 },
    xAxis: { type: 'category', boundaryGap: false, data: data.map(d => d.date), axisLine: { lineStyle: { color: '#e2e8f0' } }, axisLabel: { color: '#64748b', fontSize: 11 } },
    yAxis: { type: 'value', minInterval: 1, axisLine: { show: false }, axisLabel: { color: '#94a3b8' }, splitLine: { lineStyle: { color: '#f1f5f9' } } },
    series: [{
      name: trendType.value === 'create' ? '新增工单' : '完结工单', type: 'line', smooth: true, symbol: 'circle', symbolSize: 6, data: values,
      areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: color + '30' }, { offset: 1, color: color + '05' }]) },
      lineStyle: { color, width: 2.5 }, itemStyle: { color, borderWidth: 2, borderColor: '#fff' }
    }]
  })
}

function initPieChart(data) {
  if (!pieChart) pieChart = echarts.init(pieChartRef.value)
  pieChart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c}单 ({d}%)' },
    legend: { bottom: 0, textStyle: { fontSize: 11, color: '#64748b' } },
    color: ['#4f6ef7', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#0ea5e9'],
    series: [{
      type: 'pie', radius: ['42%', '68%'], center: ['50%', '42%'], avoidLabelOverlap: true,
      itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 3 },
      label: { show: false }, emphasis: { label: { show: true, fontSize: 13, fontWeight: 600 } },
      data: data.length ? data.map(d => ({ name: d.name, value: d.value })) : [{ name: '暂无数据', value: 0 }]
    }]
  })
}

function handleResize() { pieChart?.resize(); lineChart?.resize() }
onMounted(() => { fetchData(); window.addEventListener('resize', handleResize) })
onUnmounted(() => { pieChart?.dispose(); lineChart?.dispose(); window.removeEventListener('resize', handleResize) })
</script>

<style scoped lang="scss">
@use './dashboard-common.scss';

.admin-dash {
  .stat-grid { grid-template-columns: repeat(6, 1fr); }
  @media (max-width: 1400px) { .stat-grid { grid-template-columns: repeat(3, 1fr); } }

  .header-actions { display: flex; gap: 12px; align-items: center; }
}

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

.status-bar-wrap { padding: 10px 0; }

.status-bar { display: flex; height: 14px; border-radius: 7px; overflow: hidden; background: #f1f5f9; }
.status-segment { transition: width 0.6s ease; min-width: 2px; }

.status-legend { display: flex; gap: 20px; margin-top: 14px; flex-wrap: wrap; }

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: $text-secondary;

  i { width: 10px; height: 10px; border-radius: 3px; display: inline-block; }
  b { font-weight: 600; color: $text-primary; }
}

.quick-links { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

.quick-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-radius: $border-radius-sm;
  background: #f8fafc;
  cursor: pointer;
  transition: all $transition-fast;
  font-size: 13px;
  font-weight: 500;
  color: $text-primary;

  &:hover { background: $primary-light; transform: translateX(4px); }

  .quick-icon {
    width: 34px;
    height: 34px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
}
</style>
