<template>
  <div class="error-page">
    <div class="error-content">
      <div class="error-code">404</div>
      <div class="error-icon">
        <el-icon :size="64"><DocumentRemove /></el-icon>
      </div>
      <h2>页面不存在</h2>
      <p>抱歉，您访问的页面不存在或已被移除</p>
      <div class="error-actions">
        <el-button type="primary" @click="$router.push('/dashboard')">返回工作台</el-button>
        <el-button @click="$router.back()">返回上一页</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { DocumentRemove } from '@element-plus/icons-vue'
</script>

<style lang="scss" scoped>
.error-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
}

.error-content {
  text-align: center;
  padding: 40px;

  .error-code {
    font-size: 120px;
    font-weight: 800;
    color: #e2e8f0;
    line-height: 1;
    letter-spacing: -4px;
  }

  .error-icon {
    margin: -20px 0 20px;
    color: #6366f1;
  }

  h2 {
    font-size: 22px;
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 10px;
  }

  p {
    font-size: 14px;
    color: #64748b;
    margin-bottom: 32px;
  }

  .error-actions {
    display: flex;
    gap: 12px;
    justify-content: center;
  }
}
</style>
