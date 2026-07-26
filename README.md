# 企智协同工单调度系统 - 前端

## 项目简介

企智协同工单调度系统前端，基于 Vue 3 + Element Plus 构建的单页应用，支持普通员工、审批人员、系统管理员三种角色的差异化功能展示。

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Vue | 3.5 | 前端框架（Composition API） |
| Vite | 8.1 | 构建工具 |
| Element Plus | 2.14 | UI组件库 |
| Vue Router | 4.6 | 路由管理 |
| Pinia | 4.0 | 状态管理 |
| Axios | 1.18 | HTTP请求 |
| ECharts | 6.1 | 统计图表 |
| Sass | - | CSS预处理器 |

## 环境要求

- Node.js >= 18
- npm >= 9

## 目录结构

```
src/
├── api/              # API接口模块
│   ├── request.js    # Axios封装（拦截器、X-Session-Id）
│   ├── auth.js       # 登录/登出/用户信息
│   ├── workOrder.js  # 工单相关接口
│   ├── approve.js    # 审批相关接口
│   ├── message.js    # 消息相关接口
│   ├── statistics.js # 统计相关接口
│   └── user.js       # 用户/部门/角色管理接口
├── components/       # 公共组件
│   ├── ApprovalTimeline.vue  # 审批时间线
│   ├── FileUpload.vue        # 附件上传
│   ├── PriorityTag.vue       # 优先级标签
│   ├── StatusTag.vue         # 状态标签
│   └── WorkOrderTimeline.vue # 工单流转时间线
├── layout/           # 布局组件
│   ├── AdminLayout.vue  # 主布局（侧边栏+顶栏+内容区）
│   ├── Header.vue       # 顶部导航栏
│   └── Sidebar.vue      # 侧边菜单（按角色动态渲染）
├── router/           # 路由配置（含权限守卫）
├── store/            # Pinia状态管理
│   ├── user.js       # 用户状态（角色、权限、会话）
│   └── message.js    # 消息未读数
├── styles/           # 全局样式
├── utils/            # 工具函数
│   ├── auth.js       # SessionId存取
│   ├── constants.js  # 枚举常量（中文化映射）
│   ├── format.js     # 格式化工具
│   └── time.js       # 时间处理
└── views/            # 页面视图
    ├── dashboard/    # 工作台（按角色区分）
    ├── workorder/    # 工单模块
    ├── approve/      # 审批模块
    ├── message/      # 消息中心
    ├── system/       # 系统管理
    ├── profile/      # 个人设置
    ├── login/        # 登录页
    └── error/        # 403/404错误页
```

## 三类角色菜单

| 角色 | 可见菜单 |
|------|----------|
| EMPLOYEE（普通员工） | 工作台、新建工单、我的工单、消息中心、个人设置 |
| APPROVER（审批人员） | 工作台、新建工单、我的工单、待审批、消息中心、个人设置 |
| ADMIN（系统管理员） | 工作台、全部工单、待审批、审批模板、消息中心、用户管理、部门管理、角色管理、死信管理、个人设置 |

## 环境变量

| 文件 | 变量 | 说明 |
|------|------|------|
| .env.development | VITE_API_BASE_URL | 开发环境API地址（http://localhost:10001） |
| .env.production | VITE_API_BASE_URL | 生产环境API地址 |

## Gateway baseURL

所有业务请求统一经过 Gateway（端口10001），开发环境通过 Vite proxy 代理：

```javascript
// vite.config.js
proxy: {
  '/api': {
    target: 'http://localhost:10001',
    changeOrigin: true
  }
}
```

## 安装与启动

```bash
# 安装依赖
npm install

# 开发启动（热更新）
npm run dev
# 访问 http://localhost:5173

# 生产构建
npm run build

# 本地预览构建产物
npm run preview
```

## 登录和Session处理

1. 用户输入账号密码，POST `/api/v1/auth/login`
2. 后端验证通过返回 `X-Session-Id` 响应头
3. 前端将 sessionId 存入内存（非Cookie/localStorage）
4. 后续所有请求通过 Axios 拦截器自动携带 `X-Session-Id` 请求头
5. 页面刷新时通过 `/api/v1/auth/info` 恢复用户状态
6. 收到401响应自动跳转登录页

## 路由权限

- 路由 `meta.roles` 定义允许访问的角色列表
- 导航守卫 `beforeEach` 校验当前用户角色
- 无权限跳转 `/403` 页面
- 未登录跳转 `/login`
- 前端权限控制 + 后端Gateway双重校验

## Axios封装

`src/api/request.js` 统一封装：

- 请求拦截：自动注入 `X-Session-Id`
- 响应拦截：统一处理业务错误码
- 401：清除会话，跳转登录
- 403：跳转无权限页
- 429：提示请求过于频繁
- 网络错误：友好提示

## 枚举中文化

`src/utils/constants.js` 定义所有枚举的中文映射：

- 工单状态：PENDING_AI→待AI处理、PENDING_APPROVE→待审批、APPROVING→审批中、COMPLETED→已完结、REJECTED→已驳回
- 优先级：URGENT→紧急、NORMAL→普通、LOW→低
- 工单类型：OPS_REPAIR→运维报修、ADMIN_PURCHASE→行政采购、HR_LEAVE→人事请假、TECH_REQUEST→技术需求
- 消息类型：APPROVE_NOTIFY→审批通知、REJECT_NOTIFY→驳回通知、DELAY_REMIND→超时督办

## 状态标签

`StatusTag.vue` 和 `PriorityTag.vue` 组件根据枚举值渲染不同颜色的 Element Plus Tag：

- 紧急=红色、普通=蓝色、低=灰色
- 已完结=绿色、已驳回=红色、待审批=橙色、审批中=蓝色

## ECharts统计

工作台页面（DashboardView）根据角色展示不同统计图表：

- 管理员：工单总量趋势（折线图）、部门分布（饼图）、状态分布（饼图）、优先级分布
- 审批人员：待审批数量、今日处理、平均处理时长、紧急待办
- 普通员工：我的工单趋势、状态分布、最近工单、最新消息

## 附件上传和预览

- `FileUpload.vue` 组件支持多图上传（最多9张，jpg/png，单张≤5MB）
- 上传接口：POST `/api/v1/workorder/upload`
- 详情页支持图片预览（Element Plus Image Preview）
- PDF文件通过新窗口打开

## Excel导出

- 管理员在"全部工单"页面点击"导出"按钮
- 调用 GET `/api/v1/stats/export` 下载 Excel 文件
- 使用 EasyExcel 后端生成，前端通过 Blob 下载

## 错误处理

| 状态码 | 前端处理 |
|--------|----------|
| 401 | 清除会话，跳转登录页 |
| 403 | 跳转 /403 无权限页 |
| 404 | 跳转 /404 页面不存在 |
| 409 | 弹窗提示"请勿短时间重复提交" |
| 429 | 弹窗提示"请求过于频繁" |
| 500 | 弹窗提示"服务器异常，请稍后重试" |

## 浏览器兼容性

- Chrome 最新版（推荐）
- Edge 最新版
- Firefox 最新版

## 常见问题

| 现象 | 原因 | 解决 |
|------|------|------|
| 页面空白 | 后端服务未启动 | 确认Gateway(10001)可访问 |
| 登录后立即跳回登录页 | Session过期或Redis不可用 | 检查Redis连接 |
| 菜单不显示 | 角色信息未正确获取 | 清除浏览器缓存重新登录 |
| 图表无数据 | 统计服务未启动或无数据 | 确认statistics-service运行 |
| 中文显示为枚举英文 | constants.js映射缺失 | 检查枚举值是否与后端一致 |
| 附件上传失败 | 文件超过5MB或格式不支持 | 使用jpg/png格式，≤5MB |

## 冒烟测试方法

1. 启动后端全部服务 + 前端 `npm run dev`
2. 访问 http://localhost:5173，应看到登录页
3. 使用 admin/admin 登录，应进入管理员工作台
4. 左侧菜单应显示全部管理功能
5. 退出，使用 张伟/123 登录，应看到员工工作台
6. 点击"新建工单"，填写并提交，应返回成功
7. 退出，使用 王强/123 登录，待审批列表应有数据
# 企智协同工单调度系统 - 前端

> Vue 3 + Element Plus + Vite

## 技术栈

- **框架**：Vue 3 (Composition API)
- **构建**：Vite 5
- **UI**：Element Plus 2.7+
- **路由**：Vue Router 4
- **状态管理**：Pinia
- **HTTP**：Axios
- **图表**：ECharts 5
- **样式**：SCSS（深蓝商务风主题）

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 目录结构

```
src/
├── api/          # 接口请求模块
├── router/       # 路由配置
├── store/        # Pinia 状态管理
├── utils/        # 工具函数
├── styles/       # 全局样式 & 主题变量
├── layout/       # 布局组件（Sidebar/Header）
├── components/   # 公共组件
└── views/        # 页面视图
    ├── login/        # 登录
    ├── workorder/    # 工单模块
    ├── approve/      # 审批模块
    ├── message/      # 消息中心
    ├── dashboard/    # 统计看板
    ├── system/       # 系统管理
    └── profile/      # 个人设置
```

## 角色说明

| 角色 | 说明 |
|------|------|
| EMPLOYEE | 普通员工，可提交/查看自己的工单 |
| APPROVER | 审批人，可审批待办工单 |
| ADMIN | 管理员，拥有全部权限 |

## 环境配置

- 开发环境代理：`/api` → `http://localhost:10001`（网关端口）
- 鉴权：请求 Header 自动注入 `X-Session-Id`
