<template>
  <el-aside :width="collapsed ? '64px' : '220px'" class="sidebar">
    <!-- Logo -->
    <div class="sidebar-logo">
      <el-icon :size="28" color="#1890ff"><SetUp /></el-icon>
      <span v-show="!collapsed" class="logo-text">企智工单系统</span>
    </div>

    <!-- 菜单 -->
    <el-scrollbar>
      <el-menu
        :default-active="currentRoute"
        :collapse="collapsed"
        :collapse-transition="false"
        background-color="#0d1b2a"
        text-color="#8899aa"
        active-text-color="#1890ff"
        router
      >
        <!-- 工作台 -->
        <el-menu-item index="/dashboard">
          <el-icon><Odometer /></el-icon>
          <template #title>工作台</template>
        </el-menu-item>

        <!-- 工单 -->
        <el-menu-item index="/workorder/create">
          <el-icon><EditPen /></el-icon>
          <template #title>新建工单</template>
        </el-menu-item>

        <el-menu-item index="/workorder/my">
          <el-icon><Document /></el-icon>
          <template #title>我的工单</template>
        </el-menu-item>

        <el-menu-item v-if="isAdmin" index="/workorder/all">
          <el-icon><Files /></el-icon>
          <template #title>全部工单</template>
        </el-menu-item>

        <!-- 审批 -->
        <el-menu-item v-if="isApproverOrAdmin" index="/approve/pending">
          <el-icon><Checked /></el-icon>
          <template #title>待审批</template>
        </el-menu-item>

        <el-menu-item v-if="isAdmin" index="/approve/template">
          <el-icon><Setting /></el-icon>
          <template #title>审批模板</template>
        </el-menu-item>

        <!-- 消息 -->
        <el-menu-item index="/message">
          <el-icon><Bell /></el-icon>
          <template #title>消息中心</template>
        </el-menu-item>

        <!-- 系统管理（仅管理员） -->
        <el-sub-menu v-if="isAdmin" index="system">
          <template #title>
            <el-icon><Tools /></el-icon>
            <span>系统管理</span>
          </template>
          <el-menu-item index="/system/user">
            <el-icon><User /></el-icon>
            <template #title>用户管理</template>
          </el-menu-item>
          <el-menu-item index="/system/dept">
            <el-icon><OfficeBuilding /></el-icon>
            <template #title>部门管理</template>
          </el-menu-item>
          <el-menu-item index="/system/role">
            <el-icon><Avatar /></el-icon>
            <template #title>角色管理</template>
          </el-menu-item>
          <el-menu-item index="/system/dead-letter">
            <el-icon><Warning /></el-icon>
            <template #title>死信管理</template>
          </el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-scrollbar>
  </el-aside>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/store/user'

defineProps({
  collapsed: Boolean
})

const route = useRoute()
const userStore = useUserStore()

const currentRoute = computed(() => route.path)
const isAdmin = computed(() => userStore.role === 'ADMIN')
const isApproverOrAdmin = computed(() => ['APPROVER', 'ADMIN'].includes(userStore.role))
</script>

<style lang="scss" scoped>
.sidebar {
  background: $sidebar-bg;
  transition: width 0.3s;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.sidebar-logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
}

.logo-text {
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  white-space: nowrap;
}

.el-menu {
  border-right: none;
}

:deep(.el-menu-item.is-active) {
  background: $sidebar-active-bg !important;
  border-right: 3px solid $sidebar-active-text;
}

:deep(.el-menu-item:hover) {
  background: rgba(24, 144, 255, 0.08) !important;
}

:deep(.el-sub-menu__title:hover) {
  background: rgba(24, 144, 255, 0.08) !important;
}
</style>
