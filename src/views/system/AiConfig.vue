<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <div class="page-title"><el-icon><Cpu /></el-icon> AI 配置</div>
        <div class="page-desc">运行参数来自 Nacos，保存后实时生效；API Key 永不回显。</div>
      </div>
      <el-tag :type="form.keyConfigured ? 'success' : 'danger'">
        {{ form.keyConfigured ? '密钥已配置' : '密钥未配置' }}
      </el-tag>
    </div>
    <div class="config-grid">
      <section class="page-card">
        <h3>模型连接</h3>
        <el-form v-loading="loading" label-position="top">
          <el-form-item label="API 地址（脱敏展示）">
            <el-input v-model="form.apiUrl" placeholder="保留为空表示不修改现有地址" />
          </el-form-item>
          <el-form-item label="API Key">
            <el-input
              v-model="form.apiKey"
              type="password"
              show-password
              placeholder="留空保持现有 Key，不会从服务端回显"
            />
          </el-form-item>
          <el-form-item label="模型">
            <el-input v-model="form.modelName" />
          </el-form-item>
          <div class="form-row">
            <el-form-item label="温度"><el-input-number v-model="form.temperature" :min="0" :max="2" :step="0.1" /></el-form-item>
            <el-form-item label="最大 Token"><el-input-number v-model="form.maxTokens" :min="128" :max="32768" /></el-form-item>
            <el-form-item label="超时（ms）"><el-input-number v-model="form.timeoutMs" :min="1000" :step="1000" /></el-form-item>
          </div>
        </el-form>
      </section>
      <section class="page-card">
        <h3>Graph 与容错</h3>
        <el-form label-position="top">
          <el-form-item label="节点顺序">
            <el-select v-model="form.nodeOrder" multiple style="width:100%">
              <el-option label="分类 CATEGORY" value="CATEGORY" />
              <el-option label="评级 RATING" value="RATING" />
              <el-option label="预审 PRE_AUDIT" value="PRE_AUDIT" />
            </el-select>
            <div class="hint">三个节点必须各出现一次，顺序即实际执行顺序。</div>
          </el-form-item>
          <div class="form-row">
            <el-form-item label="最大并发"><el-input-number v-model="form.maxConcurrent" :min="1" /></el-form-item>
            <el-form-item label="重试次数"><el-input-number v-model="form.maxRetry" :min="0" :max="10" /></el-form-item>
            <el-form-item label="重试间隔（ms）"><el-input-number v-model="form.retryIntervalMs" :min="0" :step="100" /></el-form-item>
          </div>
          <div class="actions">
            <el-button :loading="validating" @click="validateConnection">验证连接</el-button>
            <el-button type="primary" :loading="saving" @click="save">保存并热更新</el-button>
          </div>
        </el-form>
      </section>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Cpu } from '@element-plus/icons-vue'
import { getAiConfig, updateAiConfig, validateAiConfig } from '@/api/config'
const loading = ref(false), saving = ref(false), validating = ref(false)
const form = reactive({ apiUrl:'', apiKey:'', modelName:'', temperature:0.2, maxTokens:2048,
  timeoutMs:30000, maxConcurrent:5, maxRetry:2, retryIntervalMs:500,
  nodeOrder:['CATEGORY','RATING','PRE_AUDIT'], keyConfigured:false })
async function load(){ loading.value=true; try { const r=await getAiConfig(); Object.assign(form,r.data,{apiKey:''}) } finally { loading.value=false } }
async function save(){ saving.value=true; try { await updateAiConfig({...form}); ElMessage.success('AI 配置已发布并热更新'); await load() } finally { saving.value=false } }
async function validateConnection(){ validating.value=true; try { const r=await validateAiConfig(); ElMessage.success(`连接有效，耗时 ${r.data.elapsedMs} ms`) } finally { validating.value=false } }
onMounted(load)
</script>

<style lang="scss" scoped>
.config-grid{display:grid;grid-template-columns:1fr 1fr;gap:$space-5}.page-card h3{margin-bottom:$space-5;font-size:$text-lg}.form-row{display:grid;grid-template-columns:repeat(3,1fr);gap:$space-4}.hint{font-size:$text-sm;color:$text-muted;margin-top:$space-2}.actions{display:flex;justify-content:flex-end;gap:$space-2;margin-top:$space-6}@media(max-width:1000px){.config-grid{grid-template-columns:1fr}.form-row{grid-template-columns:1fr}}
</style>
