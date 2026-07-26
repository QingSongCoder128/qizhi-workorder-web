<template>
  <div class="login-page">
    <!-- 左侧品牌区 -->
    <div class="login-brand">
      <div class="brand-content">
        <div class="brand-logo">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="8" height="8" rx="2" fill="currentColor" opacity="0.9" />
            <rect x="13" y="3" width="8" height="8" rx="2" fill="currentColor" opacity="0.5" />
            <rect x="3" y="13" width="8" height="8" rx="2" fill="currentColor" opacity="0.5" />
            <rect x="13" y="13" width="8" height="8" rx="2" fill="currentColor" opacity="0.3" />
          </svg>
          <span>企智协同工单调度系统</span>
        </div>
        <p class="brand-slogan">智能工单管理与审批平台，助力企业高效协同</p>

        <!-- 抽象网格图形 -->
        <div class="brand-visual">
          <div class="grid-pattern">
            <div v-for="i in 16" :key="i" class="grid-cell" :style="{ animationDelay: `${i * 0.15}s` }"></div>
          </div>
          <div class="flow-line"></div>
        </div>

        <div class="brand-features">
          <div class="feature-row">
            <span class="feature-dot"></span>
            <span>AI 智能分类与优先级判定</span>
          </div>
          <div class="feature-row">
            <span class="feature-dot"></span>
            <span>多级审批流 · 转交 · 加签 · 减签</span>
          </div>
          <div class="feature-row">
            <span class="feature-dot"></span>
            <span>超时督办 · 实时消息推送</span>
          </div>
          <div class="feature-row">
            <span class="feature-dot"></span>
            <span>多维度数据统计与报表导出</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧登录区 -->
    <div class="login-main">
      <div class="login-card">
        <div class="login-header">
          <h1>欢迎登录</h1>
          <p>请输入您的账号信息</p>
        </div>

        <el-form ref="formRef" :model="form" :rules="rules" size="large" @submit.prevent="handleLogin">
          <el-form-item prop="username">
            <el-input
              ref="usernameRef"
              v-model="form.username"
              placeholder="请输入账号"
              :prefix-icon="User"
              :disabled="loading"
              @keyup.enter="focusPassword"
            />
          </el-form-item>
          <el-form-item prop="password">
            <el-input
              ref="passwordRef"
              v-model="form.password"
              type="password"
              placeholder="请输入密码"
              :prefix-icon="Lock"
              show-password
              :disabled="loading"
              @keyup.enter="handleLogin"
            />
            <div v-if="capsOn" class="caps-tip">大写锁定已开启</div>
          </el-form-item>
          <el-form-item>
            <el-button
              type="primary"
              native-type="submit"
              :loading="loading"
              class="login-btn"
              @click="handleLogin"
            >
              {{ loading ? '登录中...' : '登 录' }}
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <p class="login-footer">&copy; 2026 企智协同工单调度系统</p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'

const router = useRouter()
const userStore = useUserStore()
const formRef = ref()
const usernameRef = ref()
const passwordRef = ref()
const loading = ref(false)
const capsOn = ref(false)

onMounted(() => { usernameRef.value?.focus() })

function focusPassword() { passwordRef.value?.focus() }

const form = reactive({ username: '', password: '' })
// 使用 change 触发：未在空白输入框上 blur 时弹错，输入时自动清除错误，提交时才整体校验
const rules = {
  username: [{ required: true, message: '请输入账号', trigger: 'change' }],
  password: [{ required: true, message: '请输入密码', trigger: 'change' }]
}

async function handleLogin() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  loading.value = true
  try {
    await userStore.login(form)
    ElMessage.success('登录成功，欢迎回来')
    router.push('/dashboard')
  } catch (err) {
    form.password = ''
    passwordRef.value?.focus()
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.login-page {
  height: 100vh;
  display: flex;
  overflow: hidden;
}

// ─── 左侧品牌区 ───
.login-brand {
  width: 44%;
  min-width: 420px;
  background: $gray-950;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;

  // 微妙的网格背景
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
    background-size: 48px 48px;
  }

  // 品牌色光晕（克制）
  &::after {
    content: '';
    position: absolute;
    width: 400px;
    height: 400px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(37, 99, 235, 0.08) 0%, transparent 70%);
    top: 20%;
    left: 30%;
  }
}

.brand-content {
  position: relative;
  z-index: 1;
  padding: 48px;
  max-width: 400px;
}

.brand-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #fff;
  margin-bottom: 12px;

  svg { color: $brand; flex-shrink: 0; }

  span {
    font-size: 18px;
    font-weight: 600;
    letter-spacing: 0.02em;
  }
}

.brand-slogan {
  color: rgba(255, 255, 255, 0.45);
  font-size: 13px;
  margin-bottom: 48px;
}

// 抽象网格动画
.brand-visual {
  position: relative;
  margin-bottom: 48px;
}

.grid-pattern {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  width: 180px;

  .grid-cell {
    width: 38px;
    height: 38px;
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.02);
    animation: cellPulse 4s ease-in-out infinite;

    &:nth-child(1) { background: rgba(37, 99, 235, 0.2); border-color: rgba(37, 99, 235, 0.3); }
    &:nth-child(6) { background: rgba(37, 99, 235, 0.12); border-color: rgba(37, 99, 235, 0.2); }
    &:nth-child(11) { background: rgba(37, 99, 235, 0.08); }
    &:nth-child(16) { background: rgba(37, 99, 235, 0.05); }
  }
}

@keyframes cellPulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

.flow-line {
  position: absolute;
  top: 50%;
  left: 190px;
  width: 80px;
  height: 1px;
  background: linear-gradient(90deg, rgba(37, 99, 235, 0.4), transparent);
}

.brand-features {
  display: flex;
  flex-direction: column;
  gap: 14px;

  .feature-row {
    display: flex;
    align-items: center;
    gap: 10px;
    color: rgba(255, 255, 255, 0.55);
    font-size: 13px;

    .feature-dot {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: $brand;
      flex-shrink: 0;
    }
  }
}

// ─── 右侧登录区 ───
.login-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: $gray-50;
  position: relative;
}

.login-card {
  width: 380px;
  padding: 44px 40px;
  background: $bg-card;
  border-radius: $radius-xl;
  border: 1px solid $border-light;
  box-shadow: $shadow-lg;

  .login-header {
    margin-bottom: 32px;

    h1 {
      font-size: 24px;
      font-weight: 700;
      color: $text-primary;
      margin-bottom: 8px;
      letter-spacing: -0.02em;
    }

    p {
      font-size: 13px;
      color: $text-muted;
    }
  }

  :deep(.el-input__wrapper) {
    padding: 4px 14px;
  }

  :deep(.el-input__prefix) {
    color: $text-muted;
    margin-right: 6px;
  }

  .login-btn {
    width: 100%;
    height: 44px;
    font-size: 15px;
    font-weight: 600;
    border-radius: $radius-md;
    letter-spacing: 4px;
    margin-top: 4px;
  }

  .caps-tip {
    font-size: 11px;
    color: $warning;
    margin-top: 4px;
    line-height: 1;
  }
}

.login-footer {
  position: absolute;
  bottom: 24px;
  color: $text-disabled;
  font-size: 12px;
}

// ─── 响应式 ───
@media (max-width: 960px) {
  .login-brand { display: none; }
  .login-main { width: 100%; }
}

@media (max-height: 700px) {
  .brand-visual { display: none; }
  .brand-slogan { margin-bottom: 24px; }
}
</style>
