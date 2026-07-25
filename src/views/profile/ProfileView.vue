<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title"><el-icon><User /></el-icon> 个人设置</div>
    </div>

    <el-row :gutter="20">
      <el-col :span="8">
        <!-- 用户信息卡片 -->
        <div class="page-card user-card">
          <div class="avatar-section">
            <div class="avatar">{{ (userStore.realName || userStore.username || '?')[0] }}</div>
            <h3>{{ userStore.realName || userStore.username }}</h3>
            <el-tag :type="roleTagType" effect="dark" size="small">{{ roleLabel }}</el-tag>
          </div>
          <div class="user-meta">
            <div class="meta-item">
              <el-icon><OfficeBuilding /></el-icon>
              <span>部门：{{ deptName }}</span>
            </div>
            <div class="meta-item">
              <el-icon><Phone /></el-icon>
              <span>{{ form.phone || '未设置' }}</span>
            </div>
            <div class="meta-item">
              <el-icon><Message /></el-icon>
              <span>{{ form.email || '未设置' }}</span>
            </div>
          </div>
        </div>
      </el-col>

      <el-col :span="16">
        <!-- 基本信息 -->
        <div class="page-card">
          <div class="section-title"><el-icon><Edit /></el-icon> 基本信息</div>
          <el-form ref="infoFormRef" :model="form" :rules="infoRules" label-width="90px">
            <el-form-item label="账号">
              <el-input :model-value="userStore.username" disabled />
            </el-form-item>
            <el-form-item label="姓名">
              <el-input :model-value="userStore.realName" disabled />
            </el-form-item>
            <el-form-item label="手机号" prop="phone">
              <el-input v-model="form.phone" placeholder="请输入手机号" />
            </el-form-item>
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="form.email" placeholder="请输入邮箱" />
            </el-form-item>
            <el-form-item label="部门">
              <el-input :model-value="deptName" disabled />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="savingInfo" @click="handleSaveInfo">保存信息</el-button>
            </el-form-item>
          </el-form>
        </div>

        <!-- 修改密码 -->
        <div class="page-card" style="margin-top: 20px;">
          <div class="section-title"><el-icon><Lock /></el-icon> 修改密码</div>
          <el-form ref="pwdFormRef" :model="pwdForm" :rules="pwdRules" label-width="90px">
            <el-form-item label="旧密码" prop="oldPassword">
              <el-input v-model="pwdForm.oldPassword" type="password" show-password placeholder="请输入当前密码" />
            </el-form-item>
            <el-form-item label="新密码" prop="newPassword">
              <el-input v-model="pwdForm.newPassword" type="password" show-password placeholder="6-20位字母数字组合" />
            </el-form-item>
            <el-form-item label="确认密码" prop="confirmPassword">
              <el-input v-model="pwdForm.confirmPassword" type="password" show-password placeholder="再次输入新密码" />
            </el-form-item>
            <el-form-item>
              <el-button type="warning" :loading="savingPwd" @click="handleChangePwd">修改密码</el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { User, OfficeBuilding, Phone, Message, Edit, Lock } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'
import { updateProfile, changePassword } from '@/api/user'
import { DEPT_MAP } from '@/utils/constants'

const userStore = useUserStore()
const infoFormRef = ref()
const pwdFormRef = ref()
const savingInfo = ref(false)
const savingPwd = ref(false)

const form = reactive({ phone: '', email: '' })
const pwdForm = reactive({ oldPassword: '', newPassword: '', confirmPassword: '' })

const ROLE_MAP = { ADMIN: '管理员', APPROVER: '审批人', SUBMITTER: '提交人' }
const roleLabel = computed(() => ROLE_MAP[userStore.role] || userStore.role)
const roleTagType = computed(() => {
  const map = { ADMIN: 'danger', APPROVER: 'warning', SUBMITTER: '' }
  return map[userStore.role] || 'info'
})
const deptName = computed(() => DEPT_MAP[userStore.deptCode] || userStore.deptCode || '未分配')

const infoRules = {
  phone: [{ pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }],
  email: [{ type: 'email', message: '邮箱格式不正确', trigger: 'blur' }]
}

const validateConfirm = (rule, value, callback) => {
  if (value !== pwdForm.newPassword) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const pwdRules = {
  oldPassword: [{ required: true, message: '请输入旧密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度6-20位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    { validator: validateConfirm, trigger: 'blur' }
  ]
}

onMounted(() => {
  form.phone = userStore.phone || ''
  form.email = userStore.email || ''
})

async function handleSaveInfo() {
  const valid = await infoFormRef.value.validate().catch(() => false)
  if (!valid) return
  savingInfo.value = true
  try {
    await updateProfile({ phone: form.phone, email: form.email })
    userStore.phone = form.phone
    userStore.email = form.email
    ElMessage.success('信息保存成功')
  } catch {} finally {
    savingInfo.value = false
  }
}

async function handleChangePwd() {
  const valid = await pwdFormRef.value.validate().catch(() => false)
  if (!valid) return
  savingPwd.value = true
  try {
    await changePassword({ oldPassword: pwdForm.oldPassword, newPassword: pwdForm.newPassword })
    ElMessage.success('密码修改成功，请重新登录')
    pwdForm.oldPassword = ''
    pwdForm.newPassword = ''
    pwdForm.confirmPassword = ''
  } catch {} finally {
    savingPwd.value = false
  }
}
</script>

<style lang="scss" scoped>
.user-card {
  text-align: center;

  .avatar-section {
    padding: 20px 0;
    border-bottom: 1px solid #f1f5f9;
    margin-bottom: 20px;

    .avatar {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: linear-gradient(135deg, #4f6ef7, #7c3aed);
      color: #fff;
      font-size: 28px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 12px;
    }

    h3 {
      font-size: 18px;
      color: #1e293b;
      margin-bottom: 8px;
    }
  }

  .user-meta {
    display: flex;
    flex-direction: column;
    gap: 12px;
    text-align: left;

    .meta-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: #64748b;

      .el-icon { color: #4f6ef7; }
    }
  }
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 8px;

  .el-icon { color: #4f6ef7; }
}
</style>
