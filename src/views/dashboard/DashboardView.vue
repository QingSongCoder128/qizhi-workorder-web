<template>
  <div class="page-container">
    <!-- 统计卡片 -->
    <el-row :gutter="16" style="margin-bottom: 16px;">
      <el-col :span="6">
        <div class="stat-card"><div class="stat-value">{{ stats.totalCount || 0 }}</div><div class="stat-label">工单总量</div></div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card"><div class="stat-value" style="color: #E6A23C;">{{ stats.pendingCount || 0 }}</div><div class="stat-label">待审批</div></div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card"><div class="stat-value" style="color: #67C23A;">{{ stats.completedCount || 0 }}</div><div class="stat-label">已完结</div></div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card"><div class="stat-value" style="color: #F56C6C;">{{ stats.timeoutCount || 0 }}</div><div class="stat-label">超时工单</div></div>
      </el-col>
    </el-row>

    <!-- 图表 -->
    <el-row :gutter="16">
      <el-col :span="12">
        <div class="page-card">
          <h4>各部门工单分布</h4>
          <div ref="pieChartRef" style="height: 300px;"></div>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="page-card">
          <h4>近7日工单趋势</h4>
          <div ref="lineChartRef" style="height: 300px;"></div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { getDashboard } from '@/api/statistics'

const stats = ref({})
const pieChartRef = ref()
const lineChartRef = ref()
let pieChart = null
let lineChart = null

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
})

onUnmounted(() => {
  pieChart?.dispose()
  lineChart?.dispose()
})

function initPieChart(data) {
  pieChart = echarts.init(pieChartRef.value)
  pieChart.setOption({
    tooltip: { trigger: 'item' },
    series: [{
      type: 'pie',
      radius: '60%',
      data: data.map(d => ({ name: d.name, value: d.value })) || [
        { name: '运维部', value: 30 }, { name: '行政部', value: 20 },
        { name: '人事部', value: 15 }, { name: '技术部', value: 35 }
      ]
    }]
  })
}

function initLineChart(data) {
  lineChart = echarts.init(lineChartRef.value)
  lineChart.setOption({
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: data.map(d => d.date) || ['周一','周二','周三','周四','周五','周六','周日'] },
    yAxis: { type: 'value' },
    series: [{
      name: '新增工单',
      type: 'line',
      smooth: true,
      data: data.map(d => d.count) || [12, 8, 15, 10, 18, 5, 3],
      areaStyle: { color: 'rgba(24,144,255,0.15)' },
      lineStyle: { color: '#1890ff' },
      itemStyle: { color: '#1890ff' }
    }]
  })
}
</script>

<style scoped>
h4 { margin-bottom: 12px; font-size: 15px; }
</style>
