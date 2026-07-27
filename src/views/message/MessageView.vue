<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">
        <el-icon><Bell /></el-icon> 消息中心
        <el-badge v-if="unreadTotal > 0" :value="unreadTotal" :max="99" class="unread-badge" />
      </div>
      <div class="header-actions">
        <el-button type="primary" plain size="small" :disabled="unreadTotal === 0" :loading="readingAll" @click="handleReadAll">
          <el-icon><Check /></el-icon> 全部已读
        </el-button>
      </div>
    </div>

    <div class="page-card">
      <!-- 消息类型 Tab -->
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="全部消息" name="ALL" />
        <el-tab-pane label="审批通知" name="APPROVE_NOTIFY" />
        <el-tab-pane label="驳回通知" name="REJECT_NOTIFY" />
        <el-tab-pane label="转交通知" name="TRANSFER_NOTIFY" />
        <el-tab-pane label="超时督办" name="DELAY_REMIND" />
        <el-tab-pane label="超时提醒" name="TIMEOUT_NOTIFY" />
        <el-tab-pane label="催办通知" name="URGE_NOTIFY" />
        <el-tab-pane label="升级通知" name="ESCALATION" />
        <el-tab-pane label="系统通知" name="SYSTEM" />
      </el-tabs>

      <!-- 消息列表（按 今天 / 昨天 / 更早 分组） -->
      <div v-loading="loading" class="message-list">
        <template v-for="group in groupedMessages" :key="group.label">
          <div class="group-divider">
            <span class="group-label">{{ group.label }}</span>
          </div>
          <div
            v-for="msg in group.items" :key="msg.id"
            class="message-item" :class="{ unread: !msg.isRead }"
            @click="handleClick(msg)"
          >
            <div class="msg-icon" :style="{ background: getTypeColor(msg.msgType) }">
              <el-icon :size="16" color="#fff"><component :is="getTypeIcon(msg.msgType)" /></el-icon>
            </div>
            <div class="msg-content">
              <div class="msg-title">
                <span class="msg-name">{{ msg.title }}</span>
                <span v-if="!msg.isRead" class="unread-dot" title="未读"></span>
              </div>
              <p class="msg-text">{{ msg.content }}</p>
              <span class="msg-time" :title="formatDate(msg.createdAt)">{{ timeAgo(msg.createdAt) }}</span>
            </div>
            <div class="msg-actions">
              <el-button link type="danger" size="small" class="delete-btn" @click.stop="handleDelete(msg)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>
        </template>

        <div v-if="messages.length === 0 && !loading" class="empty-state">
          <el-icon class="empty-icon"><Bell /></el-icon>
          <p class="empty-text">暂无消息</p>
        </div>
      </div>

      <el-pagination
        v-model:current-page="query.page"
        v-model:page-size="query.pageSize"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, prev, pager, next"
        @current-change="fetchList"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Bell, Check, Delete } from '@element-plus/icons-vue'
import { getMessageList, getUnreadCount, markAsRead, markAllAsRead, deleteMessage } from '@/api/message'
import { MSG_TYPE } from '@/utils/constants'
import { formatDate, timeAgo } from '@/utils/format'

const router = useRouter()
const loading = ref(false)
const readingAll = ref(false)
const messages = ref([])
const total = ref(0)
const unreadTotal = ref(0)
const activeTab = ref('ALL')
const query = reactive({ page: 1, pageSize: 20, msgType: '' })

function getTypeIcon(type) { return MSG_TYPE[type]?.icon || 'InfoFilled' }
function getTypeColor(type) { return MSG_TYPE[type]?.color || '#64748b' }

// 按 今天 / 昨天 / 更早 分组
const groupedMessages = computed(() => {
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const todayStart = startOfToday.getTime()
  const yesterdayStart = todayStart - 86400000

  const groups = { today: [], yesterday: [], earlier: [] }
  messages.value.forEach(m => {
    const t = new Date(m.createdAt).getTime()
    if (t >= todayStart) groups.today.push(m)
    else if (t >= yesterdayStart) groups.yesterday.push(m)
    else groups.earlier.push(m)
  })

  return [
    { label: '今天', items: groups.today },
    { label: '昨天', items: groups.yesterday },
    { label: '更早', items: groups.earlier }
  ].filter(g => g.items.length > 0)
})

onMounted(() => {
  fetchList()
  fetchUnreadCount()
  startPolling()
})

// 轮询：每5秒自动刷新未读数和列表
let pollTimer = null
function startPolling() {
  pollTimer = setInterval(async () => {
    const prev = unreadTotal.value
    await fetchUnreadCount()
    // 未读数变化时自动刷新列表
    if (unreadTotal.value !== prev) {
      fetchList()
    }
  }, 5000)
}

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})

async function fetchUnreadCount() {
  try {
    const res = await getUnreadCount()
    unreadTotal.value = res.data || 0
  } catch {}
}

function handleTabChange() {
  query.page = 1
  fetchList()
}

async function fetchList() {
  loading.value = true
  query.msgType = activeTab.value === 'ALL' ? '' : activeTab.value
  try {
    const res = await getMessageList(query)
    messages.value = res.data?.records || []
    total.value = res.data?.total || 0
  } catch {} finally {
    loading.value = false
  }
}

async function handleClick(msg) {
  if (!msg.isRead) {
    try {
      await markAsRead(msg.id)
      msg.isRead = 1
      unreadTotal.value = Math.max(0, unreadTotal.value - 1)
    } catch {}
  }
  if (msg.bizType === 'WORK_ORDER' && msg.bizId) {
    router.push(`/workorder/detail/${msg.bizId}`)
  } else if (msg.bizType === 'APPROVE' && msg.bizId) {
    router.push(`/approve/detail/${msg.bizId}`)
  }
}

async function handleReadAll() {
  readingAll.value = true
  try {
    await markAllAsRead()
    messages.value.forEach(m => m.isRead = 1)
    unreadTotal.value = 0
    ElMessage.success('已全部标记为已读')
  } catch {
    ElMessage.error('操作失败，请重试')
  } finally {
    readingAll.value = false
  }
}

async function handleDelete(msg) {
  try {
    await ElMessageBox.confirm('确定删除该消息吗？', '确认', { type: 'warning' })
    await deleteMessage(msg.id)
    ElMessage.success('已删除')
    fetchList()
    fetchUnreadCount()
  } catch {}
}
</script>

<style lang="scss" scoped>
.page-title {
  position: relative;

  .unread-badge {
    margin-left: $space-2;
  }
}

.header-actions {
  display: flex;
  gap: 10px;
}

.message-list {
  min-height: 200px;
}

.group-divider {
  display: flex;
  align-items: center;
  gap: $space-3;
  margin: 18px 0 6px;

  &:first-child {
    margin-top: $space-1;
  }

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: $border-light;
  }

  .group-label {
    font-size: $text-sm;
    font-weight: 600;
    color: $text-muted;
    letter-spacing: 1px;
  }
}

.message-item {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 14px $space-4;
  border-radius: $radius-md;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all $duration-fast $ease-in-out;

  & + .message-item {
    margin-top: 2px;
  }

  &:hover {
    background: $bg-hover;
    border-color: $border-light;

    .delete-btn {
      opacity: 1;
    }
  }

  &.unread {
    background: $brand-light;
    border-color: rgba(37, 99, 235, 0.16);

    &:hover {
      background: $brand-subtle;
    }

    .msg-name {
      font-weight: 600;
    }
  }

  .msg-icon {
    width: 38px;
    height: 38px;
    border-radius: $radius-md;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: $shadow-xs;
  }

  .msg-content {
    flex: 1;
    min-width: 0;

    .msg-title {
      display: flex;
      align-items: center;
      gap: $space-2;
      margin-bottom: $space-1;

      .msg-name {
        font-size: $text-md;
        color: $text-primary;
      }

      .unread-dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: $brand;
        flex-shrink: 0;
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
      }
    }

    .msg-text {
      font-size: $text-base;
      color: $text-secondary;
      line-height: $leading-normal;
      margin: 0 0 6px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .msg-time {
      font-size: $text-sm;
      color: $text-muted;
    }
  }

  .msg-actions {
    display: flex;
    align-items: center;
    gap: $space-2;
    flex-shrink: 0;

    .delete-btn {
      opacity: 0;
      transition: opacity $duration-fast;
    }
  }
}
</style>
