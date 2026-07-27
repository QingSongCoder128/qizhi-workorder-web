<template>
  <div class="ai-config-page">
    <!-- 页面标题 -->
    <header class="page-heading">
      <div class="heading-left">
        <span class="heading-icon">
          <el-icon><Setting /></el-icon>
        </span>
        <div class="heading-copy">
          <div class="title-line">
            <h1>AI 配置</h1>
            <span class="heading-tip">运行参数来自 Nacos，保存后实时生效，无需重启服务</span>
          </div>
        </div>
      </div>

      <el-tag
        class="effective-tag"
        :type="form.keyConfigured ? 'success' : 'warning'"
        effect="light"
        round
      >
        <el-icon><CircleCheck /></el-icon>
        {{ form.keyConfigured ? '配置已生效' : '配置待完善' }}
      </el-tag>
    </header>

    <!-- 概览卡片 -->
    <section class="summary-grid">
      <article class="summary-card">
        <span class="summary-icon summary-icon--blue">
          <el-icon><Box /></el-icon>
        </span>
        <div class="summary-content">
          <span class="summary-label">当前模型</span>
          <strong class="summary-value summary-value--blue">
            {{ form.modelName || '未配置' }}
          </strong>
          <span class="summary-desc">大模型正在稳定运行</span>
        </div>
      </article>

      <article class="summary-card">
        <span class="summary-icon summary-icon--green">
          <el-icon><CircleCheck /></el-icon>
        </span>
        <div class="summary-content">
          <span class="summary-label">模型连接状态</span>
          <strong class="summary-value" :class="connectionStatusClass">
            {{ connectionStatusText }}
          </strong>
          <span class="summary-desc">{{ connectionStatusDesc }}</span>
        </div>
      </article>

      <article class="summary-card">
        <span class="summary-icon summary-icon--purple">
          <el-icon><Monitor /></el-icon>
        </span>
        <div class="summary-content">
          <span class="summary-label">并发状态</span>
          <strong class="summary-value summary-value--purple">
            {{ supervisor.runningTasks }} / {{ form.maxConcurrent || supervisor.maxConcurrent }}
          </strong>
          <span class="summary-desc">当前运行 / 最大并发</span>
        </div>
      </article>

      <article class="summary-card">
        <span class="summary-icon summary-icon--orange">
          <el-icon><Refresh /></el-icon>
        </span>
        <div class="summary-content">
          <span class="summary-label">配置来源</span>
          <strong class="summary-value summary-value--orange">Nacos</strong>
          <span class="summary-desc">实时配置中心</span>
        </div>
      </article>
    </section>

    <section class="config-grid">
      <!-- 模型连接配置 -->
      <article class="panel-card">
        <div class="panel-heading">
          <span class="panel-heading__icon">
            <el-icon><ChatDotSquare /></el-icon>
          </span>
          <div>
            <h2>模型连接配置</h2>
            <p>配置大模型服务的连接信息</p>
          </div>
        </div>

        <el-form
          ref="modelFormRef"
          v-loading="loading"
          :model="form"
          :rules="rules"
          label-position="top"
          class="config-form"
        >
          <el-form-item prop="apiUrl">
            <template #label>
              <span class="field-label">
                API 地址
                <el-tooltip content="兼容 OpenAI Chat Completions 协议的接口地址" placement="top">
                  <el-icon><InfoFilled /></el-icon>
                </el-tooltip>
              </span>
            </template>
            <el-input
              v-model.trim="form.apiUrl"
              clearable
              :placeholder="apiUrlPlaceholder"
            />
            <div class="field-help">支持 OpenAI 兼容接口地址，留空保持现有配置</div>
          </el-form-item>

          <el-form-item prop="apiKey">
            <template #label>
              <span class="field-label">
                API Key
                <el-tooltip content="密钥只用于服务端调用，页面永不回显完整值" placement="top">
                  <el-icon><InfoFilled /></el-icon>
                </el-tooltip>
              </span>
            </template>
            <el-input
              v-model="form.apiKey"
              type="password"
              show-password
              clearable
              autocomplete="new-password"
              placeholder="请输入 API Key（留空保持现有配置）"
            />
          </el-form-item>

          <el-form-item prop="modelName">
            <template #label>
              <span class="field-label">
                模型名称
                <el-tooltip content="填写平台真实可用的模型标识" placement="top">
                  <el-icon><InfoFilled /></el-icon>
                </el-tooltip>
              </span>
            </template>
            <el-input v-model.trim="form.modelName" clearable placeholder="例如 deepseek-v4-flash" />
            <div class="field-help">选择或输入要使用的大模型名称</div>
          </el-form-item>

          <div class="three-column-form">
            <el-form-item prop="temperature">
              <template #label>
                <span class="field-label">温度（Temperature）</span>
              </template>
              <el-input-number
                v-model="form.temperature"
                :min="0"
                :max="2"
                :step="0.1"
                :precision="1"
              />
              <div class="field-help">值越低越稳定</div>
            </el-form-item>

            <el-form-item prop="maxTokens">
              <template #label>
                <span class="field-label">最大 Token</span>
              </template>
              <el-input-number
                v-model="form.maxTokens"
                :min="128"
                :max="32768"
                :step="128"
              />
              <div class="field-help">单次请求最大输出长度</div>
            </el-form-item>

            <el-form-item prop="timeoutMs">
              <template #label>
                <span class="field-label">超时时间（ms）</span>
              </template>
              <el-input-number
                v-model="form.timeoutMs"
                :min="1000"
                :max="120000"
                :step="1000"
              />
              <div class="field-help">请求超时时间</div>
            </el-form-item>
          </div>

          <div class="info-strip">
            <el-icon><InfoFilled /></el-icon>
            <span>提示：如需修改 API 地址或 Key，请在输入框填写新值；留空则保持不变。</span>
          </div>
        </el-form>
      </article>

      <!-- Graph 与容错配置 -->
      <article class="panel-card">
        <div class="panel-heading">
          <span class="panel-heading__icon">
            <el-icon><Aim /></el-icon>
          </span>
          <div>
            <h2>Graph 与容错配置</h2>
            <p>配置 AI 流程节点顺序与容错策略</p>
          </div>
        </div>

        <el-form label-position="top" class="config-form">
          <el-form-item>
            <template #label>
              <span class="field-label">节点顺序（按执行顺序）</span>
            </template>
            <el-select
              v-model="form.nodeOrder"
              multiple
              :collapse-tags="false"
              class="node-select"
              placeholder="请选择节点"
            >
              <el-option label="分类 CATEGORY" value="CATEGORY" />
              <el-option label="评级 RATING" value="RATING" />
              <el-option label="预审 PRE_AUDIT" value="PRE_AUDIT" />
            </el-select>
            <div class="field-help">系统将按照以上顺序依次执行三个节点</div>
          </el-form-item>

          <div class="three-column-form tolerance-grid">
            <el-form-item>
              <template #label>
                <span class="field-label">最大并发</span>
              </template>
              <el-input-number v-model="form.maxConcurrent" :min="1" :max="100" />
              <div class="field-help">同时运行的最大任务数</div>
            </el-form-item>

            <el-form-item>
              <template #label>
                <span class="field-label">重试次数</span>
              </template>
              <el-input-number v-model="form.maxRetry" :min="0" :max="10" />
              <div class="field-help">失败后最大重试次数</div>
            </el-form-item>

            <el-form-item>
              <template #label>
                <span class="field-label">重试间隔（ms）</span>
              </template>
              <el-input-number v-model="form.retryIntervalMs" :min="0" :max="60000" :step="100" />
              <div class="field-help">重试间隔时间</div>
            </el-form-item>
          </div>

          <div class="strategy-box">
            <div class="strategy-title">
              <el-icon><InfoFilled /></el-icon>
              <span>容错策略说明</span>
            </div>
            <ul>
              <li>单个节点失败时，将自动重试（最大重试次数）。</li>
              <li>所有重试均失败时，该工单将标记为 AI 处理异常，并使用默认规则处理。</li>
              <li>建议根据模型服务稳定性，合理调整并发和重试策略。</li>
            </ul>
          </div>

          <div class="actions">
            <el-button :loading="validating" @click="validateConnection">
              <el-icon><DocumentChecked /></el-icon>
              验证连接
            </el-button>
            <el-button type="primary" :loading="saving" @click="save">
              <el-icon><Lightning /></el-icon>
              保存并热更新
            </el-button>
          </div>
        </el-form>
      </article>
    </section>

    <!-- 配置变更记录 -->
    <section class="history-card">
      <div class="history-header">
        <div class="history-title">
          <el-icon><Clock /></el-icon>
          <span>配置变更记录</span>
        </div>
        <el-button link type="primary" @click="showAllHistory">
          查看更多
          <el-icon><ArrowRight /></el-icon>
        </el-button>
      </div>

      <el-table :data="historyRows" class="history-table" empty-text="暂无配置变更记录">
        <el-table-column prop="time" label="变更时间" min-width="180" />
        <el-table-column prop="operator" label="变更人" min-width="120" />
        <el-table-column prop="content" label="变更内容" min-width="420" show-overflow-tooltip />
        <el-table-column label="状态" width="130">
          <template #default="{ row }">
            <el-tag :type="row.type" effect="light" size="small" round>
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" align="center">
          <template #default="{ row }">
            <el-button link type="primary" @click="showHistoryDetail(row)">查看详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Aim,
  ArrowRight,
  Box,
  ChatDotSquare,
  CircleCheck,
  Clock,
  InfoFilled,
  Lightning,
  Monitor,
  Refresh,
  Setting,
  DocumentChecked,
} from '@element-plus/icons-vue'
import {
  getAiConfig,
  getAiSupervisorStatus,
  updateAiConfig,
  validateAiConfig
} from '@/api/config'

const modelFormRef = ref()
const loading = ref(false)
const saving = ref(false)
const validating = ref(false)
const apiUrlMasked = ref('')
const lastValidatedAt = ref('')
const connectionState = ref('unknown')

const supervisor = reactive({
  runningTasks: 0,
  maxConcurrent: 5,
  available: true
})

const form = reactive({
  apiUrl: '',
  apiKey: '',
  modelName: '',
  temperature: 0.7,
  maxTokens: 2000,
  timeoutMs: 10000,
  maxConcurrent: 5,
  maxRetry: 2,
  retryIntervalMs: 500,
  nodeOrder: ['CATEGORY', 'RATING', 'PRE_AUDIT'],
  keyConfigured: false
})

const rules = {
  modelName: [{ required: true, message: '请输入模型名称', trigger: 'blur' }],
  temperature: [{ required: true, message: '请设置温度', trigger: 'change' }],
  maxTokens: [{ required: true, message: '请设置最大 Token', trigger: 'change' }],
  timeoutMs: [{ required: true, message: '请设置超时时间', trigger: 'change' }]
}

const historyRows = ref([])

const apiUrlPlaceholder = computed(() => {
  return apiUrlMasked.value ? `当前：${apiUrlMasked.value}，留空不修改` : '例如 https://api.deepseek.com/v1/chat/completions'
})

const connectionStatusText = computed(() => {
  const textMap = {
    unknown: '待验证',
    checking: '验证中',
    success: '连接正常',
    error: '连接失败'
  }
  return textMap[connectionState.value]
})

const connectionStatusDesc = computed(() => {
  if (connectionState.value === 'success') {
    return lastValidatedAt.value ? `最后验证：${lastValidatedAt.value}` : '模型接口可正常访问'
  }
  if (connectionState.value === 'error') return '请检查地址、密钥或网络'
  if (connectionState.value === 'checking') return '正在请求模型服务'
  return '点击下方按钮验证连接'
})

const connectionStatusClass = computed(() => ({
  'summary-value--green': connectionState.value === 'success',
  'summary-value--red': connectionState.value === 'error',
  'summary-value--orange': connectionState.value === 'checking' || connectionState.value === 'unknown'
}))

function normalizeConfig(data = {}) {
  apiUrlMasked.value = data.apiUrl || ''
  // 输入框不回填脱敏 URL，防止再次保存时把 *** 写回 Nacos
  form.apiUrl = ''
  form.apiKey = ''
  form.modelName = data.modelName || ''
  form.temperature = Number(data.temperature ?? 0.7)
  form.maxTokens = Number(data.maxTokens ?? 2000)
  form.timeoutMs = Number(data.timeoutMs ?? 10000)
  form.maxConcurrent = Number(data.maxConcurrent ?? 5)
  form.maxRetry = Number(data.maxRetry ?? 2)
  form.retryIntervalMs = Number(data.retryIntervalMs ?? 500)
  form.nodeOrder = Array.isArray(data.nodeOrder) ? [...data.nodeOrder] : ['CATEGORY', 'RATING', 'PRE_AUDIT']
  form.keyConfigured = Boolean(data.keyConfigured)
  supervisor.maxConcurrent = form.maxConcurrent
}

function formatTime(date = new Date()) {
  const pad = v => String(v).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function buildChangeContent() {
  return `模型 ${form.modelName}，温度 ${form.temperature}，最大 Token ${form.maxTokens}，并发 ${form.maxConcurrent}`
}

async function load() {
  loading.value = true
  try {
    const [configRes, supervisorRes] = await Promise.allSettled([
      getAiConfig(),
      getAiSupervisorStatus()
    ])
    if (configRes.status === 'fulfilled') {
      normalizeConfig(configRes.value.data || {})
    }
    if (supervisorRes.status === 'fulfilled') {
      Object.assign(supervisor, supervisorRes.value.data || {})
    }
    if (!historyRows.value.length && form.modelName) {
      historyRows.value.push({
        time: formatTime(),
        operator: '当前管理员',
        content: `当前生效配置：${buildChangeContent()}`,
        status: '当前生效',
        type: 'success'
      })
    }
  } catch (error) {
    ElMessage.error(error?.message || 'AI 配置加载失败')
  } finally {
    loading.value = false
  }
}

async function validateConnection() {
  validating.value = true
  connectionState.value = 'checking'
  try {
    const response = await validateAiConfig()
    const data = response.data || {}
    connectionState.value = data.valid === false ? 'error' : 'success'
    lastValidatedAt.value = `刚刚 · ${data.elapsedMs ?? '--'} ms`
    if (connectionState.value === 'success') {
      ElMessage.success(`连接有效，耗时 ${data.elapsedMs ?? '--'} ms`)
    } else {
      ElMessage.error('模型返回结果不符合预期')
    }
  } catch (error) {
    connectionState.value = 'error'
    ElMessage.error(error?.message || '模型连接验证失败')
  } finally {
    validating.value = false
  }
}

async function save() {
  if (!modelFormRef.value) return
  await modelFormRef.value.validate()

  if (form.nodeOrder.length !== 3 || new Set(form.nodeOrder).size !== 3) {
    ElMessage.warning('分类、评级、预审三个节点必须各出现一次')
    return
  }

  const confirmed = await ElMessageBox.confirm(
    '保存后配置将发布到 Nacos，并实时影响后续 AI 工单处理。是否继续？',
    '确认保存并热更新',
    { confirmButtonText: '确认更新', cancelButtonText: '取消', type: 'warning' }
  ).catch(() => false)

  if (!confirmed) return

  saving.value = true
  try {
    const payload = {
      modelName: form.modelName,
      temperature: form.temperature,
      maxTokens: form.maxTokens,
      timeoutMs: form.timeoutMs,
      maxConcurrent: form.maxConcurrent,
      maxRetry: form.maxRetry,
      retryIntervalMs: form.retryIntervalMs,
      nodeOrder: [...form.nodeOrder]
    }
    // 空值代表保持服务端原配置，避免把脱敏内容覆盖回 Nacos
    if (form.apiUrl) payload.apiUrl = form.apiUrl
    if (form.apiKey) payload.apiKey = form.apiKey

    const response = await updateAiConfig(payload)
    normalizeConfig(response.data || {})
    historyRows.value.unshift({
      time: formatTime(),
      operator: '当前管理员',
      content: `修改配置：${buildChangeContent()}`,
      status: '更新成功',
      type: 'success'
    })
    historyRows.value = historyRows.value.slice(0, 5)
    connectionState.value = 'unknown'
    ElMessage.success('AI 配置已发布到 Nacos 并完成热更新')
    await loadSupervisorStatus()
  } catch (error) {
    historyRows.value.unshift({
      time: formatTime(),
      operator: '当前管理员',
      content: `尝试修改配置：${buildChangeContent()}`,
      status: '更新失败',
      type: 'danger'
    })
    ElMessage.error(error?.message || 'AI 配置保存失败')
  } finally {
    saving.value = false
  }
}

async function loadSupervisorStatus() {
  try {
    const response = await getAiSupervisorStatus()
    Object.assign(supervisor, response.data || {})
  } catch {
    supervisor.maxConcurrent = form.maxConcurrent
  }
}

function showHistoryDetail(row) {
  ElMessageBox.alert(row.content, '配置详情', { confirmButtonText: '知道了' })
}

function showAllHistory() {
  ElMessage.info('当前版本展示本次页面会话内的最近配置记录')
}

onMounted(load)
</script>

<style lang="scss" scoped>
.ai-config-page {
  min-height: 100%;
  padding: 28px 30px 36px;
  background:
    radial-gradient(circle at 25% 0%, rgba(78, 126, 255, 0.06), transparent 28%),
    #f5f8fc;
  color: #18233a;
}

.page-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 22px;
}

.heading-left,
.title-line {
  display: flex;
  align-items: center;
}

.heading-left { gap: 14px; }

.heading-icon {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  color: #2873f0;
  font-size: 25px;
}

.title-line {
  flex-wrap: wrap;
  gap: 14px;
}

.title-line h1 {
  margin: 0;
  color: #17213a;
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.5px;
}

.heading-tip {
  padding: 6px 12px;
  border-radius: 999px;
  background: #edf4ff;
  color: #5b82cc;
  font-size: 13px;
}

.effective-tag {
  height: 34px;
  padding-inline: 14px;
  font-weight: 600;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;
  margin-bottom: 18px;
}

.summary-card,
.panel-card,
.history-card {
  border: 1px solid #e9eef6;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 8px 24px rgba(39, 69, 114, 0.06);
}

.summary-card {
  display: flex;
  min-height: 110px;
  align-items: center;
  gap: 18px;
  padding: 20px 24px;
  border-radius: 14px;
}

.summary-icon {
  display: grid;
  width: 56px;
  height: 56px;
  flex: 0 0 56px;
  place-items: center;
  border-radius: 50%;
  font-size: 28px;
}

.summary-icon--blue { background: #edf4ff; color: #347bf6; }
.summary-icon--green { background: #eaf9f0; color: #18b566; }
.summary-icon--purple { background: #f4ecff; color: #9149ea; }
.summary-icon--orange { background: #fff4e7; color: #f29a22; }

.summary-content {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 6px;
}

.summary-label {
  color: #344159;
  font-size: 14px;
  font-weight: 600;
}

.summary-value {
  overflow: hidden;
  color: #24304a;
  font-size: 20px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.summary-value--blue { color: #2472ed; }
.summary-value--green { color: #17ad61; }
.summary-value--purple { color: #7444df; }
.summary-value--orange { color: #e98516; }
.summary-value--red { color: #e84955; }

.summary-desc {
  color: #8d9ab0;
  font-size: 13px;
}

.config-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.05fr);
  gap: 18px;
}

.panel-card {
  min-width: 0;
  padding: 24px 24px 20px;
  border-radius: 14px;
}

.panel-heading {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 20px;
}

.panel-heading__icon {
  display: grid;
  width: 28px;
  height: 28px;
  flex: 0 0 28px;
  place-items: center;
  color: #2873f0;
  font-size: 21px;
}

.panel-heading h2 {
  margin: 0 0 3px;
  color: #19233b;
  font-size: 18px;
  font-weight: 700;
}

.panel-heading p {
  margin: 0;
  color: #92a0b5;
  font-size: 13px;
}

.config-form :deep(.el-form-item) { margin-bottom: 18px; }

.config-form :deep(.el-form-item__label) {
  padding-bottom: 8px;
  color: #26334c;
  font-weight: 600;
  line-height: 1.3;
}

.config-form :deep(.el-input__wrapper),
.config-form :deep(.el-select__wrapper),
.config-form :deep(.el-input-number) {
  min-height: 40px;
  border-radius: 7px;
}

.config-form :deep(.el-input-number) { width: 100%; }
.config-form :deep(.el-input-number .el-input__wrapper) { width: 100%; }

.field-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.field-label .el-icon {
  color: #95a2b7;
  font-size: 14px;
}

.field-help {
  width: 100%;
  margin-top: 7px;
  color: #98a6ba;
  font-size: 12px;
  line-height: 1.5;
}

.three-column-form {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
}

.info-strip,
.strategy-box {
  border: 1px solid #bcd3ff;
  background: #f4f8ff;
  color: #3673da;
}

.info-strip {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 13px;
  border-radius: 7px;
  font-size: 13px;
}

.node-select { width: 100%; }

.node-select :deep(.el-tag:nth-child(1)) {
  border-color: #d8e7ff;
  background: #edf4ff;
  color: #2f75e8;
}

.node-select :deep(.el-tag:nth-child(2)) {
  border-color: #d9f1e6;
  background: #ecf9f3;
  color: #20a86b;
}

.node-select :deep(.el-tag:nth-child(3)) {
  border-color: #ffe4c7;
  background: #fff5e9;
  color: #e78419;
}

.tolerance-grid { margin-top: 10px; }

.strategy-box {
  margin-top: 2px;
  padding: 14px 16px;
  border-radius: 8px;
}

.strategy-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-weight: 700;
}

.strategy-box ul {
  margin: 0;
  padding-left: 20px;
  color: #4c74ba;
  font-size: 12px;
  line-height: 1.9;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 22px;
}

.actions :deep(.el-button) {
  min-width: 118px;
  height: 42px;
  border-radius: 8px;
  font-weight: 600;
}

.actions :deep(.el-button--primary) {
  box-shadow: 0 8px 16px rgba(40, 115, 240, 0.22);
}

.history-card {
  margin-top: 18px;
  padding: 14px 18px 12px;
  border-radius: 14px;
}

.history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2px 2px 10px;
}

.history-title {
  display: flex;
  align-items: center;
  gap: 9px;
  color: #202c43;
  font-size: 17px;
  font-weight: 700;
}

.history-title .el-icon { color: #2674ef; }

.history-table :deep(.el-table__header th) {
  background: #f6f8fc;
  color: #536079;
  font-weight: 600;
}

.history-table :deep(.el-table__cell) { padding: 10px 0; }

@media (max-width: 1280px) {
  .summary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .config-grid { grid-template-columns: 1fr; }
}

@media (max-width: 760px) {
  .ai-config-page { padding: 20px 16px 30px; }
  .page-heading, .heading-left, .title-line { align-items: flex-start; }
  .page-heading { flex-direction: column; }
  .summary-grid, .three-column-form { grid-template-columns: 1fr; }
  .summary-card { min-height: auto; }
  .panel-card { padding: 20px 16px; }
  .actions { flex-direction: column; }
  .actions :deep(.el-button) { width: 100%; margin-left: 0; }
}
</style>
