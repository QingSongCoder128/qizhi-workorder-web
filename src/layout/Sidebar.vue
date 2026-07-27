<template>
  <el-aside :width="collapsed ? '64px' : '232px'" class="sidebar">
    <!-- 品牌标识 -->
    <div class="sidebar-brand" @click="$router.push('/dashboard')">
      <img class="brand-logo" src="@/assets/logo.png" alt="企智协同" />
      <span v-show="!collapsed" class="brand-name">企智协同工单调度系统</span>
    </div>

    <!-- 菜单 -->
    <el-scrollbar class="sidebar-menu-wrap">
      <nav class="sidebar-nav">
        <!-- 工作台 -->
        <div v-if="hasPerm('stats:view')" class="nav-section">
          <router-link to="/dashboard" class="nav-item" :class="{ active: $route.path === '/dashboard' }">
            <el-icon :size="18"><Odometer /></el-icon>
            <span v-show="!collapsed" class="nav-label">工作台</span>
          </router-link>
        </div>

        <!-- 工单 -->
        <div v-if="hasPerm('workorder:submit') || hasPerm('workorder:view') || hasPerm('workorder:admin')" class="nav-section">
          <p v-show="!collapsed" class="nav-group-title">工单管理</p>
          <router-link v-if="hasPerm('workorder:submit')" to="/workorder/create" class="nav-item" :class="{ active: $route.path === '/workorder/create' }">
            <el-icon :size="18"><EditPen /></el-icon>
            <span v-show="!collapsed" class="nav-label">新建工单</span>
          </router-link>
          <router-link v-if="hasPerm('workorder:view')" to="/workorder/my" class="nav-item" :class="{ active: $route.path.startsWith('/workorder/my') || $route.path.startsWith('/workorder/detail') }">
            <el-icon :size="18"><Document /></el-icon>
            <span v-show="!collapsed" class="nav-label">我的工单</span>
          </router-link>
          <router-link v-if="hasPerm('workorder:admin')" to="/workorder/all" class="nav-item" :class="{ active: $route.path === '/workorder/all' }">
            <el-icon :size="18"><Files /></el-icon>
            <span v-show="!collapsed" class="nav-label">全部工单</span>
          </router-link>
        </div>

        <!-- 审批 -->
        <div v-if="hasPerm('workorder:approve') || hasPerm('template:manage')" class="nav-section">
          <p v-show="!collapsed" class="nav-group-title">审批中心</p>
          <router-link v-if="hasPerm('workorder:approve')" to="/approve/pending" class="nav-item" :class="{ active: $route.path.startsWith('/approve/pending') || $route.path.startsWith('/approve/detail') }">
            <el-icon :size="18"><Checked /></el-icon>
            <span v-show="!collapsed" class="nav-label">待审批</span>
            <span v-if="!collapsed && pendingCount > 0" class="nav-badge">{{ pendingCount > 99 ? '99+' : pendingCount }}</span>
          </router-link>
          <router-link v-if="hasPerm('template:manage')" to="/approve/template" class="nav-item" :class="{ active: $route.path === '/approve/template' }">
            <el-icon :size="18"><SetUp /></el-icon>
            <span v-show="!collapsed" class="nav-label">审批模板</span>
          </router-link>
        </div>

        <!-- 消息 -->
        <div v-if="hasPerm('message:view')" class="nav-section">
          <router-link to="/message" class="nav-item" :class="{ active: $route.path === '/message' }">
            <el-icon :size="18"><Bell /></el-icon>
            <span v-show="!collapsed" class="nav-label">消息中心</span>
            <span v-if="!collapsed && unreadCount > 0" class="nav-badge">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
          </router-link>
        </div>

        <!-- 系统管理 -->
        <div v-if="hasAnyPerm(['user:manage','dept:manage','role:manage','deadletter:manage','config:manage'])" class="nav-section">
          <p v-show="!collapsed" class="nav-group-title">系统管理</p>
          <router-link v-if="hasPerm('user:manage')" to="/system/user" class="nav-item" :class="{ active: $route.path === '/system/user' }">
            <el-icon :size="18"><User /></el-icon>
            <span v-show="!collapsed" class="nav-label">用户管理</span>
          </router-link>
          <router-link v-if="hasPerm('dept:manage')" to="/system/dept" class="nav-item" :class="{ active: $route.path === '/system/dept' }">
            <el-icon :size="18"><OfficeBuilding /></el-icon>
            <span v-show="!collapsed" class="nav-label">部门管理</span>
          </router-link>
          <router-link v-if="hasPerm('role:manage')" to="/system/role" class="nav-item" :class="{ active: $route.path === '/system/role' }">
            <el-icon :size="18"><Avatar /></el-icon>
            <span v-show="!collapsed" class="nav-label">角色管理</span>
          </router-link>
          <router-link v-if="hasPerm('deadletter:manage')" to="/system/dead-letter" class="nav-item" :class="{ active: $route.path === '/system/dead-letter' }">
            <el-icon :size="18"><WarningFilled /></el-icon>
            <span v-show="!collapsed" class="nav-label">死信管理</span>
          </router-link>
          <router-link v-if="hasPerm('config:manage')" to="/system/ai-config" class="nav-item" :class="{ active: $route.path === '/system/ai-config' }">
            <el-icon :size="18"><Cpu /></el-icon>
            <span v-show="!collapsed" class="nav-label">AI 配置</span>
          </router-link>
          <router-link v-if="hasPerm('config:manage')" to="/system/rate-limit" class="nav-item" :class="{ active: $route.path === '/system/rate-limit' }">
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
import { getSessionId } from '@/utils/auth'

defineProps({ collapsed: Boolean })

const route = useRoute()
const userStore = useUserStore()
const messageStore = useMessageStore()

const unreadCount = computed(() => messageStore.unreadCount || 0)

// 权限判断工具
function hasPerm(code) {
  return userStore.permissions.includes(code)
}
function hasAnyPerm(codes) {
  return codes.some(c => userStore.permissions.includes(c))
}

// 待审批角标：审批人/管理员登录后可见的真实待办数（approve-service pending/stats）
const pendingCount = ref(0)
async function fetchPendingCount() {
  // 快速路径：未登录时直接重置，不发起请求（拦截器层也有同样的守卫）
  if (!getSessionId()) {
    pendingCount.value = 0
    return
  }
  if (!userStore.permissions.includes('workorder:approve')) {
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

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 16px 14px 12px;
  cursor: pointer;
  flex-shrink: 0;
  border-bottom: 1px solid $sidebar-border;

  .brand-logo {
    width: 26px;
    height: 30px;
    object-fit: contain;
    flex-shrink: 0;
  }

  .brand-name {
    font-size: 14px;
    font-weight: 700;
    color: #10213d;
    white-space: nowrap;
    letter-spacing: -0.2px;
  }
}

.sidebar-menu-wrap {
  flex: 1;
  padding: 12px 10px;
}

.nav-section {
  margin-bottom: 4px;
}

.nav-group-title {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: #a3b0c2;
  padding: 14px 12px 5px;
  user-select: none;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: $radius-md;
  color: $sidebar-text;
  text-decoration: none;
  font-size: 14px;
  font-weight: 450;
  transition: all $duration-fast $ease-in-out;
  position: relative;
  margin-bottom: 2px;

  &:hover {
    background: $sidebar-bg-hover;
    color: #334155;
  }

  &.active {
    background: $sidebar-bg-active;
    color: $sidebar-text-active;
    font-weight: 600;

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
</style>
