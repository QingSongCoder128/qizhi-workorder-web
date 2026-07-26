<template>
  <el-aside :width="collapsed ? '64px' : '232px'" class="sidebar">
    <!-- Logo -->
    <div class="sidebar-logo" @click="$router.push('/dashboard')">
      <div class="logo-mark">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="8" height="8" rx="2" fill="currentColor" opacity="0.9" />
          <rect x="13" y="3" width="8" height="8" rx="2" fill="currentColor" opacity="0.5" />
          <rect x="3" y="13" width="8" height="8" rx="2" fill="currentColor" opacity="0.5" />
          <rect x="13" y="13" width="8" height="8" rx="2" fill="currentColor" opacity="0.3" />
        </svg>
      </div>
      <transition name="fade">
        <span v-show="!collapsed" class="logo-text">企智工单</span>
      </transition>
    </div>

    <!-- 菜单 -->
    <el-scrollbar class="sidebar-menu-wrap">
      <nav class="sidebar-nav">
        <!-- 工作台 -->
        <div class="nav-section">
          <router-link to="/dashboard" class="nav-item" :class="{ active: $route.path === '/dashboard' }">
            <el-icon :size="18"><Odometer /></el-icon>
            <span v-show="!collapsed" class="nav-label">工作台</span>
          </router-link>
        </div>

        <!-- 工单 -->
        <div class="nav-section">
          <p v-show="!collapsed" class="nav-group-title">工单管理</p>
          <router-link to="/workorder/create" class="nav-item" :class="{ active: $route.path === '/workorder/create' }">
            <el-icon :size="18"><EditPen /></el-icon>
            <span v-show="!collapsed" class="nav-label">新建工单</span>
          </router-link>
          <router-link to="/workorder/my" class="nav-item" :class="{ active: $route.path.startsWith('/workorder/my') || $route.path.startsWith('/workorder/detail') }">
            <el-icon :size="18"><Document /></el-icon>
            <span v-show="!collapsed" class="nav-label">我的工单</span>
          </router-link>
          <router-link v-if="isAdmin" to="/workorder/all" class="nav-item" :class="{ active: $route.path === '/workorder/all' }">
            <el-icon :size="18"><Files /></el-icon>
            <span v-show="!collapsed" class="nav-label">全部工单</span>
          </router-link>
        </div>

        <!-- 审批 -->
        <div v-if="isApproverOrAdmin" class="nav-section">
          <p v-show="!collapsed" class="nav-group-title">审批中心</p>
          <router-link to="/approve/pending" class="nav-item" :class="{ active: $route.path.startsWith('/approve/pending') || $route.path.startsWith('/approve/detail') }">
            <el-icon :size="18"><Checked /></el-icon>
            <span v-show="!collapsed" class="nav-label">待审批</span>
            <span v-if="!collapsed && pendingCount > 0" class="nav-badge">{{ pendingCount > 99 ? '99+' : pendingCount }}</span>
          </router-link>
          <router-link v-if="isAdmin" to="/approve/template" class="nav-item" :class="{ active: $route.path === '/approve/template' }">
            <el-icon :size="18"><SetUp /></el-icon>
            <span v-show="!collapsed" class="nav-label">审批模板</span>
          </router-link>
        </div>

        <!-- 消息 -->
        <div class="nav-section">
          <router-link to="/message" class="nav-item" :class="{ active: $route.path === '/message' }">
            <el-icon :size="18"><Bell /></el-icon>
            <span v-show="!collapsed" class="nav-label">消息中心</span>
            <span v-if="!collapsed && unreadCount > 0" class="nav-badge">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
          </router-link>
        </div>

        <!-- 系统管理 -->
        <div v-if="isAdmin" class="nav-section">
          <p v-show="!collapsed" class="nav-group-title">系统管理</p>
          <router-link to="/system/user" class="nav-item" :class="{ active: $route.path === '/system/user' }">
            <el-icon :size="18"><User /></el-icon>
            <span v-show="!collapsed" class="nav-label">用户管理</span>
          </router-link>
          <router-link to="/system/dept" class="nav-item" :class="{ active: $route.path === '/system/dept' }">
            <el-icon :size="18"><OfficeBuilding /></el-icon>
            <span v-show="!collapsed" class="nav-label">部门管理</span>
          </router-link>
          <router-link to="/system/role" class="nav-item" :class="{ active: $route.path === '/system/role' }">
            <el-icon :size="18"><Avatar /></el-icon>
            <span v-show="!collapsed" class="nav-label">角色管理</span>
          </router-link>
          <router-link to="/system/dead-letter" class="nav-item" :class="{ active: $route.path === '/system/dead-letter' }">
            <el-icon :size="18"><WarningFilled /></el-icon>
            <span v-show="!collapsed" class="nav-label">死信管理</span>
          </router-link>
          <router-link v-if="canManageConfig" to="/system/ai-config" class="nav-item" :class="{ active: $route.path === '/system/ai-config' }">
            <el-icon :size="18"><Cpu /></el-icon>
            <span v-show="!collapsed" class="nav-label">AI 配置</span>
          </router-link>
          <router-link v-if="canManageConfig" to="/system/rate-limit" class="nav-item" :class="{ active: $route.path === '/system/rate-limit' }">
            <el-icon :size="18"><Timer /></el-icon>
            <span v-show="!collapsed" class="nav-label">限流配置</span>
          </router-link>
        </div>
      </nav>
    </el-scrollbar>
  </el-aside>
</template>

<script setup>
import { computed, ref, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/store/user'
import { useMessageStore } from '@/store/message'
import { getPendingStats } from '@/api/approve'

defineProps({ collapsed: Boolean })

const route = useRoute()
const userStore = useUserStore()
const messageStore = useMessageStore()

const isAdmin = computed(() => userStore.role === 'ADMIN')
const isApproverOrAdmin = computed(() => ['APPROVER', 'ADMIN'].includes(userStore.role))
const canManageConfig = computed(() => userStore.permissions.includes('config:manage'))
const unreadCount = computed(() => messageStore.unreadCount || 0)

// 待审批角标：审批人/管理员登录后可见的真实待办数（approve-service pending/stats）
const pendingCount = ref(0)
async function fetchPendingCount() {
  if (!['APPROVER', 'ADMIN'].includes(userStore.role)) {
    pendingCount.value = 0
    return
  }
  try {
    const res = await getPendingStats()
    pendingCount.value = res.data?.total || 0
  } catch { pendingCount.value = 0 }
}
onMounted(fetchPendingCount)
watch(() => userStore.role, fetchPendingCount)
watch(() => route.path, fetchPendingCount)
</script>

<style lang="scss" scoped>
.sidebar {
  background: $sidebar-bg;
  transition: width $duration-slow $ease-out;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border-right: 1px solid $sidebar-border;
}

.sidebar-logo {
  height: $header-height;
  display: flex;
  align-items: center;
  padding: 0 16px;
  gap: 10px;
  cursor: pointer;
  flex-shrink: 0;
  border-bottom: 1px solid $sidebar-border;

  .logo-mark {
    width: 32px;
    height: 32px;
    border-radius: $radius-md;
    background: $brand;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    flex-shrink: 0;
  }

  .logo-text {
    color: #f9fafb;
    font-size: 15px;
    font-weight: 600;
    white-space: nowrap;
    letter-spacing: 0.02em;
  }
}

.sidebar-menu-wrap {
  flex: 1;
  padding: 8px;
}

.nav-section {
  margin-bottom: 4px;
}

.nav-group-title {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.3);
  padding: 12px 12px 4px;
  user-select: none;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: $radius-md;
  color: $sidebar-text;
  text-decoration: none;
  font-size: 13px;
  font-weight: 450;
  transition: all $duration-fast $ease-in-out;
  position: relative;
  margin-bottom: 2px;

  &:hover {
    background: $sidebar-bg-hover;
    color: #e5e7eb;
  }

  &.active {
    background: $sidebar-bg-active;
    color: $sidebar-text-active;
    font-weight: 550;

    .el-icon { color: $sidebar-text-active; }
  }

  .el-icon {
    flex-shrink: 0;
    transition: color $duration-fast;
  }
}

.nav-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nav-badge {
  margin-left: auto;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: $radius-full;
  background: $danger;
  color: #fff;
  font-size: 10px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity $duration-fast;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
