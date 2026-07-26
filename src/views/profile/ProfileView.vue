<template>
  <div class="profile-page">
    <!-- 顶部个人信息横幅 -->
    <section class="profile-hero">
      <div class="dot-pattern" aria-hidden="true"></div>
      <img class="hero-decoration" :src="decorationImage" alt="" aria-hidden="true" />

      <div class="profile-identity">
        <div class="avatar-wrap">
          <el-avatar v-if="userStore.avatarUrl" :src="userStore.avatarUrl" :size="118" class="avatar-img" />
          <div v-else class="avatar-fallback">{{ avatarChar }}</div>
          <div class="avatar-edit" title="更换头像" @click="triggerUpload">
            <el-icon><CameraFilled /></el-icon>
          </div>
          <input ref="fileInputRef" type="file" accept=".jpg,.jpeg,.png,.gif,.webp" class="upload-input" @change="handleAvatarChange" />
        </div>

        <div class="identity-content">
          <div class="identity-title-row">
            <h1>{{ userStore.realName || userStore.username }}</h1>
            <span class="role-badge">{{ roleLabel }}</span>
          </div>
          <div class="identity-meta">
            <span><el-icon><OfficeBuilding /></el-icon>{{ deptName }}</span>
            <i></i>
            <span><el-icon><Phone /></el-icon>{{ form.phone || '未设置' }}</span>
            <i></i>
            <span><el-icon><Message /></el-icon>{{ form.email || '未设置' }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 双栏表单 -->
    <section class="form-grid">
      <!-- 基本信息 -->
      <article class="content-card">
        <div class="card-heading">
          <span class="heading-icon"><el-icon><UserFilled /></el-icon></span>
          <div>
            <h2>基本信息</h2>
            <p>管理您的个人资料和联系方式</p>
          </div>
        </div>

        <el-form ref="infoFormRef" class="profile-form" :model="form" :rules="infoRules" label-position="left" label-width="82px">
          <el-form-item label="账号">
            <el-input :model-value="userStore.username" disabled>
              <template #suffix><el-icon><Lock /></el-icon></template>
            </el-input>
          </el-form-item>
          <el-form-item label="姓名" prop="realName">
            <el-input v-model="form.realName" placeholder="请输入姓名" maxlength="20" clearable />
          </el-form-item>
          <el-form-item label="手机号码" prop="phone">
            <el-input v-model="form.phone" placeholder="请输入手机号" maxlength="11" clearable />
          </el-form-item>
          <el-form-item label="邮箱" prop="email">
            <el-input v-model="form.email" placeholder="请输入邮箱" maxlength="80" clearable />
          </el-form-item>
          <el-form-item label="部门">
            <el-input :model-value="deptName" disabled>
              <template #suffix><el-icon><Lock /></el-icon></template>
            </el-input>
          </el-form-item>
        </el-form>

        <div class="form-actions info-actions">
          <el-button type="primary" class="primary-action" :loading="savingInfo" @click="handleSaveInfo">
            <el-icon><DocumentChecked /></el-icon>
            保存信息
          </el-button>
          <span class="action-note"><el-icon><CircleCheck /></el-icon>保存后，您的个人信息将会即时更新</span>
        </div>
      </article>

      <!-- 账号安全 -->
      <article class="content-card">
        <div class="card-heading">
          <span class="heading-icon"><el-icon><Key /></el-icon></span>
          <div>
            <h2>账号安全</h2>
            <p>定期修改密码可以保障您的账号安全</p>
          </div>
        </div>

        <div class="password-title">修改密码</div>
        <el-form ref="pwdFormRef" class="password-form" :model="pwdForm" :rules="pwdRules" label-position="top">
          <el-form-item label="旧密码" prop="oldPassword">
            <el-input v-model="pwdForm.oldPassword" type="password" show-password placeholder="请输入当前密码" />
          </el-form-item>
          <el-form-item label="新密码" prop="newPassword">
            <el-input v-model="pwdForm.newPassword" type="password" show-password placeholder="6-20位字母数字组合" />
          </el-form-item>
          <el-form-item label="确认密码" prop="confirmPassword">
            <el-input v-model="pwdForm.confirmPassword" type="password" show-password placeholder="再次输入新密码" />
          </el-form-item>
        </el-form>

        <div class="form-actions password-actions">
          <el-button type="primary" class="primary-action" :loading="savingPwd" @click="handleChangePwd">
            <el-icon><Lock /></el-icon>
            修改密码
          </el-button>
          <span class="security-note"><el-icon><InfoFilled /></el-icon>修改成功后需重新登录，密码请使用6-20位字母数字组合</span>
        </div>
      </article>
    </section>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  OfficeBuilding, Phone, Message, Lock, InfoFilled, CameraFilled,
  UserFilled, Key, DocumentChecked, CircleCheck
} from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'
import { updateProfile, changePassword, uploadAvatar, getDeptList } from '@/api/user'
import decorationImage from '@/assets/profile-decoration.png'

const userStore = useUserStore()
const infoFormRef = ref()
const pwdFormRef = ref()
const savingInfo = ref(false)
const savingPwd = ref(false)

const form = reactive({ realName: '', phone: '', email: '' })
const pwdForm = reactive({ oldPassword: '', newPassword: '', confirmPassword: '' })
const fileInputRef = ref()
const uploading = ref(false)

const ROLE_MAP = { ADMIN: '管理员', APPROVER: '审批人', EMPLOYEE: '员工' }
const roleLabel = computed(() => ROLE_MAP[userStore.role] || userStore.role)
const deptOptions = ref([])
const deptName = computed(() => {
  const d = deptOptions.value.find(x => x.deptCode === userStore.deptCode)
  return d ? d.deptName : (userStore.deptCode || '未分配')
})
const avatarChar = computed(() => (userStore.realName || userStore.username || '?')[0])

// 校验仅在点击保存按钮时触发，不在 blur/change 时自动报红
const infoRules = {
  realName: [{ required: true, message: '请输入姓名', trigger: 'submit' }],
  phone: [
    { required: true, message: '请输入手机号码', trigger: 'submit' },
    { pattern: /^1\d{10}$/, message: '请输入正确的手机号码', trigger: 'submit' }
  ],
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'submit' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'submit' }
  ]
}

const validateConfirm = (rule, value, callback) => {
  if (!value) return callback(new Error('请再次输入新密码'))
  if (value !== pwdForm.newPassword) return callback(new Error('两次输入的密码不一致'))
  callback()
}

// 校验仅在点击修改密码按钮时触发
const pwdRules = {
  oldPassword: [{ required: true, message: '请输入当前密码', trigger: 'submit' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'submit' },
    { min: 6, max: 20, message: '密码长度应为6-20位', trigger: 'submit' },
    { pattern: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]+$/, message: '密码必须同时包含字母和数字', trigger: 'submit' }
  ],
  confirmPassword: [{ validator: validateConfirm, trigger: 'submit' }]
}

onMounted(async () => {
  form.realName = userStore.realName || ''
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
    await updateProfile({ realName: form.realName, phone: form.phone, email: form.email })
    userStore.realName = form.realName
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

// ─── 顶部横幅 ───
.profile-hero {
  position: relative;
  min-height: 216px;
  overflow: hidden;
  border: 1px solid rgba(181, 205, 250, 0.7);
  border-radius: 12px;
  background:
    radial-gradient(circle at 55% 20%, rgba(255, 255, 255, 0.98), transparent 30%),
    linear-gradient(118deg, #f9fcff 0%, #f0f6ff 48%, #e4efff 100%);
  box-shadow: 0 8px 25px rgba(40, 75, 129, 0.05);

  &::after {
    content: '';
    position: absolute;
    inset: auto -3% -80% 42%;
    height: 220px;
    border-radius: 50%;
    background: radial-gradient(ellipse at center, rgba(67, 126, 255, 0.12), rgba(67, 126, 255, 0) 68%);
  }
}

.dot-pattern {
  position: absolute;
  top: 16px;
  left: 40%;
  width: 320px;
  height: 95px;
  opacity: 0.32;
  background-image: radial-gradient(circle, rgba(73, 123, 226, 0.22) 1px, transparent 1.5px);
  background-size: 12px 12px;
  mask-image: linear-gradient(90deg, transparent, #000 23%, #000 80%, transparent);
}

.hero-decoration {
  position: absolute;
  z-index: 1;
  right: -10px;
  bottom: -28px;
  width: 455px;
  max-height: 235px;
  object-fit: contain;
  opacity: 0.58;
  pointer-events: none;
  filter: saturate(0.9);
}

.profile-identity {
  position: relative;
  z-index: 2;
  min-height: 216px;
  display: flex;
  align-items: center;
  gap: 32px;
  padding: 35px 44px;
}

.avatar-wrap {
  position: relative;
  flex: 0 0 auto;
  width: 118px;
  height: 118px;

  .avatar-img {
    border: 5px solid #fff;
    box-shadow: 0 10px 28px rgba(47, 107, 255, 0.17), 0 0 0 3px rgba(80, 139, 255, 0.16);
  }

  .avatar-fallback {
    width: 118px;
    height: 118px;
    border-radius: 50%;
    background: linear-gradient(135deg, #4384ff, #2065f8);
    color: #fff;
    font-size: 40px;
    font-weight: 700;
    display: grid;
    place-items: center;
    border: 5px solid #fff;
    box-shadow: 0 10px 28px rgba(47, 107, 255, 0.17), 0 0 0 3px rgba(80, 139, 255, 0.16);
  }

  .avatar-edit {
    position: absolute;
    right: -4px;
    bottom: 4px;
    width: 38px;
    height: 38px;
    display: grid;
    place-items: center;
    color: #fff;
    font-size: 20px;
    background: linear-gradient(145deg, #4384ff, #2065f8);
    border: 3px solid #fff;
    border-radius: 50%;
    box-shadow: 0 6px 16px rgba(47, 107, 255, 0.3);
    cursor: pointer;
    transition: transform 0.18s ease;

    &:hover { transform: scale(1.1); }
  }

  .upload-input { display: none; }
}

.identity-content {
  padding-top: 2px;

  .identity-title-row {
    display: flex;
    align-items: center;
    gap: 18px;

    h1 {
      margin: 0;
      font-size: 32px;
      line-height: 1.15;
      letter-spacing: -0.6px;
      color: #10213d;
      font-weight: 800;
    }
  }

  .role-badge {
    padding: 5px 14px;
    color: #2f6bff;
    font-size: 13px;
    font-weight: 700;
    border: 1px solid rgba(47, 107, 255, 0.55);
    background: rgba(255, 255, 255, 0.55);
    border-radius: 999px;
  }

  .identity-meta {
    margin-top: 23px;
    display: flex;
    align-items: center;
    gap: 18px;
    color: #37567e;
    font-size: 14px;

    span {
      display: inline-flex;
      align-items: center;
      gap: 8px;

      .el-icon {
        color: #2f6bff;
        font-size: 18px;
      }
    }

    > i {
      width: 1px;
      height: 17px;
      background: #bccbe0;
    }
  }
}

// ─── 双栏卡片 ───
.form-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 20px;
  margin-top: 22px;
}

.content-card {
  min-height: 505px;
  padding: 25px 30px 26px;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid #e8eef7;
  border-radius: 12px;
  box-shadow: 0 8px 26px rgba(39, 71, 121, 0.055);
}

.card-heading {
  position: relative;
  min-height: 66px;
  display: flex;
  align-items: flex-start;
  gap: 14px;
  border-bottom: 1px solid #dbe7fa;

  &::after {
    content: '';
    position: absolute;
    left: 0;
    bottom: -1px;
    width: 49px;
    height: 2px;
    background: #2f6bff;
    border-radius: 2px;
  }

  .heading-icon {
    width: 42px;
    height: 42px;
    display: grid;
    place-items: center;
    color: #2f6bff;
    font-size: 23px;
    background: #edf3ff;
    border-radius: 50%;
  }

  h2 {
    margin: 2px 0 4px;
    font-size: 17px;
    color: #10213d;
  }

  p {
    margin: 0;
    color: #8998af;
    font-size: 12px;
  }
}

.profile-form {
  margin-top: 25px;

  :deep(.el-form-item) { margin-bottom: 17px; }
  :deep(.el-form-item__label) {
    color: #344a69;
    font-size: 14px;
    font-weight: 500;
    line-height: 42px;
  }
}

.password-title {
  margin: 26px 0 17px;
  font-size: 15px;
  font-weight: 700;
  color: #10213d;
}

.password-form {
  :deep(.el-form-item) { margin-bottom: 15px; }
  :deep(.el-form-item__label) {
    margin-bottom: 7px;
    color: #334866;
    font-size: 13px;
    font-weight: 500;
    line-height: 1.3;
  }
}

// 输入框统一风格
.content-card {
  :deep(.el-input__wrapper) {
    min-height: 42px;
    padding: 1px 13px;
    background: #fff;
    border-radius: 7px;
    box-shadow: 0 0 0 1px #dbe3ef inset;
    transition: 0.2s ease;
  }
  :deep(.el-input__wrapper:hover) { box-shadow: 0 0 0 1px #bdcce1 inset; }
  :deep(.el-input__wrapper.is-focus) { box-shadow: 0 0 0 1px #2f6bff inset, 0 0 0 3px rgba(47, 107, 255, 0.08); }
  :deep(.el-input.is-disabled .el-input__wrapper) { background: #f5f7fa; box-shadow: 0 0 0 1px #e1e7f0 inset; }
  :deep(.el-input__inner) { color: #34445d; font-size: 14px; }
  :deep(.el-input.is-disabled .el-input__inner) { color: #8491a6; -webkit-text-fill-color: #8491a6; }
  :deep(.el-input__suffix) { color: #7d8da5; }
}

// ─── 操作区 ───
.form-actions {
  display: flex;
  align-items: center;
  gap: 20px;
}

.info-actions { margin-left: 82px; margin-top: 7px; }
.password-actions { margin-top: 20px; flex-wrap: wrap; }

.primary-action {
  min-width: 126px;
  height: 42px;
  padding: 0 21px;
  font-weight: 700;
  border: none;
  border-radius: 6px;
  background: linear-gradient(135deg, #2f6bff, #1958ed);
  box-shadow: 0 7px 15px rgba(47, 107, 255, 0.2);

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 9px 18px rgba(47, 107, 255, 0.26);
    background: linear-gradient(135deg, #4384ff, #2065f8);
  }
}

.action-note,
.security-note {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: #8a99af;
  font-size: 12px;
}

.action-note .el-icon { color: #2f6bff; }
.security-note { width: 100%; }
.security-note .el-icon { color: #7f91ab; }

// ─── 响应式 ───
@media (max-width: 1350px) {
  .profile-identity { padding: 35px; }
  .hero-decoration { width: 390px; opacity: 0.46; }
  .identity-content .identity-meta { gap: 12px; }
  .content-card { padding-left: 24px; padding-right: 24px; }
}

@media (max-width: 1180px) {
  .form-grid { grid-template-columns: 1fr; }
  .content-card { min-height: auto; }
}
</style>
