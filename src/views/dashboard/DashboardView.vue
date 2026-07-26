<template>
  <div class="dashboard" :class="{ 'page-container': role !== 'ADMIN' }">
    <EmployeeDashboard v-if="role === 'EMPLOYEE'" />
    <ApproverDashboard v-else-if="role === 'APPROVER'" />
    <AdminDashboard v-else />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useUserStore } from '@/store/user'
import EmployeeDashboard from './EmployeeDashboard.vue'
import ApproverDashboard from './ApproverDashboard.vue'
import AdminDashboard from './AdminDashboard.vue'

const userStore = useUserStore()
const role = computed(() => userStore.role)
</script>
