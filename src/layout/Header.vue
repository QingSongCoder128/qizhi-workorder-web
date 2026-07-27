<template>
  <header class="app-header">
    <div class="header-left">
      <button class="collapse-btn" :title="collapsed ? '展开菜单' : '收起菜单'" @click="$emit('toggle-sidebar')">
        <el-icon :size="18">
          <component :is="collapsed ? 'Expand' : 'Fold'" />
        </el-icon>
      </button>
    </div>

    <div class="header-right">
      <!-- 消息 -->
      <button class="header-action" title="消息中心" @click="$router.push('/message')">
        <el-badge :value="messageStore.unreadCount" :hidden="!messageStore.unreadCount" :max="99">
          <el-icon :size="18"><Bell /></el-icon>
        </el-badge>
      </button>

      <!-- 分隔线 -->
      <div class="header-divider"></div>

      <!-- 用户 -->
      <el-dropdown trigger="click" placement="bottom-end" @command="handleCommand">
        <button class="user-trigger">
          <el-avatar :size="30" :src="userStore.avatarUrl || undefined" class="user-avatar">
            {{ (userStore.realName || userStore.username || 'U').charAt(0) }}
          </el-avatar>
          <div class="user-meta">
            <span class="user-name">{{ userStore.realName || userStore.username }}</span>
            <span class="user-role">{{ roleLabel }}</span>
          </div>
          <el-icon :size="12" class="user-arrow"><ArrowDown /></el-icon>
        </button>
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
  </header>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { useUserStore } from '@/store/user'
import { useMessageStore } from '@/store/message'
import { logout as logoutApi } from '@/api/auth'
import { cancelAllRequests } from '@/api/request'
import { getSessionId } from '@/utils/auth'

defineProps({ collapsed: Boolean })
defineEmits(['toggle-sidebar'])

const router = useRouter()
const userStore = useUserStore()
const messageStore = useMessageStore()

const roleLabel = computed(() => {
  const map = { ADMIN: '管理', APPROVER: '审批', EMPLOYEE: '员工' }
  return map[userStore.role] || '用户'
})

onMounted(() => {
  messageStore.fetchUnreadCount()
})

async function handleCommand(cmd) {
  if (cmd === 'profile') {
    router.push('/profile')
  } else if (cmd === 'logout') {
    try {
      await ElMessageBox.confirm('确定退出登录吗？', '提示', { type: 'warning', confirmButtonText: '退出', cancelButtonText: '取消' })
      // 专业退出流程：
      // 1. 保存 sessionId（通知后端便会话失效需要）
      const sid = getSessionId()
      // 2. 立即取消所有在途请求（被 abort 的请求静默失败，不触发任何 UI 反馈）
      cancelAllRequests()
      // 3. 通知后端便会话失效（显式携带 sessionId，不依赖拦截器；失败不影响退出）
      if (sid) {
        logoutApi({ headers: { 'X-Session-Id': sid } }).catch(() => {})
      }
      // 4. 清除本地状态（此后拦截器会拒绝发出任何受保护请求）
      userStore.logout()
      messageStore.clear()
      // 5. 跳转登录页
      router.push('/login')
    } catch {}
  }
}
</script>

<style lang="scss" scoped>
.app-header {
  height: $header-height;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 $space-5;
  border-bottom: 1px solid $border-light;
  flex-shrink: 0;
  z-index: 10;
}

.header-left {
  display: flex;
  align-items: center;
  gap: $space-3;
}

.collapse-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: $radius-md;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: $text-secondary;
  transition: all $duration-fast;

  &:hover {
    background: $bg-hover;
    color: $text-primary;
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: $space-3;
}

.header-action {
  width: 34px;
  height: 34px;
  border: none;
  background: transparent;
  border-radius: $radius-md;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: $text-secondary;
  transition: all $duration-fast;

  &:hover {
    background: $bg-hover;
    color: $text-primary;
  }
}

.header-divider {
  width: 1px;
  height: 20px;
  background: $border-light;
}

.user-trigger {
  display: flex;
  align-items: center;
  gap: $space-2;
  padding: 4px 8px 4px 4px;
  border: none;
  background: transparent;
  border-radius: $radius-md;
  cursor: pointer;
  transition: background $duration-fast;

  &:hover { background: $bg-hover; }
}

.user-avatar {
  background: $brand;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
}

.user-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  line-height: 1.2;

  .user-name {
    font-size: $text-base;
    font-weight: 550;
    color: $text-primary;
  }

  .user-role {
    font-size: $text-xs;
    color: $text-muted;
  }
}

.user-arrow {
  color: $text-muted;
}
</style>
