<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title"><el-icon><Plus /></el-icon> 新建工单</div>
    </div>

    <div class="page-card create-card">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" size="large">
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="工单标题" prop="title">
              <el-input v-model="form.title" placeholder="请简要描述问题或需求" maxlength="100" show-word-limit />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="工单类型" prop="type">
              <el-select v-model="form.type" placeholder="请选择工单类型" style="width: 100%">
                <el-option v-for="(v, k) in ORDER_TYPE" :key="k" :label="v.label" :value="k" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="所属部门" prop="departmentCode">
              <el-select v-model="form.departmentCode" placeholder="请选择部门" style="width: 100%">
                <el-option v-for="d in deptOptions" :key="d.deptCode" :label="d.deptName" :value="d.deptCode" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="紧急程度">
              <div class="urgent-switch">
                <el-switch v-model="form.urgent" active-text="紧急" inactive-text="普通"
                           active-color="#ef4444" />
                <span class="urgent-hint" v-if="form.urgent">紧急工单将优先审批，60分钟超时督办</span>
              </div>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="详细描述" prop="detail">
          <el-input v-model="form.detail" type="textarea" :rows="5"
                    placeholder="请详细描述问题现象、影响范围、期望解决时间等信息" maxlength="2000" show-word-limit />
        </el-form-item>

        <el-form-item label="附件上传">
          <el-upload
            action="/api/v1/workorder/attachment/upload"
            :headers="uploadHeaders"
            :on-success="handleUploadSuccess"
            :on-remove="handleRemove"
            :file-list="fileList"
            :limit="5"
            drag
          >
            <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
            <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
            <template #tip>
              <div class="el-upload__tip">支持 jpg/png/pdf/doc 格式，单个文件不超过 10MB，最多5个</div>
            </template>
          </el-upload>
        </el-form-item>

        <el-form-item>
          <div class="submit-area">
            <el-button type="primary" size="large" :loading="submitting" @click="handleSubmit">
              <el-icon><Promotion /></el-icon> 提交工单
            </el-button>
            <el-button size="large" @click="handleReset">重置</el-button>
          </div>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Plus, UploadFilled, Promotion } from '@element-plus/icons-vue'
import { ORDER_TYPE } from '@/utils/constants'
import { submitWorkOrder } from '@/api/workOrder'
import { getDeptList } from '@/api/user'
import { getSessionId } from '@/utils/auth'

const router = useRouter()
const formRef = ref()
const submitting = ref(false)
const fileList = ref([])
const attachments = ref([])
const deptOptions = ref([])

// 部门下拉动态获取（SRS 场景二：关联部门下拉列表从 user-service 获取）
onMounted(async () => {
  try {
    const res = await getDeptList()
    deptOptions.value = (res.data || []).filter(d => d.status !== 'DISABLED')
  } catch {}
})

const uploadHeaders = computed(() => ({
  'X-Session-Id': getSessionId()
}))

const form = reactive({
  title: '',
  type: '',
  departmentCode: '',
  detail: '',
  urgent: false
})

const rules = {
  title: [{ required: true, message: '请输入工单标题', trigger: 'blur' }],
  type: [{ required: true, message: '请选择工单类型', trigger: 'change' }],
  departmentCode: [{ required: true, message: '请选择所属部门', trigger: 'change' }],
  detail: [{ required: true, message: '请输入详细描述', trigger: 'blur' }]
}

function handleUploadSuccess(res, file) {
  if (res.code === 200 && res.data?.url) {
    attachments.value.push({ fileName: file.name, fileUrl: res.data.url })
  }
}

function handleRemove(file) {
  const idx = attachments.value.findIndex(a => a.fileName === file.name)
  if (idx > -1) attachments.value.splice(idx, 1)
}

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    await submitWorkOrder({
      ...form,
      priority: form.urgent ? 'URGENT' : 'NORMAL',
      attachments: attachments.value
    })
    ElMessage.success('工单提交成功，AI 正在智能分析中...')
    router.push('/workorder/my')
  } catch {
    // 错误已在拦截器处理
  } finally {
    submitting.value = false
  }
}

function handleReset() {
  formRef.value?.resetFields()
  form.urgent = false
  fileList.value = []
  attachments.value = []
}
</script>

<style lang="scss" scoped>
.create-card {
  max-width: 900px;
}

.urgent-switch {
  display: flex;
  align-items: center;
  gap: $space-3;

  .urgent-hint {
    font-size: $text-sm;
    color: $danger;
  }
}

.submit-area {
  display: flex;
  gap: $space-3;
}

:deep(.el-upload-dragger) {
  padding: $space-6;
  border-radius: $radius-md;
}

:deep(.el-upload) {
  width: 100%;
}

:deep(.el-upload-dragger) {
  width: 100%;
}
</style>
