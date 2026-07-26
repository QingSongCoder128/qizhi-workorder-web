<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <div class="page-title"><el-icon><Timer /></el-icon> 限流配置</div>
        <div class="page-desc">实时调整用户、来源 IP 与工单提交接口的每秒请求上限。</div>
      </div>
      <el-tag type="success">Gateway 实时参数</el-tag>
    </div>
    <div class="metric-grid">
      <div v-for="item in metrics" :key="item.key" class="metric-card">
        <span>{{ item.label }}</span>
        <strong>{{ form[item.key] }}</strong>
        <small>次 / 秒</small>
      </div>
    </div>
    <div class="page-card">
      <el-form v-loading="loading" label-position="top">
        <div class="limit-row">
          <el-form-item label="单用户 QPS"><el-input-number v-model="form.userQps" :min="1" /></el-form-item>
          <el-form-item label="单 IP QPS"><el-input-number v-model="form.ipQps" :min="1" /></el-form-item>
          <el-form-item label="工单提交 QPS"><el-input-number v-model="form.submitQps" :min="1" /></el-form-item>
        </div>
        <el-divider />
        <el-form-item label="白名单用户">
          <el-select v-model="form.whiteUsers" multiple allow-create filterable style="width:100%" placeholder="输入用户 ID 后回车" />
        </el-form-item>
        <el-form-item label="白名单 IP">
          <el-select v-model="form.whiteIps" multiple allow-create filterable style="width:100%" placeholder="输入 IP 后回车" />
        </el-form-item>
        <div class="actions"><el-button type="primary" :loading="saving" @click="save">保存并立即生效</el-button></div>
      </el-form>
    </div>
  </div>
</template>
<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import { Timer } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getRateLimitConfig, updateRateLimitConfig } from '@/api/config'
const loading=ref(false), saving=ref(false)
const form=reactive({userQps:20,ipQps:50,submitQps:5,whiteUsers:[],whiteIps:[]})
const metrics=computed(()=>[{key:'userQps',label:'用户访问上限'},{key:'ipQps',label:'IP 访问上限'},{key:'submitQps',label:'提交保护上限'}])
async function load(){loading.value=true;try{Object.assign(form,(await getRateLimitConfig()).data)}finally{loading.value=false}}
async function save(){saving.value=true;try{Object.assign(form,(await updateRateLimitConfig(form)).data);ElMessage.success('限流配置已实时生效')}finally{saving.value=false}}
onMounted(load)
</script>
<style lang="scss" scoped>
.metric-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:$space-4;margin-bottom:$space-5}.metric-card{background:$bg-card;border:1px solid $border-light;border-radius:$radius-lg;padding:$space-5;display:grid;gap:$space-2}.metric-card span,.metric-card small{color:$text-muted}.metric-card strong{font-size:32px;color:$brand}.limit-row{display:grid;grid-template-columns:repeat(3,1fr);gap:$space-6}.actions{display:flex;justify-content:flex-end}@media(max-width:800px){.metric-grid,.limit-row{grid-template-columns:1fr}}
</style>
