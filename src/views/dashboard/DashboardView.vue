<template>
  <div class="dashboard" :class="{ 'page-container': !isAdminView }">
    <AdminDashboard v-if="isAdminView" />
    <ApproverDashboard v-else-if="isApproverView" />
    <EmployeeDashboard v-else />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useUserStore } from '@/store/user'
import EmployeeDashboard from './EmployeeDashboard.vue'
import ApproverDashboard from './ApproverDashboard.vue'
import AdminDashboard from './AdminDashboard.vue'

const userStore = useUserStore()
// 基于权限码动态决定工作台视图
const isAdminView = computed(() => userStore.permissions.includes('workorder:admin'))
const isApproverView = computed(() => userStore.permissions.includes('workorder:approve'))
</script>
