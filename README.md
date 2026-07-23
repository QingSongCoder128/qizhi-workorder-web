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
