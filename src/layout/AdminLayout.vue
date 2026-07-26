<template>
  <div class="admin-layout">
    <Sidebar :collapsed="collapsed" />
    <div class="main-area">
      <Header :collapsed="collapsed" @toggle-sidebar="collapsed = !collapsed" />
      <main class="main-content">
        <router-view />
      </main>
    </div>
  </div>
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
  display: flex;
  overflow: hidden;
}

.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

.main-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  background: $bg-page;
  padding: 0;
}
</style>
