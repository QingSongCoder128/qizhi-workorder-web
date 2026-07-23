<template>
  <el-header class="header">
    <div class="header-left">
      <el-icon class="collapse-btn" @click="$emit('toggle-sidebar')" :size="20">
        <component :is="collapsed ? 'Expand' : 'Fold'" />
      </el-icon>
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item v-if="$route.meta.parent">{{ $route.meta.parent }}</el-breadcrumb-item>
        <el-breadcrumb-item>{{ $route.meta.title }}</el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <div class="header-right">
      <!-- 消息铃铛 -->
      <el-badge :value="messageStore.unreadCount" :hidden="messageStore.unreadCount === 0" class="msg-badge">
        <el-icon :size="20" class="header-icon" @click="$router.push('/message')">
          <Bell />
        </el-icon>
      </el-badge>

      <!-- 用户下拉 -->
      <el-dropdown trigger="click" @command="handleCommand">
        <div class="user-info">
          <el-avatar :size="32" :style="{ backgroundColor: '#1890ff' }">
            {{ userStore.realName?.charAt(0) || 'U' }}
          </el-avatar>
          <span class="username">{{ userStore.realName || userStore.username }}</span>
          <el-icon><ArrowDown /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="profile">
              <el-icon><User /></el-icon>个人设置
            </el-dropdown-item>
            <el-dropdown-item divided command="logout">
              <el-icon><SwitchButton /></el-icon>退出登录
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </el-header>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { useUserStore } from '@/store/user'
import { useMessageStore } from '@/store/message'
import { logout as logoutApi } from '@/api/auth'

defineProps({
  collapsed: Boolean
})
defineEmits(['toggle-sidebar'])

const router = useRouter()
const userStore = useUserStore()
const messageStore = useMessageStore()

onMounted(() => {
  messageStore.fetchUnreadCount()
})

async function handleCommand(cmd) {
  if (cmd === 'profile') {
    router.push('/profile')
  } else if (cmd === 'logout') {
    try {
      await ElMessageBox.confirm('确定退出登录吗？', '提示', {
        type: 'warning'
      })
      try { await logoutApi() } catch {}
      userStore.logout()
      router.push('/login')
    } catch {}
  }
}
</script>

<style lang="scss" scoped>
.header {
  height: 60px;
  background: $header-bg;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  z-index: 10;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.collapse-btn {
  cursor: pointer;
  color: #666;
  &:hover { color: $primary-color; }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.header-icon {
  cursor: pointer;
  color: #666;
  &:hover { color: $primary-color; }
}

.msg-badge {
  line-height: 1;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  &:hover { background: #f5f5f5; }
}

.username {
  font-size: 14px;
  color: #333;
}
</style>
