<template>
  <div class="error-page">
    <div class="error-content">
      <div class="error-code">403</div>
      <div class="error-icon">
        <el-icon :size="64"><Lock /></el-icon>
      </div>
      <h2>无权访问</h2>
      <p>抱歉，您没有权限访问该页面，请联系系统管理员</p>
      <div class="error-actions">
        <el-button type="primary" @click="$router.push('/dashboard')">返回工作台</el-button>
        <el-button @click="$router.back()">返回上一页</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Lock } from '@element-plus/icons-vue'
</script>

<style lang="scss" scoped>
.error-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $bg-page;
}

.error-content {
  text-align: center;
  padding: $space-10;

  .error-code {
    font-size: 120px;
    font-weight: 800;
    color: $gray-200;
    line-height: 1;
    letter-spacing: -4px;
  }

  .error-icon {
    margin: -20px 0 $space-5;
    color: $warning;
  }

  h2 {
    font-size: $text-xl;
    font-weight: 600;
    color: $text-primary;
    margin-bottom: $space-3;
  }

  p {
    font-size: $text-md;
    color: $text-secondary;
    margin-bottom: $space-8;
  }

  .error-actions {
    display: flex;
    gap: $space-3;
    justify-content: center;
  }
}
</style>
