<template>
  <div class="rate-limit-page">
    <header class="page-header">
      <div class="title-area">
        <div class="title-icon">
          <el-icon><Timer /></el-icon>
        </div>
        <div>
          <div class="title-row">
            <h1>限流配置</h1>
          </div>
          <p>实时限制用户、来源 IP 与工单提交接口的每秒请求上限，防止接口被恶意刷取或滥用。</p>
        </div>
      </div>

      <div class="status-box">
        <div class="status-icon">
          <el-icon><CircleCheckFilled /></el-icon>
        </div>
        <div>
          <strong>Gateway 实时生效</strong>
          <span>修改配置后立即生效，无需重启服务</span>
        </div>
      </div>
    </header>

    <section class="summary-grid">
      <article
        v-for="item in summaryCards"
        :key="item.key"
        class="summary-card"
        :class="`summary-card--${item.theme}`"
      >
        <div class="summary-icon">
          <el-icon><component :is="item.icon" /></el-icon>
        </div>
        <div class="summary-content">
          <div class="summary-label">{{ item.label }}</div>
          <div class="summary-value-row">
            <strong>{{ form[item.key] }}</strong>
            <span>次 / 秒</span>
          </div>
          <p>{{ item.description }}</p>
        </div>
      </article>
    </section>

    <section class="config-card" v-loading="loading">
      <div class="section-heading">
        <h2>详细配置</h2>
      </div>

      <el-form label-position="top" class="config-form">
        <div class="limit-grid">
          <el-form-item>
            <template #label>
              <div class="field-label">
                <span>单用户 QPS</span>
                <el-tooltip content="同一个登录用户每秒允许访问普通接口的最大次数" placement="top">
                  <el-icon><QuestionFilled /></el-icon>
                </el-tooltip>
              </div>
            </template>
            <el-input-number
              v-model="form.userQps"
              :min="1"
              :max="10000"
              controls-position="right"
            />
            <p class="field-help">限制单个用户每秒访问系统的最大次数</p>
          </el-form-item>

          <el-form-item>
            <template #label>
              <div class="field-label">
                <span>单 IP QPS</span>
                <el-tooltip content="同一个来源 IP 每秒允许访问 Gateway 的最大次数" placement="top">
                  <el-icon><QuestionFilled /></el-icon>
                </el-tooltip>
              </div>
            </template>
            <el-input-number
              v-model="form.ipQps"
              :min="1"
              :max="10000"
              controls-position="right"
            />
            <p class="field-help">限制单个 IP 地址每秒访问系统的最大次数</p>
          </el-form-item>

          <el-form-item>
            <template #label>
              <div class="field-label">
                <span>工单提交 QPS</span>
                <el-tooltip content="同一个用户每秒允许调用工单提交接口的最大次数" placement="top">
                  <el-icon><QuestionFilled /></el-icon>
                </el-tooltip>
              </div>
            </template>
            <el-input-number
              v-model="form.submitQps"
              :min="1"
              :max="10000"
              controls-position="right"
            />
            <p class="field-help">限制工单提交接口每秒允许的最大请求数</p>
          </el-form-item>
        </div>

        <el-divider />

        <el-form-item>
          <template #label>
            <div class="field-label">
              <span>白名单用户</span>
              <el-tooltip content="这里填写用户 ID，不是登录账号或姓名。命中后仅跳过用户维度限流。" placement="top">
                <el-icon><QuestionFilled /></el-icon>
              </el-tooltip>
            </div>
          </template>
          <el-select
            v-model="form.whiteUsers"
            multiple
            filterable
            allow-create
            default-first-option
            class="full-width"
            placeholder="输入用户 ID 后按回车添加"
          />
          <p class="field-help">白名单用户不受用户访问上限限制，但仍受 IP 访问上限限制</p>
        </el-form-item>

        <el-form-item>
          <template #label>
            <div class="field-label">
              <span>白名单 IP</span>
              <el-tooltip content="命中后会跳过全部限流，请仅添加可信且固定的来源 IP。" placement="top">
                <el-icon><QuestionFilled /></el-icon>
              </el-tooltip>
            </div>
          </template>
          <el-select
            v-model="form.whiteIps"
            multiple
            filterable
            allow-create
            default-first-option
            class="full-width"
            placeholder="输入 IP 地址后按回车添加"
          />
          <p class="field-help">白名单 IP 不受 IP 访问上限限制，请谨慎配置</p>
        </el-form-item>

        <div class="usage-note">
          <div class="usage-note__title">
            <el-icon><InfoFilled /></el-icon>
            <span>使用说明</span>
          </div>
          <ul>
            <li>限流策略在网关层（Gateway）实时生效，超过阈值后接口返回 429。</li>
            <li>保存后配置同步持久化到 Nacos 配置中心，服务重启后自动加载，无需手动维护。</li>
            <li>白名单 IP 会跳过全部限流，普通本地开发通常保持为空即可。</li>
          </ul>
        </div>

        <div class="actions">
          <el-button :icon="Refresh" :disabled="loading || saving" @click="resetDefaults">
            重置默认
          </el-button>
          <el-button type="primary" :icon="Check" :loading="saving" @click="save">
            保存并立即生效
          </el-button>
        </div>
      </el-form>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Check,
  CircleCheckFilled,
  Document,
  InfoFilled,
  Location,
  QuestionFilled,
  Refresh,
  Timer,
  User
} from '@element-plus/icons-vue'
import { getRateLimitConfig, updateRateLimitConfig } from '@/api/config'

const DEFAULT_CONFIG = Object.freeze({
  userQps: 20,
  ipQps: 50,
  submitQps: 100,
  whiteUsers: [],
  whiteIps: []
})

const loading = ref(false)
const saving = ref(false)

const form = reactive({
  userQps: DEFAULT_CONFIG.userQps,
  ipQps: DEFAULT_CONFIG.ipQps,
  submitQps: DEFAULT_CONFIG.submitQps,
  whiteUsers: [],
  whiteIps: []
})

const summaryCards = computed(() => [
  {
    key: 'userQps',
    label: '用户访问上限',
    description: '单个用户每秒最多允许访问的次数',
    icon: User,
    theme: 'blue'
  },
  {
    key: 'ipQps',
    label: 'IP 访问上限',
    description: '单个 IP 每秒最多允许访问的次数',
    icon: Location,
    theme: 'green'
  },
  {
    key: 'submitQps',
    label: '提交保护上限',
    description: '工单提交接口每秒最多允许的次数',
    icon: Document,
    theme: 'orange'
  }
])

function normalizeConfig(data = {}) {
  return {
    userQps: Number(data.userQps ?? DEFAULT_CONFIG.userQps),
    ipQps: Number(data.ipQps ?? DEFAULT_CONFIG.ipQps),
    submitQps: Number(data.submitQps ?? DEFAULT_CONFIG.submitQps),
    whiteUsers: Array.isArray(data.whiteUsers) ? data.whiteUsers.filter(Boolean).map(String) : [],
    whiteIps: Array.isArray(data.whiteIps) ? data.whiteIps.filter(Boolean).map(String) : []
  }
}

function applyConfig(data) {
  const normalized = normalizeConfig(data)
  form.userQps = normalized.userQps
  form.ipQps = normalized.ipQps
  form.submitQps = normalized.submitQps
  form.whiteUsers = [...normalized.whiteUsers]
  form.whiteIps = [...normalized.whiteIps]
}

async function load() {
  loading.value = true
  try {
    const response = await getRateLimitConfig()
    applyConfig(response?.data)
  } catch (error) {
    console.error('加载限流配置失败：', error)
  } finally {
    loading.value = false
  }
}

async function save() {
  if (form.submitQps > form.ipQps) {
    await ElMessageBox.confirm(
      '当前"工单提交 QPS"大于"单 IP QPS"。实际请求仍会先受到 IP 上限约束，是否继续保存？',
      '配置提醒',
      { type: 'warning', confirmButtonText: '继续保存', cancelButtonText: '返回修改' }
    )
  }

  saving.value = true
  try {
    const payload = {
      userQps: Number(form.userQps),
      ipQps: Number(form.ipQps),
      submitQps: Number(form.submitQps),
      whiteUsers: form.whiteUsers.map(String),
      whiteIps: form.whiteIps.map(String)
    }
    const response = await updateRateLimitConfig(payload)
    applyConfig(response?.data ?? payload)
    ElMessage.success('限流配置已在当前 Gateway 实例生效')
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      ElMessage.error(error?.message || '保存限流配置失败')
    }
  } finally {
    saving.value = false
  }
}

async function resetDefaults() {
  try {
    await ElMessageBox.confirm(
      '确认恢复默认限流参数？白名单内容也会被清空。',
      '重置默认配置',
      { type: 'warning', confirmButtonText: '确认重置', cancelButtonText: '取消' }
    )
    applyConfig(DEFAULT_CONFIG)
  } catch {
    // 用户取消
  }
}

onMounted(load)
</script>

<style scoped lang="scss">
.rate-limit-page {
  --page-blue: #2563eb;
  --page-green: #16a36a;
  --page-orange: #e86818;
  --text-primary: #17233d;
  --text-regular: #516078;
  --text-secondary: #8290a8;
  --border: #e6ebf3;
  --card-bg: #ffffff;

  width: 100%;
  padding: 26px 32px 36px;
  color: var(--text-primary);
  box-sizing: border-box;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 24px;
}

.title-area {
  display: flex;
  align-items: flex-start;
  gap: 15px;
}

.title-icon {
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  flex: 0 0 auto;
  border-radius: 12px;
  color: var(--page-blue);
  background: #eaf2ff;
  font-size: 23px;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.title-row h1 {
  margin: 0;
  font-size: 25px;
  line-height: 1.25;
  font-weight: 700;
  letter-spacing: -0.4px;
}

.title-area p {
  margin: 7px 0 0;
  color: var(--text-secondary);
  font-size: 14px;
}

.status-box {
  display: flex;
  align-items: center;
  gap: 11px;
  min-width: 250px;
  padding: 10px 17px;
  border: 1px solid #bfe8d3;
  border-radius: 10px;
  background: #f5fff9;
}

.status-icon {
  color: #16b364;
  font-size: 24px;
}

.status-box strong,
.status-box span {
  display: block;
}

.status-box strong {
  color: #12a65a;
  font-size: 14px;
  line-height: 1.3;
}

.status-box span {
  margin-top: 2px;
  color: #7d8b9f;
  font-size: 12px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
  margin-bottom: 20px;
}

.summary-card {
  position: relative;
  display: flex;
  min-height: 122px;
  align-items: center;
  gap: 22px;
  padding: 24px 26px;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--card-bg);
  box-shadow: 0 6px 20px rgba(31, 52, 88, 0.045);
}

.summary-card::after {
  position: absolute;
  inset: 0 0 0 auto;
  width: 40%;
  content: '';
  pointer-events: none;
}

.summary-card--blue::after {
  background: linear-gradient(90deg, transparent, rgba(37, 99, 235, 0.035));
}

.summary-card--green::after {
  background: linear-gradient(90deg, transparent, rgba(22, 163, 106, 0.04));
}

.summary-card--orange::after {
  background: linear-gradient(90deg, transparent, rgba(232, 104, 24, 0.045));
}

.summary-icon {
  position: relative;
  z-index: 1;
  display: grid;
  width: 62px;
  height: 62px;
  place-items: center;
  flex: 0 0 auto;
  border-radius: 50%;
  font-size: 31px;
}

.summary-card--blue .summary-icon {
  color: var(--page-blue);
  background: #eaf2ff;
}

.summary-card--green .summary-icon {
  color: var(--page-green);
  background: #e7f8ef;
}

.summary-card--orange .summary-icon {
  color: var(--page-orange);
  background: #fff0e5;
}

.summary-content {
  position: relative;
  z-index: 1;
  min-width: 0;
}

.summary-label {
  color: #3f4b60;
  font-size: 15px;
  font-weight: 600;
}

.summary-value-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-top: 5px;
}

.summary-value-row strong {
  font-size: 38px;
  line-height: 1;
  font-weight: 700;
  letter-spacing: -1px;
}

.summary-card--blue .summary-value-row strong { color: var(--page-blue); }
.summary-card--green .summary-value-row strong { color: var(--page-green); }
.summary-card--orange .summary-value-row strong { color: var(--page-orange); }

.summary-value-row span,
.summary-content p {
  color: var(--text-secondary);
}

.summary-value-row span { font-size: 14px; }

.summary-content p {
  margin: 12px 0 0;
  font-size: 13px;
}

.config-card {
  padding: 22px 24px 18px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--card-bg);
  box-shadow: 0 6px 20px rgba(31, 52, 88, 0.04);
}

.section-heading h2 {
  margin: 0 0 19px;
  font-size: 18px;
  font-weight: 700;
}

.limit-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  column-gap: 72px;
}

.field-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #263249;
  font-weight: 600;
}

.field-label .el-icon {
  color: #8190a7;
  cursor: help;
}

.field-help {
  width: 100%;
  margin: 8px 0 0;
  color: var(--text-secondary);
  font-size: 12px;
  line-height: 1.55;
}

.full-width { width: 100%; }

.usage-note {
  margin-top: 6px;
  padding: 14px 18px;
  border: 1px solid #bdd5ff;
  border-radius: 8px;
  background: #f4f8ff;
}

.usage-note__title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #1565d8;
  font-size: 14px;
  font-weight: 700;
}

.usage-note ul {
  margin: 8px 0 0 20px;
  padding: 0;
  color: #2f6cc7;
  font-size: 12px;
  line-height: 1.85;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 15px;
}

:deep(.el-form-item) { margin-bottom: 22px; }

:deep(.limit-grid .el-input-number) { width: 174px; }

:deep(.el-input-number .el-input__wrapper),
:deep(.el-select__wrapper) {
  min-height: 38px;
  box-shadow: 0 0 0 1px #dce3ed inset;
}

:deep(.el-select__wrapper:hover),
:deep(.el-input-number .el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #93b7f8 inset;
}

:deep(.el-divider--horizontal) {
  margin: 2px 0 23px;
  border-color: #edf0f5;
}

:deep(.actions .el-button) {
  min-width: 116px;
  height: 38px;
}

:deep(.actions .el-button--primary) { min-width: 150px; }

@media (max-width: 1100px) {
  .summary-grid,
  .limit-grid {
    grid-template-columns: 1fr;
  }

  .limit-grid { row-gap: 0; }
  .summary-card { min-height: auto; }
}

@media (max-width: 760px) {
  .rate-limit-page { padding: 18px 14px 28px; }
  .page-header { align-items: stretch; flex-direction: column; }
  .status-box { min-width: 0; }
  .summary-card { padding: 20px; }
  .config-card { padding: 19px 15px 16px; }
  .actions { flex-direction: column-reverse; }
  :deep(.actions .el-button) { width: 100%; margin-left: 0; }
}
</style>
