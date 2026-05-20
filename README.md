# help-platform

综合性互助平台，用户可以免费互助，也可发布付费悬赏。MVP 阶段。

管理后台地址：https://help-platform-five.vercel.app/

H5：待补充

微信小程序：待补充

## 技术栈

本项目使用了vibe coding，项目中60% ~ 70%代码由ai完成。ai使用的是claude code 使用到skills有superpowers、ui-ux-pro-max等，模型使用的是deepseek-v4-pro。

|                                 | 技术选型                                                                                            |
| ------------------------------- | --------------------------------------------------------------------------------------------------- |
| 后端 / 管理后台web （全栈开发） | [Next.js 16](https://nextjs.org/) (App Router) + React 19 + TypeScript + Tailwind CSS + Ant design6 |
| 小程序 / H5                     | [uni-app](https://uniapp.dcloud.net.cn/)（Vue 3语法） + TypeScript                                  |
| 数据库                          | PostgreSQL + [Prisma ORM](https://www.prisma.io/)                                                   |
| Monorepo工程化                  | [Turborepo](https://turbo.build/) + pnpm + Eslint + Prettier + git hooks（Husky + commitlint）      |
| 部署                            | [Vercel](https://vercel.com/)（web后台端 & H5）与git集成自动部署 / 微信小程序                       |
| UI设计稿                        | ui-ux-pro-max                                                                                       |
|                                 |                                                                                                     |

项目中采用的各个技术均为较新的技术栈意在学习。

项目中docs文件存放着前期ai输出的项目架构设计和UI设计文件，但后期开发中进行了调整仅供参考，不是完全一致。

## 项目结构

```
help-platform/
├── apps/
│   ├── admin/                  # Next.js
│   │   ├── app/
│   │   │   ├── api/            # REST API 路由
│   │   │   ├── pages/          # 业务页面
│   │   │   └── layout.tsx      # 根布局
│   │   └── lib/                # 工具库
│   └── miniapp/                # uni-app
│       └── src/
│           ├── pages/          # 页面
│           ├── components/     # 公共组件
├── packages/
│   ├── database/               # 数据库 Schema + Prisma 客户端
│   │   ├── prisma/schema.prisma
│   │   └── src/index.ts
│   └── shared/                 # 共享类型与枚举
│       ├── src/enums.ts
│       ├── src/types.ts
│       └── src/index.ts
├── docs/                       # 设计文档
├── script/
│   ├── validate-commit-msg.mjs # commit信息校验
├── .husky/                     # Git hooks
├── turbo.json                  # Turborepo 配置
├── pnpm-workspace.yaml
└── package.json
```

## 快速开始

### 前置要求

- **Node.js** >= 20
- **pnpm** >= 10 (启用 corepack: `corepack enable`)
- **PostgreSQL** 本地运行 搭配Vercel部署所选择的技术库

### 安装与配置

```bash
# 安装依赖
pnpm install

# 配置环境变量 (根目录 .env)
cp .env.example .env
```

环境变量说明：

| 变量             | 说明              | 默认值                                      |
| ---------------- | ----------------- | ------------------------------------------- |
| `DATABASE_URL`   | PostgreSQL 连接串 | `postgresql://localhost:5432/help_platform` |
| `JWT_SECRET`     | JWT 签名密钥      | 生产环境务必更换                            |
| `ADMIN_USERNAME` | 管理员登录账号    | `admin`                                     |
| `ADMIN_PASSWORD` | 管理员登录密码    | `123456`                                    |
| `WECHAT_APPID`   | 微信小程序 AppID  | 开发环境留空使用 Mock                       |
| `WECHAT_SECRET`  | 微信小程序 Secret | 开发环境留空使用 Mock                       |

### 初始化数据库

```bash
pnpm db:generate  # 生成 Prisma 客户端
pnpm db:push  # 推送 schema 到数据库
```

### 启动开发服务

```bash
pnpm dev  # 同时启动 admin + miniapp
pnpm dev:admin  # 仅 admin (Next.js 后端 + 管理后台)
pnpm dev:miniapp  # 仅 miniapp H5
pnpm dev:miniapp:mp  # 仅 miniapp 微信小程序
```

## 工程规范

### Git 提交校验

```bash
pre-commit  # ESLint + Prettier 检查
commit-msg  # 提交信息格式校验
pre-push  # 禁止直接推送到 master 仅支持 merge
```

### 代码规范（后期可添加自定义规则）

```bash
pnpm lint  # ESLint 检查
pnpm format  # Prettier 格式化
```

## 部署

### Admin (Next.js)、H5（uni-app）

```bash
# push推送至master/test/stag分支时触发Vercel自动部署。
# git项目需要与Vercel打通。
# 项目中忽略掉了feature/开头的分支部署。
```

### Miniapp (微信小程序)

```bash
pnpm build:miniapp:mp  # 在微信开发者工具中打开 dist/build/mp-weixin
```

## 后期展望方向（顺序代表优先完成）

- [ ] 业务代码编写
- [ ] 构建错误日志系统，捕捉H5和web端线上环境error错误捕捉
- [ ] 自动构建 Swagger api 文档
