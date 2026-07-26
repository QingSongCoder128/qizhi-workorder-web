<template>
  <main class="error-page">
    <section class="error-card" aria-labelledby="network-error-title">
      <div class="status-code">NETWORK</div>
      <h1 id="network-error-title">暂时无法连接服务</h1>
      <p>网络或后端服务暂不可用。请确认中间件和微服务已启动，然后重新尝试。</p>
      <div class="actions">
        <el-button type="primary" @click="retry">重新连接</el-button>
        <el-button @click="$router.push('/login')">返回登录</el-button>
      </div>
    </section>
  </main>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()
function retry() {
  router.back()
  window.setTimeout(() => window.location.reload(), 50)
}
</script>

<style lang="scss" scoped>
.error-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 32px;
  background: $bg-page;
}

.error-card {
  width: min(520px, 100%);
  padding: 48px;
  text-align: center;
  background: $bg-card;
  border: 1px solid $border-light;
  border-radius: $radius-xl;
  box-shadow: $shadow-md;

  .status-code {
    display: inline-flex;
    padding: 6px 12px;
    margin-bottom: 20px;
    border-radius: $radius-full;
    color: $danger;
    background: $danger-light;
    font: 600 $text-sm $font-mono;
    letter-spacing: 0.08em;
  }

  h1 {
    margin-bottom: 12px;
    font-size: $text-3xl;
    color: $text-primary;
  }

  p {
    margin: 0 auto 28px;
    color: $text-secondary;
    line-height: $leading-relaxed;
  }
}

.actions {
  display: flex;
  justify-content: center;
  gap: 12px;
}
</style>
