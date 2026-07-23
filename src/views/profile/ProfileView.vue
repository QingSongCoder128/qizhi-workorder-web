<template>
  <div class="page-container">
    <div class="page-card" style="max-width: 600px;">
      <h3 style="margin-bottom: 24px;">个人设置</h3>
      <el-form :model="form" label-width="90px">
        <el-form-item label="账号">
          <el-input v-model="form.username" disabled />
        </el-form-item>
        <el-form-item label="姓名">
          <el-input v-model="form.realName" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="form.phone" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="form.email" />
        </el-form-item>
        <el-divider>修改密码（选填）</el-divider>
        <el-form-item label="旧密码">
          <el-input v-model="form.oldPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="新密码">
          <el-input v-model="form.newPassword" type="password" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSave" :loading="saving">保存修改</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getCurrentUser, updateProfile } from '@/api/user'

const saving = ref(false)
const form = reactive({ username: '', realName: '', phone: '', email: '', oldPassword: '', newPassword: '' })

onMounted(async () => {
  try {
    const res = await getCurrentUser()
    Object.assign(form, res.data || {})
  } catch {}
})

async function handleSave() {
  saving.value = true
  try {
    const payload = { realName: form.realName, phone: form.phone, email: form.email }
    if (form.oldPassword && form.newPassword) {
      payload.oldPassword = form.oldPassword
      payload.newPassword = form.newPassword
    }
    await updateProfile(payload)
    ElMessage.success('保存成功')
  } catch {} finally { saving.value = false }
}
</script>
