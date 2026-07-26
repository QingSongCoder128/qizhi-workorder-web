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
import { updateProfile, changePassword, uploadAvatar, getDeptList } from '@/api/user'

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
const deptOptions = ref([])
const deptName = computed(() => {
  const d = deptOptions.value.find(x => x.deptCode === userStore.deptCode)
  return d ? d.deptName : (userStore.deptCode || '未分配')
})
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

onMounted(async () => {
  form.phone = userStore.phone || ''
  form.email = userStore.email || ''
  try {
    const res = await getDeptList()
    deptOptions.value = res.data || []
  } catch {}
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
  border-radius: $radius-lg;
  overflow: hidden;
  margin-bottom: $space-5;
  background: $bg-card;
  border: 1px solid $border-light;
  box-shadow: $shadow-xs;

  .banner-bg {
    height: 118px;
    background: linear-gradient(115deg, #1e3a8a 0%, #2563eb 58%, #3b82f6 100%);
    position: relative;

    // 点阵纹理，增加质感
    &::before {
      content: '';
      position: absolute;
      inset: 0;
      background-image: radial-gradient(rgba(255, 255, 255, 0.14) 1px, transparent 1px);
      background-size: 18px 18px;
      opacity: 0.5;
    }

    // 柔和光晕
    &::after {
      content: '';
      position: absolute;
      width: 320px;
      height: 320px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(255, 255, 255, 0.12) 0%, transparent 68%);
      right: -60px;
      top: -140px;
    }
  }

  .banner-content {
    display: flex;
    align-items: flex-end;
    gap: $space-5;
    padding: 0 $space-7 $space-5;
    margin-top: -40px;
    position: relative;
    z-index: 1;

    .avatar-wrapper {
      position: relative;
      flex-shrink: 0;

      .avatar-img {
        border: 4px solid $bg-card;
        box-shadow: $shadow-md;
      }

      .avatar {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        background: linear-gradient(135deg, $brand, #3b82f6);
        color: #fff;
        font-size: 30px;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 4px solid $bg-card;
        box-shadow: $shadow-md;
      }

      .avatar-upload-btn {
        position: absolute;
        right: 2px;
        bottom: 4px;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: $brand;
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: $text-base;
        cursor: pointer;
        border: 2px solid $bg-card;
        transition: all $duration-fast $ease-in-out;

        &:hover {
          background: $brand-hover;
          transform: scale(1.08);
        }
      }

      .upload-input {
        display: none;
      }
    }

    .banner-info {
      padding-bottom: $space-1;

      .banner-name {
        font-size: $text-xl;
        font-weight: 700;
        color: $text-primary;
        display: flex;
        align-items: center;
        gap: $space-3;
        margin-bottom: $space-2;
        letter-spacing: -0.01em;
      }

      .banner-meta {
        display: flex;
        gap: $space-6;
        font-size: $text-base;
        color: $text-secondary;
        flex-wrap: wrap;

        span {
          display: flex;
          align-items: center;
          gap: 5px;

          .el-icon {
            color: $brand;
            font-size: 14px;
          }
        }
      }
    }
  }
}

.profile-body {
  .profile-card {
    background: $bg-card;
    border-radius: $radius-lg;
    padding: $space-6;
    border: 1px solid $border-light;
    min-height: 420px;

    .card-header {
      font-size: $text-md;
      font-weight: 600;
      color: $text-primary;
      margin-bottom: $space-6;
      display: flex;
      align-items: center;
      gap: $space-2;
      padding-bottom: $space-3;
      border-bottom: 1px solid $border-light;

      .el-icon {
        color: $brand;
        font-size: 17px;
      }
    }

    .pwd-tips {
      display: flex;
      align-items: center;
      gap: $space-2;
      font-size: $text-xs;
      color: $text-muted;
      margin-top: $space-1;

      .el-icon {
        font-size: 14px;
      }
    }
  }
}
</style>
