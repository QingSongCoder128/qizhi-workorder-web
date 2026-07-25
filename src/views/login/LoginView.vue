<template>
  <div class="login-page">
    <!-- 背景装饰 -->
    <div class="bg-decor">
      <div class="decor-circle c1"></div>
      <div class="decor-circle c2"></div>
      <div class="decor-circle c3"></div>
    </div>

    <div class="login-wrapper">
      <!-- 左侧品牌区 -->
      <div class="login-left">
        <div class="brand-icon">
          <el-icon :size="36"><SetUp /></el-icon>
        </div>
        <h1>企智协同工单调度系统</h1>
        <p class="brand-desc">智能工单管理与审批平台，助力企业高效协同</p>
        <div class="feature-list">
          <div class="feature-item">
            <div class="fi-icon" style="background: rgba(99,102,241,0.15)"><el-icon><MagicStick /></el-icon></div>
            <div class="fi-text"><b>AI 智能分类</b><span>自动识别工单类型与优先级</span></div>
          </div>
          <div class="feature-item">
            <div class="fi-icon" style="background: rgba(245,158,11,0.15)"><el-icon><Stamp /></el-icon></div>
            <div class="fi-text"><b>多级审批流</b><span>支持转交、加签、减签操作</span></div>
          </div>
          <div class="feature-item">
            <div class="fi-icon" style="background: rgba(16,185,129,0.15)"><el-icon><Bell /></el-icon></div>
            <div class="fi-text"><b>实时督办提醒</b><span>超时自动预警，消息即时推送</span></div>
          </div>
          <div class="feature-item">
            <div class="fi-icon" style="background: rgba(59,130,246,0.15)"><el-icon><DataAnalysis /></el-icon></div>
            <div class="fi-text"><b>数据可视化</b><span>多维度统计报表一目了然</span></div>
          </div>
        </div>
      </div>

      <!-- 右侧登录卡片 -->
      <div class="login-right">
        <div class="login-card">
          <div class="login-header">
            <h2>欢迎登录</h2>
            <p>请输入您的账号信息</p>
          </div>

          <el-form ref="formRef" :model="form" :rules="rules" size="large">
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
                @capslock="capsOn = $event"
              />
              <div v-if="capsOn" class="caps-tip">大写锁定已开启</div>
            </el-form-item>
            <el-form-item>
              <el-button
                type="primary"
                :loading="loading"
                class="login-btn"
                @click="handleLogin"
              >
                {{ loading ? '登录中...' : '登 录' }}
              </el-button>
            </el-form-item>
          </el-form>


        </div>
      </div>
    </div>

    <div class="login-footer">
      <p>&copy; 2026 企智协同工单调度系统</p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, MagicStick, Stamp, Bell, DataAnalysis } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'

const router = useRouter()
const userStore = useUserStore()
const formRef = ref()
const usernameRef = ref()
const passwordRef = ref()
const loading = ref(false)
const capsOn = ref(false)

onMounted(() => {
  usernameRef.value?.focus()
})

function focusPassword() {
  passwordRef.value?.focus()
}

const form = reactive({
  username: '',
  password: ''
})

const rules = {
  username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
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
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0f172a;
  position: relative;
  overflow: hidden;
}

// 背景装饰圆
.bg-decor {
  position: absolute;
  inset: 0;
  pointer-events: none;

  .decor-circle {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.4;
  }

  .c1 {
    width: 500px;
    height: 500px;
    background: #4f46e5;
    top: -150px;
    right: -100px;
  }

  .c2 {
    width: 400px;
    height: 400px;
    background: #7c3aed;
    bottom: -120px;
    left: -80px;
  }

  .c3 {
    width: 250px;
    height: 250px;
    background: #0ea5e9;
    top: 50%;
    left: 45%;
    opacity: 0.2;
  }
}

.login-wrapper {
  display: flex;
  align-items: center;
  gap: 100px;
  z-index: 1;
  padding: 40px;
}

// 左侧品牌区
.login-left {
  max-width: 400px;
  color: #fff;

  .brand-icon {
    width: 64px;
    height: 64px;
    border-radius: 16px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
    box-shadow: 0 8px 24px rgba(99, 102, 241, 0.35);
  }

  h1 {
    font-size: 30px;
    font-weight: 700;
    margin-bottom: 10px;
    letter-spacing: 1px;
  }

  .brand-desc {
    color: rgba(255, 255, 255, 0.55);
    font-size: 14px;
    margin-bottom: 36px;
  }

  .feature-list {
    display: flex;
    flex-direction: column;
    gap: 18px;

    .feature-item {
      display: flex;
      align-items: center;
      gap: 14px;

      .fi-icon {
        width: 40px;
        height: 40px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;

        .el-icon {
          font-size: 18px;
          color: #a5b4fc;
        }
      }

      .fi-text {
        display: flex;
        flex-direction: column;
        gap: 2px;

        b {
          font-size: 14px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.9);
        }

        span {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.45);
        }
      }
    }
  }
}

// 右侧登录卡片
.login-right {
  .login-card {
    width: 380px;
    background: #fff;
    border-radius: 20px;
    padding: 44px 38px;
    box-shadow: 0 25px 60px rgba(0, 0, 0, 0.3);
  }

  .login-header {
    text-align: center;
    margin-bottom: 36px;

    h2 {
      font-size: 24px;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 8px;
    }

    p {
      color: #94a3b8;
      font-size: 13px;
    }
  }

  .login-btn {
    width: 100%;
    height: 46px;
    font-size: 16px;
    font-weight: 600;
    border-radius: 12px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    border: none;
    letter-spacing: 4px;
    transition: all 0.3s;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(99, 102, 241, 0.4);
    }

    &:active {
      transform: translateY(0);
    }
  }

  .caps-tip {
    font-size: 12px;
    color: #f59e0b;
    margin-top: 4px;
    line-height: 1;
  }
}

.login-footer {
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  color: rgba(255, 255, 255, 0.3);
  font-size: 12px;
}

@media (max-width: 960px) {
  .login-wrapper {
    flex-direction: column;
    gap: 40px;
  }
  .login-left {
    display: none;
  }
}
</style>
