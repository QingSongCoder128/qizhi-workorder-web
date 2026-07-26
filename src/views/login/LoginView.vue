<template>
  <main class="login-page">
    <!-- 背景装饰 -->
    <div class="background-decoration" aria-hidden="true">
      <span class="wave wave-one"></span>
      <span class="wave wave-two"></span>
      <span class="glow glow-one"></span>
      <span class="glow glow-two"></span>
    </div>

    <!-- 左侧品牌视觉区（合成资源图） -->
    <section class="brand-visual" aria-label="系统介绍">
      <img
        class="brand-visual-image"
        src="@/assets/left-visual.png"
        alt="企智协同工单调度系统功能介绍"
      />
    </section>

    <!-- 右侧登录区 -->
    <section class="login-area">
      <el-card class="login-card" shadow="never">
        <div class="card-heading">
          <div>
            <h1>欢迎登录</h1>
            <p>请使用您的账号登录系统</p>
          </div>
          <img class="shield-image" src="@/assets/shield.png" alt="安全登录" />
        </div>

        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          class="login-form"
          @submit.prevent="handleLogin"
        >
          <el-form-item prop="username">
            <el-input
              ref="usernameRef"
              v-model.trim="form.username"
              class="login-input"
              size="large"
              placeholder="请输入账号"
              autocomplete="username"
              :prefix-icon="User"
              :disabled="loading"
              clearable
              @keyup.enter="focusPassword"
              @focus="clearFieldError('username')"
              @input="clearFieldError('username')"
            />
          </el-form-item>

          <el-form-item prop="password">
            <el-input
              ref="passwordRef"
              v-model="form.password"
              class="login-input"
              size="large"
              type="password"
              placeholder="请输入密码"
              autocomplete="current-password"
              :prefix-icon="Lock"
              :disabled="loading"
              show-password
              @keyup.enter="handleLogin"
              @focus="clearFieldError('password')"
              @input="clearFieldError('password')"
            />
            <div v-if="capsOn" class="caps-tip">大写锁定已开启</div>
          </el-form-item>

          <div class="form-options">
            <el-checkbox v-model="rememberMe">记住我</el-checkbox>
            <button type="button" class="forgot-button" @click="handleForgotPassword">
              忘记密码？
            </button>
          </div>

          <el-button
            class="login-button"
            type="primary"
            native-type="submit"
            :loading="loading"
          >
            登&nbsp;&nbsp;录
          </el-button>
        </el-form>

        <div class="internal-tip">
          <span></span>
          <p>仅支持企业内部账号登录</p>
          <span></span>
        </div>
      </el-card>

      <p class="login-footer">&copy; 2026 企智协同工单调度系统</p>
    </section>
  </main>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
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
const rememberMe = ref(false)

const REMEMBER_KEY = 'qizhi_remembered_user'
const REMEMBER_DAYS = 7 // 记住我有效期7天

const form = reactive({ username: '', password: '' })
// 校验仅在点击登录按钮时触发，不在输入/清空时自动报红
const rules = {
  username: [{ required: true, message: '请输入账号', trigger: 'submit' }],
  password: [{ required: true, message: '请输入密码', trigger: 'submit' }]
}

onMounted(() => {
  const saved = localStorage.getItem(REMEMBER_KEY)
  if (saved) {
    try {
      const { name, expireAt } = JSON.parse(saved)
      if (Date.now() < expireAt) {
        form.username = name
        rememberMe.value = true
        passwordRef.value?.focus()
      } else {
        localStorage.removeItem(REMEMBER_KEY) // 已过期，清除
        usernameRef.value?.focus()
      }
    } catch {
      localStorage.removeItem(REMEMBER_KEY)
      usernameRef.value?.focus()
    }
  } else {
    usernameRef.value?.focus()
  }
  document.addEventListener('keydown', detectCaps)
  document.addEventListener('keyup', detectCaps)
})

onUnmounted(() => {
  document.removeEventListener('keydown', detectCaps)
  document.removeEventListener('keyup', detectCaps)
})

function detectCaps(e) {
  capsOn.value = e.getModifierState && e.getModifierState('CapsLock')
}

function focusPassword() { passwordRef.value?.focus() }

// 输入框获得焦点时清除该字段的错误状态（修复红框残留问题）
function clearFieldError(prop) {
  formRef.value?.clearValidate(prop)
}

function handleForgotPassword() {
  ElMessage.info('企业内部账号请联系系统管理员重置密码')
}

async function handleLogin() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  loading.value = true
  try {
    await userStore.login(form)
    if (rememberMe.value) {
      localStorage.setItem(REMEMBER_KEY, JSON.stringify({
        name: form.username,
        expireAt: Date.now() + REMEMBER_DAYS * 24 * 60 * 60 * 1000
      }))
    } else {
      localStorage.removeItem(REMEMBER_KEY)
    }
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

<style scoped>
.login-page {
  position: relative;
  display: grid;
  grid-template-columns: minmax(690px, 1fr) minmax(530px, 0.77fr);
  width: 100%;
  height: 100vh;
  min-height: 680px;
  overflow: hidden;
  background:
    radial-gradient(circle at 82% 15%, rgba(182, 207, 255, 0.45), transparent 24%),
    radial-gradient(circle at 14% 88%, rgba(163, 204, 255, 0.24), transparent 34%),
    linear-gradient(135deg, #f8fbff 0%, #f4f8ff 45%, #edf4ff 100%);
}

/* ─── 背景装饰 ─── */
.background-decoration {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.wave {
  position: absolute;
  display: block;
  border: 2px solid rgba(71, 128, 255, 0.15);
  border-left-color: transparent;
  border-bottom-color: transparent;
  border-radius: 50%;
  transform: rotate(-13deg);
}

.wave-one {
  top: -310px;
  right: -270px;
  width: 1050px;
  height: 570px;
  box-shadow: 0 0 80px rgba(91, 140, 255, 0.09);
}

.wave-two {
  top: -220px;
  right: -310px;
  width: 870px;
  height: 470px;
  border-color: rgba(93, 146, 255, 0.09);
  border-left-color: transparent;
  border-bottom-color: transparent;
}

.glow {
  position: absolute;
  border-radius: 999px;
  filter: blur(60px);
}

.glow-one {
  top: 100px;
  right: 30px;
  width: 440px;
  height: 250px;
  background: rgba(175, 207, 255, 0.14);
}

.glow-two {
  right: 200px;
  bottom: -200px;
  width: 620px;
  height: 390px;
  background: rgba(160, 200, 255, 0.16);
}

/* ─── 左侧品牌视觉 ─── */
.brand-visual {
  position: relative;
  z-index: 1;
  height: 100%;
  min-width: 0;
  overflow: hidden;
}

.brand-visual-image {
  position: absolute;
  inset: 0 auto auto 0;
  width: min(900px, 100%);
  height: 100%;
  object-fit: cover;
  object-position: left top;
  user-select: none;
  pointer-events: none;
}

/* ─── 右侧登录区 ─── */
.login-area {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 72px 64px 40px 24px;
}

.login-card :deep(.el-card__body) {
  padding: 84px 56px 54px;
}

.login-card {
  width: min(612px, 100%);
  border: 1px solid rgba(226, 233, 244, 0.95);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.93);
  box-shadow:
    0 22px 56px rgba(40, 80, 150, 0.1),
    0 3px 12px rgba(70, 105, 170, 0.06);
  backdrop-filter: blur(16px);
}

.card-heading {
  position: relative;
  display: flex;
  min-height: 150px;
}

.card-heading h1 {
  margin: 0;
  color: #081b3d;
  font-size: 38px;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -1px;
}

.card-heading p {
  margin: 18px 0 0;
  color: #73829c;
  font-size: 17px;
  line-height: 1.5;
}

.shield-image {
  position: absolute;
  top: -57px;
  right: -20px;
  width: 215px;
  height: 175px;
  object-fit: contain;
  mix-blend-mode: multiply;
  pointer-events: none;
  user-select: none;
}

/* ─── 表单 ─── */
.login-form {
  margin-top: 5px;
}

.login-form :deep(.el-form-item) {
  margin-bottom: 24px;
}

.login-input :deep(.el-input__wrapper) {
  min-height: 64px;
  padding: 0 18px;
  border-radius: 9px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 0 0 1px #d8e0eb inset;
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.login-input :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #afc4e7 inset;
}

.login-input :deep(.el-input__wrapper.is-focus) {
  box-shadow:
    0 0 0 1.5px #2f6cf3 inset,
    0 0 0 4px rgba(47, 108, 243, 0.1);
}

.login-input :deep(.el-input__prefix-inner) {
  margin-right: 8px;
}

.login-input :deep(.el-input__icon) {
  width: 24px;
  height: 24px;
  color: #8b9ab2;
  font-size: 23px;
}

.login-input :deep(.el-input__inner) {
  height: 62px;
  color: #4b5563;
  font-size: 18px;
}

.login-input :deep(.el-input__inner::placeholder) {
  color: #a5afbf;
}

.caps-tip {
  font-size: 13px;
  color: #d97706;
  margin-top: 6px;
  line-height: 1;
}

/* ─── 记住我 / 忘记密码 ─── */
.form-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 1px;
  margin-bottom: 31px;
}

.form-options :deep(.el-checkbox__label) {
  color: #66758d;
  font-size: 16px;
}

.forgot-button {
  padding: 6px 0;
  border: 0;
  color: #2468f2;
  background: transparent;
  cursor: pointer;
  font-size: 15px;
}

.forgot-button:hover {
  color: #164fd0;
}

/* ─── 登录按钮 ─── */
.login-button {
  width: 100%;
  height: 59px;
  border: 0;
  border-radius: 9px;
  color: #fff;
  background: linear-gradient(90deg, #2865ea 0%, #236bf4 53%, #2f62e2 100%);
  box-shadow: 0 11px 25px rgba(40, 100, 230, 0.22);
  font-size: 19px;
  font-weight: 600;
  letter-spacing: 0.06em;
}

.login-button:hover,
.login-button:focus {
  background: linear-gradient(90deg, #1f5ce3 0%, #1e62ed 53%, #2858d8 100%);
  transform: translateY(-1px);
  box-shadow: 0 14px 28px rgba(40, 100, 230, 0.28);
}

/* ─── 底部提示 ─── */
.internal-tip {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 18px;
  margin-top: 43px;
}

.internal-tip span {
  height: 1px;
  background: linear-gradient(90deg, transparent, #e2e7ef);
}

.internal-tip span:last-child {
  background: linear-gradient(90deg, #e2e7ef, transparent);
}

.internal-tip p {
  margin: 0;
  color: #7b879c;
  font-size: 15px;
  white-space: nowrap;
}

.login-footer {
  margin-top: 24px;
  color: #94a3b8;
  font-size: 13px;
}

/* ─── 响应式 ─── */
@media (max-width: 1280px) {
  .login-page {
    grid-template-columns: minmax(560px, 1fr) minmax(500px, 0.86fr);
  }

  .login-area {
    padding-right: 32px;
  }

  .login-card :deep(.el-card__body) {
    padding-right: 44px;
    padding-left: 44px;
  }
}

@media (max-width: 1050px) {
  .login-page {
    display: flex;
    min-height: 100vh;
    align-items: center;
    justify-content: center;
  }

  .brand-visual {
    position: absolute;
    inset: 0;
    opacity: 0.18;
  }

  .brand-visual-image {
    width: 100%;
    object-fit: cover;
  }

  .login-area {
    width: 100%;
    padding: 40px 24px;
  }

  .login-card {
    width: min(590px, 100%);
  }
}

@media (max-width: 620px) {
  .login-page {
    min-height: 100svh;
  }

  .login-area {
    padding: 20px 14px;
  }

  .login-card {
    border-radius: 14px;
  }

  .login-card :deep(.el-card__body) {
    padding: 42px 24px 36px;
  }

  .card-heading {
    min-height: 122px;
  }

  .card-heading h1 {
    font-size: 31px;
  }

  .card-heading p {
    margin-top: 12px;
    font-size: 15px;
  }

  .shield-image {
    top: -37px;
    right: -22px;
    width: 155px;
    height: 126px;
    opacity: 0.82;
  }

  .login-input :deep(.el-input__wrapper) {
    min-height: 56px;
  }

  .login-input :deep(.el-input__inner) {
    height: 54px;
    font-size: 16px;
  }

  .login-button {
    height: 54px;
  }

  .internal-tip {
    gap: 10px;
    margin-top: 34px;
  }

  .internal-tip p {
    font-size: 13px;
  }
}
</style>
