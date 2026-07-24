<template>
  <div class="page-container">
    <div class="page-card">
      <h3 class="page-title">新建工单</h3>

      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" style="max-width: 700px;">
        <el-form-item label="工单类型" prop="type">
          <el-select v-model="form.type" placeholder="请选择工单类型" style="width: 100%;">
            <el-option v-for="(v, k) in ORDER_TYPE" :key="k" :label="v.label" :value="k" />
          </el-select>
        </el-form-item>

        <el-form-item label="关联部门" prop="departmentCode">
          <el-select v-model="form.departmentCode" placeholder="请选择关联部门" style="width: 100%;">
            <el-option v-for="d in deptList" :key="d.deptCode" :label="d.deptName" :value="d.deptCode" />
          </el-select>
        </el-form-item>

        <el-form-item label="工单标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入标题（100字以内）" maxlength="100" show-word-limit />
        </el-form-item>

        <el-form-item label="详情描述" prop="detail">
          <el-input v-model="form.detail" type="textarea" :rows="5" placeholder="请详细描述您的需求（2000字以内）" maxlength="2000" show-word-limit />
        </el-form-item>

        <el-form-item label="紧急标记">
          <el-switch v-model="form.urgent" active-text="紧急" inactive-text="普通" />
        </el-form-item>

        <el-form-item label="附件上传">
          <FileUpload v-model="form.attachments" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="submitting" @click="handleSubmit">提交工单</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ORDER_TYPE } from '@/utils/constants'
import { submitWorkOrder } from '@/api/workOrder'
import { getDeptList } from '@/api/user'
import FileUpload from '@/components/FileUpload.vue'

const router = useRouter()
const formRef = ref()
const submitting = ref(false)
const deptList = ref([])

const form = reactive({
  type: '',
  departmentCode: '',
  title: '',
  detail: '',
  urgent: false,
  attachments: []
})

const rules = {
  type: [{ required: true, message: '请选择工单类型', trigger: 'change' }],
  departmentCode: [{ required: true, message: '请选择关联部门', trigger: 'change' }],
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  detail: [{ required: true, message: '请输入详情描述', trigger: 'blur' }]
}

onMounted(async () => {
  try {
    const res = await getDeptList()
    deptList.value = res.data || []
  } catch {}
})

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    await submitWorkOrder(form)
    ElMessage.success('工单提交成功')
    router.push('/workorder/my')
  } catch {} finally {
    submitting.value = false
  }
}

function handleReset() {
  formRef.value.resetFields()
  form.attachments = []
}
</script>

<style scoped>
.page-title {
  margin-bottom: 24px;
  font-size: 18px;
}
</style>
