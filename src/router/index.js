import { createRouter, createWebHistory } from 'vue-router'
import { isLoggedIn } from '@/utils/auth'
import { useUserStore } from '@/store/user'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/LoginView.vue'),
    meta: { public: true }
  },
  {
    path: '/',
    component: () => import('@/layout/AdminLayout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/DashboardView.vue'),
        meta: { title: '工作台', icon: 'Odometer', permission: 'stats:view' }
      },
      // 工单模块
      {
        path: 'workorder/create',
        name: 'CreateOrder',
        component: () => import('@/views/workorder/CreateView.vue'),
        meta: { title: '新建工单', icon: 'EditPen', permission: 'workorder:submit' }
      },
      {
        path: 'workorder/my',
        name: 'MyOrders',
        component: () => import('@/views/workorder/MyListView.vue'),
        meta: { title: '我的工单', icon: 'Document', permission: 'workorder:view' }
      },
      {
        path: 'workorder/detail/:id',
        name: 'OrderDetail',
        component: () => import('@/views/workorder/DetailView.vue'),
        meta: { title: '工单详情', hidden: true }
      },
      {
        path: 'workorder/all',
        name: 'AllOrders',
        component: () => import('@/views/workorder/AllListView.vue'),
        meta: { title: '全部工单', icon: 'Files', permission: 'workorder:admin' }
      },
      // 审批模块
      {
        path: 'approve/pending',
        name: 'PendingApprove',
        component: () => import('@/views/approve/PendingView.vue'),
        meta: { title: '待审批', icon: 'Checked', permission: 'workorder:approve' }
      },
      {
        path: 'approve/detail/:id',
        name: 'ApproveDetail',
        component: () => import('@/views/approve/ApproveDetail.vue'),
        meta: { title: '审批操作', hidden: true }
      },
      {
        path: 'approve/template',
        name: 'ApproveTemplate',
        component: () => import('@/views/approve/TemplateView.vue'),
        meta: { title: '审批模板', icon: 'Setting', permission: 'template:manage' }
      },
      // 消息
      {
        path: 'message',
        name: 'Message',
        component: () => import('@/views/message/MessageView.vue'),
        meta: { title: '消息中心', icon: 'Bell', permission: 'message:view' }
      },
      // 系统管理
      {
        path: 'system/user',
        name: 'UserManage',
        component: () => import('@/views/system/UserManage.vue'),
        meta: { title: '用户管理', icon: 'User', permission: 'user:manage', parent: '系统管理' }
      },
      {
        path: 'system/dept',
        name: 'DeptManage',
        component: () => import('@/views/system/DeptManage.vue'),
        meta: { title: '部门管理', icon: 'OfficeBuilding', permission: 'dept:manage', parent: '系统管理' }
      },
      {
        path: 'system/role',
        name: 'RoleManage',
        component: () => import('@/views/system/RoleManage.vue'),
        meta: { title: '角色管理', icon: 'Avatar', permission: 'role:manage', parent: '系统管理' }
      },
      {
        path: 'system/dead-letter',
        name: 'DeadLetter',
        component: () => import('@/views/system/DeadLetter.vue'),
        meta: { title: '死信管理', icon: 'Warning', permission: 'deadletter:manage', parent: '系统管理' }
      },
      {
        path: 'system/ai-config',
        name: 'AiConfig',
        component: () => import('@/views/system/AiConfig.vue'),
        meta: { title: 'AI 配置', icon: 'Cpu', permission: 'config:manage', parent: '系统管理' }
      },
      {
        path: 'system/rate-limit',
        name: 'RateLimitConfig',
        component: () => import('@/views/system/RateLimitConfig.vue'),
        meta: { title: '限流配置', icon: 'Timer', permission: 'config:manage', parent: '系统管理' }
      },
      // 个人
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/profile/ProfileView.vue'),
        meta: { title: '个人设置', hidden: true }
      }
    ]
  },
  // 403 无权限
  {
    path: '/403',
    name: 'Forbidden',
    component: () => import('@/views/error/403.vue'),
    meta: { public: true }
  },
  {
    path: '/network-error',
    name: 'NetworkError',
    component: () => import('@/views/error/NetworkError.vue'),
    meta: { public: true }
  },
  // 404 兜底
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/error/404.vue'),
    meta: { public: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 导航守卫
router.beforeEach(async (to, from, next) => {
  if (to.meta.public) {
    next()
  } else if (!isLoggedIn()) {
    next('/login')
  } else {
    // 页面刷新后 Pinia 状态丢失，需从后端恢复用户信息
    const userStore = useUserStore()
    if (!userStore.role) {
      try {
        await userStore.fetchUserInfo()
      } catch {
        // 会话过期，跳转登录
        userStore.logout()
        next('/login')
        return
      }
    }
    // 权限校验：基于 permission 码控制页面访问
    const requiredPerm = to.meta.permission
    if (requiredPerm && !userStore.permissions.includes(requiredPerm)) {
      next('/403')
      return
    }
    next()
  }
})

export default router
