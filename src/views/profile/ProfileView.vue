<template>
  <div class="profile-page">
    <!-- 顶部个人信息横幅 -->
    <div class="profile-banner">
      <div class="banner-bg"></div>
      <div class="banner-content">
        <div class="avatar-wrapper">
          <el-avatar v-if="userStore.avatarUrl" :src="userStore.avatarUrl" :size="72" class="avatar-img" />
          <div v-else class="avatar">{{ avatarChar }}</div>
          <div class="avatar-upload-btn" @click="triggerUpload">
            <el-icon><Camera /></el-icon>
          </div>
          <input ref="fileInputRef" type="file" accept=".jpg,.jpeg,.png,.gif,.webp" class="upload-input" @change="handleAvatarChange" />
        </div>
        <div class="banner-info">
          <div class="banner-name">
            {{ userStore.realName || userStore.username }}
            <el-tag :type="roleTagType" effect="dark" size="small" round>{{ roleLabel }}</el-tag>
          </div>
          <div class="banner-meta">
            <span><el-icon><OfficeBuilding /></el-icon>{{ deptName }}</span>
            <span><el-icon><Phone /></el-icon>{{ form.phone || '未设置' }}</span>
            <span><el-icon><Message /></el-icon>{{ form.email || '未设置' }}</span>
          </div>
        </div>
      </div>
    </div>

    <el-row :gutter="20" class="profile-body">
      <!-- 基本信息 -->
      <el-col :span="12">
        <div class="profile-card">
          <div class="card-header">
            <el-icon><Edit /></el-icon>
            <span>基本信息</span>
          </div>
          <el-form ref="infoFormRef" :model="form" :rules="infoRules" label-position="top">
            <el-form-item label="账号">
              <el-input :model-value="userStore.username" disabled />
            </el-form-item>
            <el-form-item label="姓名">
              <el-input :model-value="userStore.realName" disabled />
            </el-form-item>
            <el-form-item label="手机号" prop="phone">
              <el-input v-model="form.phone" placeholder="请输入手机号" clearable />
            </el-form-item>
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="form.email" placeholder="请输入邮箱" clearable />
            </el-form-item>
            <el-form-item label="部门">
              <el-input :model-value="deptName" disabled />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="savingInfo" @click="handleSaveInfo">保存信息</el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-col>

      <!-- 修改密码 -->
      <el-col :span="12">
        <div class="profile-card">
          <div class="card-header">
            <el-icon><Lock /></el-icon>
            <span>修改密码</span>
          </div>
          <el-form ref="pwdFormRef" :model="pwdForm" :rules="pwdRules" label-position="top">
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
          <div class="pwd-tips">
            <el-icon><InfoFilled /></el-icon>
            修改成功后需重新登录，密码请使用6-20位字母数字组合
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { OfficeBuilding, Phone, Message, Edit, Lock, InfoFilled, Camera } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'
import { updateProfile, changePassword, uploadAvatar } from '@/api/user'
import { DEPT_MAP } from '@/utils/constants'

const userStore = useUserStore()
const infoFormRef = ref()
const pwdFormRef = ref()
const savingInfo = ref(false)
const savingPwd = ref(false)

const form = reactive({ phone: '', email: '' })
const pwdForm = reactive({ oldPassword: '', newPassword: '', confirmPassword: '' })
const fileInputRef = ref()
const uploading = ref(false)

const ROLE_MAP = { ADMIN: '管理员', APPROVER: '审批人', EMPLOYEE: '员工' }
const roleLabel = computed(() => ROLE_MAP[userStore.role] || userStore.role)
const roleTagType = computed(() => {
  const map = { ADMIN: 'danger', APPROVER: 'warning', EMPLOYEE: '' }
  return map[userStore.role] || 'info'
})
const deptName = computed(() => DEPT_MAP[userStore.deptCode] || userStore.deptCode || '未分配')
const avatarChar = computed(() => (userStore.realName || userStore.username || '?')[0])

const infoRules = {
  phone: [{ pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }],
  email: [{ type: 'email', message: '邮箱格式不正确', trigger: 'blur' }]
}

const validateNewPwd = (rule, value, callback) => {
  if (value && (value.length < 6 || value.length > 20)) {
    callback(new Error('密码长度6-20位'))
  } else {
    callback()
  }
}

const validateConfirm = (rule, value, callback) => {
  if (value && value !== pwdForm.newPassword) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const pwdRules = {
  newPassword: [{ validator: validateNewPwd, trigger: 'blur' }],
  confirmPassword: [{ validator: validateConfirm, trigger: 'blur' }]
}

onMounted(() => {
  form.phone = userStore.phone || ''
  form.email = userStore.email || ''
})

function triggerUpload() {
  fileInputRef.value?.click()
}

async function handleAvatarChange(e) {
  const file = e.target.files?.[0]
  if (!file) return
  if (file.size > 2 * 1024 * 1024) {
    ElMessage.warning('头像文件不能超过 2MB')
    e.target.value = ''
    return
  }
  uploading.value = true
  try {
    const formData = new FormData()
    formData.append('file', file)
    const res = await uploadAvatar(formData)
    userStore.avatarUrl = res.data?.url || ''
    ElMessage.success('头像更新成功')
  } catch {} finally {
    uploading.value = false
    e.target.value = ''
  }
}

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
  if (!pwdForm.oldPassword || !pwdForm.newPassword || !pwdForm.confirmPassword) {
    ElMessage.warning('请填写完整的密码信息')
    return
  }
  const valid = await pwdFormRef.value.validate().catch(() => false)
  if (!valid) return
  savingPwd.value = true
  try {
    await changePassword({ oldPassword: pwdForm.oldPassword, newPassword: pwdForm.newPassword })
    ElMessage.success('密码修改成功，请重新登录')
    pwdForm.oldPassword = ''
    pwdForm.newPassword = ''
    pwdForm.confirmPassword = ''
    pwdFormRef.value.clearValidate()
  } catch {} finally {
    savingPwd.value = false
  }
}
</script>

<style lang="scss" scoped>
.profile-page {
  padding: 0;
}

.profile-banner {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 20px;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);

  .banner-bg {
    height: 88px;
    background: linear-gradient(135deg, #4f6ef7 0%, #7c3aed 100%);
  }

  .banner-content {
    display: flex;
    align-items: flex-end;
    gap: 20px;
    padding: 0 28px 20px;
    margin-top: -36px;
    position: relative;

    .avatar-wrapper {
      position: relative;
      flex-shrink: 0;

      .avatar-img {
        border: 3px solid #fff;
        box-shadow: 0 2px 8px rgba(79, 110, 247, 0.3);
      }

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
        border: 3px solid #fff;
        box-shadow: 0 2px 8px rgba(79, 110, 247, 0.3);
      }

      .avatar-upload-btn {
        position: absolute;
        right: 0;
        bottom: 2px;
        width: 26px;
        height: 26px;
        border-radius: 50%;
        background: #4f6ef7;
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        cursor: pointer;
        border: 2px solid #fff;
        transition: background 0.2s;

        &:hover {
          background: #3b5de7;
        }
      }

      .upload-input {
        display: none;
      }
    }

    .banner-info {
      padding-bottom: 4px;

      .banner-name {
        font-size: 20px;
        font-weight: 700;
        color: #1e293b;
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 8px;
      }

      .banner-meta {
        display: flex;
        gap: 24px;
        font-size: 13px;
        color: #64748b;

        span {
          display: flex;
          align-items: center;
          gap: 5px;

          .el-icon {
            color: #4f6ef7;
            font-size: 14px;
          }
        }
      }
    }
  }
}

.profile-body {
  .profile-card {
    background: #fff;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
    min-height: 420px;

    .card-header {
      font-size: 15px;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 24px;
      display: flex;
      align-items: center;
      gap: 8px;
      padding-bottom: 14px;
      border-bottom: 1px solid #f1f5f9;

      .el-icon {
        color: #4f6ef7;
        font-size: 17px;
      }
    }

    .pwd-tips {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #94a3b8;
      margin-top: 4px;

      .el-icon {
        font-size: 14px;
      }
    }
  }
}
</style>
