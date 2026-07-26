<template>
  <header class="app-header">
    <div class="header-left">
      <button class="collapse-btn" @click="$emit('toggle-sidebar')" :title="collapsed ? '展开菜单' : '收起菜单'">
        <el-icon :size="18">
          <component :is="collapsed ? 'Expand' : 'Fold'" />
        </el-icon>
      </button>
      <div class="header-title">
        <span class="current-page">{{ $route.meta.title || '工作台' }}</span>
        <span v-if="$route.meta.parent" class="parent-path">{{ $route.meta.parent }}</span>
      </div>
    </div>

    <div class="header-right">
      <!-- 消息 -->
      <button class="header-action" @click="$router.push('/message')" title="消息中心">
        <el-badge :value="messageStore.unreadCount" :hidden="!messageStore.unreadCount" :max="99">
          <el-icon :size="18"><Bell /></el-icon>
        </el-badge>
      </button>

      <!-- 分隔线 -->
      <div class="header-divider"></div>

      <!-- 用户 -->
      <el-dropdown trigger="click" @command="handleCommand" placement="bottom-end">
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

defineProps({ collapsed: Boolean })
defineEmits(['toggle-sidebar'])

const router = useRouter()
const userStore = useUserStore()
const messageStore = useMessageStore()

const roleLabel = computed(() => {
  const map = { ADMIN: '管理员', APPROVER: '审批人', EMPLOYEE: '员工' }
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
      try { await logoutApi() } catch {}
      userStore.logout()
      router.push('/login')
    } catch {}
  }
}
</script>

<style lang="scss" scoped>
.app-header {
  height: $header-height;
  background: $bg-card;
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

.header-title {
  display: flex;
  align-items: baseline;
  gap: $space-2;

  .current-page {
    font-size: $text-lg;
    font-weight: 600;
    color: $text-primary;
  }

  .parent-path {
    font-size: $text-sm;
    color: $text-muted;
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
