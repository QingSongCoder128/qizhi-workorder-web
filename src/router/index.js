import { createRouter, createWebHistory } from 'vue-router'
import { isLoggedIn } from '@/utils/auth'

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
        meta: { title: '工作台', icon: 'Odometer' }
      },
      // 工单模块
      {
        path: 'workorder/create',
        name: 'CreateOrder',
        component: () => import('@/views/workorder/CreateView.vue'),
        meta: { title: '新建工单', icon: 'EditPen' }
      },
      {
        path: 'workorder/my',
        name: 'MyOrders',
        component: () => import('@/views/workorder/MyListView.vue'),
        meta: { title: '我的工单', icon: 'Document' }
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
        meta: { title: '全部工单', icon: 'Files', roles: ['ADMIN'] }
      },
      // 审批模块
      {
        path: 'approve/pending',
        name: 'PendingApprove',
        component: () => import('@/views/approve/PendingView.vue'),
        meta: { title: '待审批', icon: 'Checked', roles: ['APPROVER', 'ADMIN'] }
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
        meta: { title: '审批模板', icon: 'Setting', roles: ['ADMIN'] }
      },
      // 消息
      {
        path: 'message',
        name: 'Message',
        component: () => import('@/views/message/MessageView.vue'),
        meta: { title: '消息中心', icon: 'Bell' }
      },
      // 系统管理
      {
        path: 'system/user',
        name: 'UserManage',
        component: () => import('@/views/system/UserManage.vue'),
        meta: { title: '用户管理', icon: 'User', roles: ['ADMIN'], parent: '系统管理' }
      },
      {
        path: 'system/dept',
        name: 'DeptManage',
        component: () => import('@/views/system/DeptManage.vue'),
        meta: { title: '部门管理', icon: 'OfficeBuilding', roles: ['ADMIN'], parent: '系统管理' }
      },
      {
        path: 'system/role',
        name: 'RoleManage',
        component: () => import('@/views/system/RoleManage.vue'),
        meta: { title: '角色管理', icon: 'Avatar', roles: ['ADMIN'], parent: '系统管理' }
      },
      {
        path: 'system/dead-letter',
        name: 'DeadLetter',
        component: () => import('@/views/system/DeadLetter.vue'),
        meta: { title: '死信管理', icon: 'Warning', roles: ['ADMIN'], parent: '系统管理' }
      },
      // 个人
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/profile/ProfileView.vue'),
        meta: { title: '个人设置', hidden: true }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 导航守卫
router.beforeEach((to, from, next) => {
  if (to.meta.public) {
    next()
  } else if (!isLoggedIn()) {
    next('/login')
  } else {
    next()
  }
})

export default router
