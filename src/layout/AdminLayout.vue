<template>
  <el-container class="admin-layout">
    <Sidebar :collapsed="collapsed" />
    <el-container class="main-container">
      <Header :collapsed="collapsed" @toggle-sidebar="collapsed = !collapsed" />
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref } from 'vue'
import Sidebar from './Sidebar.vue'
import Header from './Header.vue'

const collapsed = ref(false)
</script>

<style lang="scss" scoped>
.admin-layout {
  height: 100vh;
  overflow: hidden;
}

.main-container {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.main-content {
  background: $content-bg;
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}
</style>
