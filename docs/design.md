# 互帮互助小程序 — 设计文档

> 状态：设计中 | 日期：2026-05-12

---

## 1. 项目概述

综合性互助平台，用户可以免费互助，也可发布付费悬赏。MVP 包含核心流程。

- **平台**：uni-app 构建微信小程序 + H5（移动端网页），Next.js 16 管理后台
- **后端**：Next.js 全栈（API 路由 + 管理后台页面）
- **数据库**：PostgreSQL + Prisma ORM
- **支付**：MVP 阶段仅展示金额，线下自行结算

## 2. 用户角色

| 角色     | 说明                               |
| -------- | ---------------------------------- |
| 普通用户 | 发布求助、浏览列表、接单           |
| 管理员   | 后台审核管理（后续可扩展机构账号） |

## 3. 技术栈

| 层         | 技术                        | 用途                       |
| ---------- | --------------------------- | -------------------------- |
| 前端框架   | uni-app (Vue 3)             | 编译微信小程序 + H5 移动端 |
| 前端状态   | Pinia                       | 用户登录态、全局数据       |
| 前端UI     | uView Plus                  | uni-app 生态 UI 组件库     |
| 后端框架   | Next.js 16 App Router       | API + 管理后台             |
| ORM        | Prisma                      | 数据库操作、类型生成       |
| 数据库     | PostgreSQL                  | 数据存储                   |
| 管理后台UI | shadcn/ui + Tailwind CSS    | 后台界面                   |
| 认证       | JWT + 微信登录 + 用户名密码 | 小程序、H5、后台三端认证   |

## 4. 项目结构

采用 **Turborepo + pnpm workspace** 的 Monorepo 架构，将应用与共享包分离管理。

| 工具      | 用途                                          |
| --------- | --------------------------------------------- |
| pnpm      | 包管理器，提供 workspace 协议 (`workspace:*`) |
| Turborepo | 任务编排、构建缓存、并行执行                  |
| ESLint    | 代码规范检查（根级统一配置，各包 extends）    |
| Prettier  | 代码格式化，统一风格                          |
| tsconfig  | 根级共享 TypeScript 配置，各包 extends        |

```
/help-platform/
├── apps/
│   ├── miniapp/                 # uni-app (Vue 3) → 微信小程序 + H5
│   │   ├── src/
│   │   │   ├── pages/           # 页面
│   │   │   │   ├── index/       # 首页（求助列表）
│   │   │   │   ├── publish/     # 发布求助
│   │   │   │   ├── detail/      # 求助详情
│   │   │   │   ├── mine/        # 我的（个人中心）
│   │   │   │   └── login/       # 登录页
│   │   │   ├── components/      # 公共组件
│   │   │   ├── api/             # 接口请求封装（uni.request 统一拦截）
│   │   │   ├── store/           # 状态管理 (pinia)
│   │   │   └── utils/           # 工具函数（含平台差异化逻辑）
│   │   ├── manifest.json
│   │   ├── pages.json
│   │   ├── eslint.config.mjs       # extends 根 ESLint + vue 插件
│   │   └── package.json
│   │
│   └── admin/                   # Next.js 16 (App Router) 管理后台 + API
│       ├── app/
│       │   ├── api/             # RESTful API
│       │   │   ├── auth/        # 登录认证
│       │   │   ├── tasks/       # 求助任务 CRUD
│       │   │   ├── users/       # 用户管理
│       │   │   └── orders/      # 接单管理
│       │   ├── (admin)/         # 管理后台页面
│       │   │   ├── dashboard/   # 数据概览
│       │   │   ├── tasks/       # 任务管理
│       │   │   └── users/       # 用户管理
│       │   └── login/           # 后台登录页
│       ├── lib/
│       │   ├── auth.ts          # 认证工具
│       │   └── prisma.ts        # Prisma 客户端单例
│       ├── eslint.config.mjs       # extends 根 ESLint + next/react 插件
│       ├── package.json
│       └── next.config.ts
│
├── packages/
│   ├── shared/                  # 共享类型、枚举、常量
│   │   ├── src/
│   │   │   ├── types.ts         # 通用 TS 类型/接口
│   │   │   ├── enums.ts         # 枚举定义（任务类型、状态等）
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── database/                # Prisma schema & 共享客户端
│       ├── prisma/
│       │   └── schema.prisma    # 数据库模型（单一数据源）
│       ├── src/
│       │   └── index.ts         # 导出 Prisma 客户端实例
│       └── package.json
│
├── .gitignore                    # Git 忽略规则
├── .npmrc                        # pnpm 配置（shamefully-hoist 等）
├── pnpm-workspace.yaml          # 定义 workspace 包路径
├── turbo.json                   # Turborepo 任务编排
├── eslint.config.mjs            # 根级 ESLint 配置（各包 extends）
├── .prettierrc                  # Prettier 格式化规则
├── .prettierignore              # Prettier 忽略文件
├── package.json                 # 根 workspace 脚本
└── tsconfig.json                # 根级 TS 配置（各包 extends）
```

**依赖关系**：`apps/*` → `packages/shared`（类型引用）、`apps/admin` → `packages/database`（ORM 访问），前端不直接依赖 database 包。

**关键命令**：

- `pnpm dev` — 并行启动所有 app 开发服务（Turbo 编排）
- `pnpm build` — 按依赖顺序构建（先 packages，后 apps）
- `pnpm lint` — 全仓库 ESLint 检查
- `pnpm format` — 全仓库 Prettier 格式化
- `pnpm db:push` — 推送 Prisma schema 到数据库（在 database 包执行）

**代码规范分层策略**：

| 层             | 配置                             | 适用范围                                                                  |
| -------------- | -------------------------------- | ------------------------------------------------------------------------- |
| 根级 Prettier  | `.prettierrc`                    | 全局生效，格式化所有 `.vue` `.ts` `.tsx` `.json` 文件，与框架无关         |
| 根级 ESLint    | `eslint.config.mjs`              | 通用规则：TypeScript 类型检查、import 排序、禁用 `console` / `any` 等     |
| miniapp ESLint | `apps/miniapp/eslint.config.mjs` | extends 根配置 + `eslint-plugin-vue`（Vue 3 SFC 规则）                    |
| admin ESLint   | `apps/admin/eslint.config.mjs`   | extends 根配置 + `@next/eslint-plugin-next` + `eslint-plugin-react-hooks` |

根级 ESLint 提取两个 app 的共性规则（TypeScript 严格模式、命名规范等），避免重复；框架专属规则由各 app 自行追加。根 `turbo.json` 中配置 `lint` 和 `format` 任务，一次性检查所有包。

**多端适配（uni-app 条件编译）**：

uni-app 构建时通过条件编译语法 `#ifdef` / `#ifndef` 处理平台差异，关键差异点：

| 模块     | 微信小程序                              | H5                                      |
| -------- | --------------------------------------- | --------------------------------------- |
| 登录     | `wx.login()` → `/api/auth/wechat-login` | 用户名密码 → `/api/auth/password-login` |
| 存储     | `uni.setStorageSync`                    | `uni.setStorageSync`（统一 API）        |
| 网络请求 | `uni.request`                           | `uni.request`（统一 API）               |
| UI 适配  | `rpx` 响应式单位（375px 基准）          | `rpx` → rem 转换（自动）                |

大部分代码可复用，登录页面和认证逻辑需按平台区分（小程序微信一键登录，H5 用户名密码表单）。

## 5. 数据库模型

### User（用户表）

| 字段          | 类型              | 说明                             |
| ------------- | ----------------- | -------------------------------- |
| id            | UUID              | 主键                             |
| openid        | String (unique)?  | 微信小程序 openid（H5 用户为空） |
| unionid       | String?           | 微信 UnionID（跨平台账号绑定）   |
| nickname      | String            | 昵称                             |
| avatar        | String            | 头像 URL                         |
| username      | String?           | 用户名（H5 登录标识）            |
| password_hash | String?           | 密码哈希（H5 用户）              |
| phone         | String?           | 手机号（后期绑定）               |
| role          | Enum(USER, ADMIN) | 角色                             |
| points        | Int (default 0)   | 积分                             |
| created_at    | DateTime          | 注册时间                         |

> **多端登录策略**：小程序端通过 `wx.login` 获取 code 换取 openid 自动登录；H5 端通过用户名密码注册/登录。若用户先后使用小程序和 H5，后续可通过绑定微信 UnionID 关联同一账号。手机号留作后期付费业务绑定使用。

### Task（求助任务表）

| 字段          | 类型                                          | 说明           |
| ------------- | --------------------------------------------- | -------------- |
| id            | UUID                                          | 主键           |
| publisher_id  | UUID → User                                   | 发布者         |
| title         | String                                        | 标题           |
| description   | Text                                          | 详细描述       |
| type          | Enum(HELP, SKILL, COMMUNITY)                  | 任务类型       |
| category_id   | UUID → Category                               | 分类           |
| reward_type   | Enum(FREE, PAID)                              | 免费/付费      |
| reward_amount | Decimal?                                      | 赏金金额（元） |
| images        | String[] (JSON)                               | 图片列表       |
| location      | String?                                       | 地址描述       |
| status        | Enum(OPEN, IN_PROGRESS, COMPLETED, CANCELLED) | 状态           |
| created_at    | DateTime                                      | 发布时间       |

### Order（接单记录表）

| 字段       | 类型                                 | 说明     |
| ---------- | ------------------------------------ | -------- |
| id         | UUID                                 | 主键     |
| task_id    | UUID → Task                          | 关联任务 |
| helper_id  | UUID → User                          | 帮助者   |
| status     | Enum(ACCEPTED, COMPLETED, CANCELLED) | 接单状态 |
| created_at | DateTime                             | 接单时间 |

### Category（分类表）

| 字段 | 类型                         | 说明         |
| ---- | ---------------------------- | ------------ |
| id   | UUID                         | 主键         |
| name | String                       | 分类名称     |
| icon | String                       | 图标标识     |
| type | Enum(HELP, SKILL, COMMUNITY) | 所属任务类型 |

**关系**：一个用户发布多条任务，一个任务只能被一人接单（MVP 简化），一张接单记录对应一个任务。

---

## 6. API 接口设计

> 所有接口前缀 `/api`，返回统一 JSON 格式 `{ code, data, message }`。
> 客户端认证通过 `Authorization: Bearer <token>` 请求头传递 JWT。

### 6.1 统一响应格式

```json
{
  "code": 0,
  "data": {},
  "message": "ok"
}
```

| code | 含义                |
| ---- | ------------------- |
| 0    | 成功                |
| 401  | 未授权 / token 过期 |
| 403  | 无权限              |
| 404  | 资源不存在          |
| 422  | 参数校验失败        |
| 500  | 服务器错误          |

---

### 6.2 认证相关 `/api/auth`

> 小程序端通过 `wx.login` code 换取 openid；H5 端通过用户名密码注册/登录；管理后台通过用户名密码登录。

#### POST `/api/auth/wechat-login`

小程序微信登录。

Request:

```json
{
  "code": "微信 wx.login() 返回的临时凭证"
}
```

Response:

```json
{
  "code": 0,
  "data": {
    "token": "jwt-token",
    "user": {
      "id": "uuid",
      "nickname": "微信昵称",
      "avatar": "https://...",
      "role": "USER"
    }
  }
}
```

逻辑：用 code 换取 openid，新用户自动注册，返回 JWT。

---

#### POST `/api/auth/register`

H5 端用户名密码注册。

Request:

```json
{
  "username": "zhangsan",
  "password": "123456"
}
```

Response:

```json
{
  "code": 0,
  "data": {
    "token": "jwt-token",
    "user": {
      "id": "uuid",
      "nickname": "zhangsan",
      "role": "USER"
    }
  }
}
```

校验：`username` 4-20 位字母数字，不可重复；`password` 6-32 位。注册成功自动登录，返回 JWT。

---

#### POST `/api/auth/password-login`

H5 端用户名密码登录。

Request:

```json
{
  "username": "zhangsan",
  "password": "123456"
}
```

Response: 同 register，校验用户名密码，成功返回 JWT。

---

#### POST `/api/auth/admin/login`

管理后台用户名密码登录。

Request:

```json
{
  "username": "admin",
  "password": "123456"
}
```

Response:

```json
{
  "code": 0,
  "data": {
    "token": "jwt-token",
    "user": { "id": "uuid", "nickname": "管理员", "role": "ADMIN" }
  }
}
```

---

#### GET `/api/auth/me`

获取当前登录用户信息（需认证）。

Response:

```json
{
  "code": 0,
  "data": {
    "id": "uuid",
    "nickname": "...",
    "avatar": "https://...",
    "phone": "138...",
    "role": "USER",
    "points": 100
  }
}
```

#### PUT `/api/auth/me`

更新当前用户信息（需认证）。

Request:

```json
{
  "nickname": "新昵称",
  "avatar": "https://...",
  "phone": "13800001111"
}
```

---

### 6.3 分类相关 `/api/categories`

#### GET `/api/categories`

获取分类列表。

Query: `?type=HELP` （可选，筛选任务类型）

Response:

```json
{
  "code": 0,
  "data": [
    { "id": "uuid", "name": "家电维修", "icon": "repair", "type": "SKILL" },
    { "id": "uuid", "name": "日常求助", "icon": "help", "type": "HELP" }
  ]
}
```

---

### 6.4 任务相关 `/api/tasks`

#### GET `/api/tasks`

获取任务列表（公开分页）。

Query:

| 参数       | 类型   | 必填 | 说明                                                  |
| ---------- | ------ | ---- | ----------------------------------------------------- |
| page       | int    | 否   | 页码，默认 1                                          |
| pageSize   | int    | 否   | 每页数量，默认 10，最大 50                            |
| type       | string | 否   | HELP / SKILL / COMMUNITY                              |
| categoryId | string | 否   | 分类 ID                                               |
| rewardType | string | 否   | FREE / PAID                                           |
| status     | string | 否   | OPEN / IN_PROGRESS / COMPLETED / CANCELLED，默认 OPEN |
| keyword    | string | 否   | 搜索标题                                              |
| sort       | string | 否   | newest（默认）、reward_desc（赏金从高到低）           |

Response:

```json
{
  "code": 0,
  "data": {
    "list": [
      {
        "id": "uuid",
        "title": "帮忙修一下空调",
        "description": "客厅空调不制冷...",
        "type": "SKILL",
        "category": { "id": "uuid", "name": "家电维修", "icon": "repair" },
        "rewardType": "PAID",
        "rewardAmount": 50.0,
        "images": ["https://..."],
        "location": "北京市朝阳区",
        "status": "OPEN",
        "publisher": {
          "id": "uuid",
          "nickname": "小王",
          "avatar": "https://..."
        },
        "createdAt": "2026-05-12T10:00:00Z"
      }
    ],
    "total": 100,
    "page": 1,
    "pageSize": 10
  }
}
```

---

#### GET `/api/tasks/[id]`

获取任务详情。

Response: 包含更多字段（description 全文、order 接入单信息）

```json
{
  "code": 0,
  "data": {
    "id": "uuid",
    "title": "帮忙修一下空调",
    "description": "客厅空调不制冷，去年刚加过氟...",
    "type": "SKILL",
    "category": { "id": "uuid", "name": "家电维修" },
    "rewardType": "PAID",
    "rewardAmount": 50.0,
    "images": ["https://...", "https://..."],
    "location": "北京市朝阳区xxx小区",
    "status": "IN_PROGRESS",
    "publisher": { "id": "uuid", "nickname": "小王", "avatar": "https://..." },
    "order": {
      "id": "uuid",
      "helper": { "id": "uuid", "nickname": "老张", "avatar": "https://..." },
      "status": "ACCEPTED",
      "createdAt": "2026-05-12T11:00:00Z"
    },
    "createdAt": "2026-05-12T10:00:00Z"
  }
}
```

---

#### POST `/api/tasks`

发布任务（需认证）。

Request:

```json
{
  "title": "帮忙修一下空调",
  "description": "客厅空调不制冷...",
  "type": "SKILL",
  "categoryId": "uuid",
  "rewardType": "PAID",
  "rewardAmount": 50.0,
  "images": ["https://..."],
  "location": "北京市朝阳区"
}
```

校验：

- `title` 1-50 字
- `description` 1-2000 字
- `rewardType` 为 PAID 时必须有 `rewardAmount` > 0
- `images` 最多 9 张

Response: 返回创建的任务对象。

---

#### PUT `/api/tasks/[id]`

编辑任务（需认证，仅发布者可编辑，状态为 OPEN 时允许编辑）。

Request: 同 POST，所有字段可选。

---

#### POST `/api/tasks/[id]/cancel`

取消任务（需认证，仅发布者可操作，状态为 OPEN 或 IN_PROGRESS）。

Response: 返回更新后的任务对象。

---

### 6.5 接单相关 `/api/orders`

#### POST `/api/orders`

接单（需认证）。

Request:

```json
{
  "taskId": "uuid"
}
```

校验：

- 任务状态必须为 OPEN
- 不能接自己发的任务
- 一个任务只能被一人接（MVP）

Response: 返回创建的订单对象。

---

#### POST `/api/orders/[id]/complete`

完成订单（需认证，仅接单者可操作，状态为 ACCEPTED）。

Response: 返回更新后的订单对象，同时将任务状态流转为 COMPLETED。

---

#### POST `/api/orders/[id]/cancel`

取消接单（需认证，仅接单者可操作，状态为 ACCEPTED）。

Response: 返回更新后的订单对象，同时将任务状态流转回 OPEN。

---

#### GET `/api/orders`

我的接单列表（需认证）。

Query:

| 参数     | 类型   | 必填 | 说明                                                   |
| -------- | ------ | ---- | ------------------------------------------------------ |
| role     | string | 否   | helper（我帮助的）/ publisher（我发布的），默认 helper |
| status   | string | 否   | ACCEPTED / COMPLETED / CANCELLED                       |
| page     | int    | 否   | 页码                                                   |
| pageSize | int    | 否   | 每页数量                                               |

Response: 分页列表，每条包含关联的任务和用户简要信息。

---

### 6.6 用户相关 `/api/users`

#### GET `/api/users/[id]`

获取用户公开信息。

Response:

```json
{
  "code": 0,
  "data": {
    "id": "uuid",
    "nickname": "小王",
    "avatar": "https://...",
    "points": 100,
    "taskCount": 5,
    "orderCount": 12
  }
}
```

#### GET `/api/users/[id]/tasks`

获取用户发布的任务列表，分页，复用 `/api/tasks` 的分页结构。

Query: `?page=1&pageSize=10&status=OPEN`

---

### 6.7 管理后台 API

管理端接口需要 ADMIN 角色权限。

#### GET `/api/admin/tasks`

任务管理列表，支持全字段筛选（含 publisher 搜索），分页。

#### PUT `/api/admin/tasks/[id]`

管理员编辑/下架任务。

#### GET `/api/admin/users`

用户列表，分页。

#### PUT `/api/admin/users/[id]`

拉黑/恢复用户（支持修改 role）。

#### GET `/api/admin/dashboard`

仪表盘统计数据。

Response:

```json
{
  "code": 0,
  "data": {
    "taskCount": 100,
    "userCount": 500,
    "orderCount": 60,
    "todayNewTasks": 5,
    "todayNewUsers": 20
  }
}
```

---

### 6.8 认证与权限策略

| 端点                       | 认证             |
| -------------------------- | ---------------- |
| `/api/auth/wechat-login`   | 否               |
| `/api/auth/register`       | 否               |
| `/api/auth/password-login` | 否               |
| `/api/auth/admin/login`    | 否               |
| `/api/auth/me`             | 是               |
| `/api/categories`          | 否               |
| `/api/tasks` GET           | 否               |
| `/api/tasks/[id]` GET      | 否               |
| `/api/tasks` POST/PUT      | 是（USER 角色）  |
| `/api/orders`              | 是（USER 角色）  |
| `/api/users`               | 否（公开信息）   |
| `/api/admin/*`             | 是（ADMIN 角色） |

服务端通过中间件校验 JWT：小程序用 openid 签发，H5 用 username 签发，管理后台用用户名密码签发；token 中包含 `role` 字段以区分权限。所有用户（含管理员）均存储在 `users` 表中，通过 `role` 字段区分角色。
