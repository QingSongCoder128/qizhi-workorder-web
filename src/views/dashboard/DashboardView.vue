<template>
  <div class="dashboard">
    <!-- 统计卡片 -->
    <div class="stat-row">
      <div class="stat-card" v-for="card in statCards" :key="card.label" :style="{ background: card.bg }">
        <div class="stat-icon" :style="{ background: card.iconBg }">
          <el-icon :size="22" color="#fff"><component :is="card.icon" /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value" :style="{ color: card.color }">{{ stats[card.key] || 0 }}</div>
          <div class="stat-label">{{ card.label }}</div>
        </div>
      </div>
    </div>

    <!-- 图表区域 -->
    <el-row :gutter="16" style="margin-bottom: 16px;">
      <el-col :span="8">
        <div class="chart-card">
          <div class="chart-title">各部门工单分布</div>
          <div ref="pieChartRef" style="height: 280px;"></div>
        </div>
      </el-col>
      <el-col :span="16">
        <div class="chart-card">
          <div class="chart-title">近7日工单趋势</div>
          <div ref="lineChartRef" style="height: 280px;"></div>
        </div>
      </el-col>
    </el-row>

    <!-- 状态占比条 -->
    <div class="chart-card">
      <div class="chart-title">工单状态占比</div>
      <div class="status-bar">
        <div v-for="s in statusSegments" :key="s.label" class="status-segment"
             :style="{ width: s.percent + '%', background: s.color }"
             :title="`${s.label}: ${s.count}单 (${s.percent}%)`">
        </div>
      </div>
      <div class="status-legend">
        <span v-for="s in statusSegments" :key="s.label" class="legend-item">
          <i :style="{ background: s.color }"></i>{{ s.label }} {{ s.count }}单
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { getDashboard } from '@/api/statistics'

const stats = ref({})
const pieChartRef = ref()
const lineChartRef = ref()
let pieChart = null
let lineChart = null

const statCards = [
  { key: 'totalCount', label: '工单总量', icon: 'DataAnalysis', color: '#303133', bg: 'linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)', iconBg: '#409EFF' },
  { key: 'pendingCount', label: '待审批', icon: 'Clock', color: '#E6A23C', bg: 'linear-gradient(135deg, #fdf6ec 0%, #faecd8 100%)', iconBg: '#E6A23C' },
  { key: 'approvedCount', label: '处理中', icon: 'Loading', color: '#409EFF', bg: 'linear-gradient(135deg, #ecf5ff 0%, #d9ecff 100%)', iconBg: '#409EFF' },
  { key: 'completedCount', label: '已完结', icon: 'CircleCheck', color: '#67C23A', bg: 'linear-gradient(135deg, #f0f9eb 0%, #e1f3d8 100%)', iconBg: '#67C23A' },
  { key: 'rejectedCount', label: '已驳回', icon: 'CircleClose', color: '#F56C6C', bg: 'linear-gradient(135deg, #fef0f0 0%, #fde2e2 100%)', iconBg: '#F56C6C' }
]

const statusSegments = computed(() => {
  const total = stats.value.totalCount || 1
  const items = [
    { label: '待审批', count: stats.value.pendingCount || 0, color: '#E6A23C' },
    { label: '处理中', count: stats.value.approvedCount || 0, color: '#409EFF' },
    { label: '已完结', count: stats.value.completedCount || 0, color: '#67C23A' },
    { label: '已驳回', count: stats.value.rejectedCount || 0, color: '#F56C6C' }
  ]
  return items.map(i => ({ ...i, percent: Math.round(i.count / total * 100) }))
})

onMounted(async () => {
  try {
    const res = await getDashboard()
    stats.value = res.data || {}
    initPieChart(stats.value.deptDistribution || [])
    initLineChart(stats.value.trend || [])
  } catch {
    initPieChart([])
    initLineChart([])
  }
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  pieChart?.dispose()
  lineChart?.dispose()
  window.removeEventListener('resize', handleResize)
})

function handleResize() {
  pieChart?.resize()
  lineChart?.resize()
}

function initPieChart(data) {
  pieChart = echarts.init(pieChartRef.value)
  pieChart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c}单 ({d}%)' },
    legend: { bottom: 0, textStyle: { fontSize: 12 } },
    color: ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399'],
    series: [{
      type: 'pie',
      radius: ['40%', '65%'],
      center: ['50%', '45%'],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
      label: { show: true, formatter: '{b}\n{c}单' },
      data: data.length ? data.map(d => ({ name: d.name, value: d.value })) : [{ name: '暂无数据', value: 0 }]
    }]
  })
}

function initLineChart(data) {
  lineChart = echarts.init(lineChartRef.value)
  lineChart.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
    grid: { left: 40, right: 20, top: 20, bottom: 30 },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: data.map(d => d.date),
      axisLine: { lineStyle: { color: '#dcdfe6' } },
      axisLabel: { color: '#606266' }
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#f0f2f5' } }
    },
    series: [{
      name: '新增工单',
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      data: data.map(d => d.count),
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(64,158,255,0.25)' },
          { offset: 1, color: 'rgba(64,158,255,0.02)' }
        ])
      },
      lineStyle: { color: '#409EFF', width: 2.5 },
      itemStyle: { color: '#409EFF', borderWidth: 2, borderColor: '#fff' }
    }]
  })
}
</script>

<style scoped lang="scss">
.dashboard {
  padding: 0;
}

.stat-row {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.stat-card {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 16px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
  }
}

.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-info {
  .stat-value {
    font-size: 26px;
    font-weight: 700;
    line-height: 1.2;
  }
  .stat-label {
    font-size: 13px;
    color: #909399;
    margin-top: 2px;
  }
}

.chart-card {
  background: #fff;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.chart-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
  padding-left: 10px;
  border-left: 3px solid #409EFF;
}

.status-bar {
  display: flex;
  height: 20px;
  border-radius: 10px;
  overflow: hidden;
  margin: 16px 0 12px;
}

.status-segment {
  transition: width 0.6s ease;
  min-width: 2px;
}

.status-legend {
  display: flex;
  gap: 20px;
  justify-content: center;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #606266;

  i {
    width: 10px;
    height: 10px;
    border-radius: 3px;
    display: inline-block;
  }
}
</style>
