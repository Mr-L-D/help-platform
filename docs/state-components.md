# 互帮互助小程序 — 状态管理与架构设计

> 状态：设计中 | 日期：2026-05-12

---

## 1. 共享类型定义 `shared/types.ts`

前后端共用的枚举和接口，避免重复定义。

```ts
// ===== 枚举 =====

export enum TaskType {
  HELP = 'HELP',
  SKILL = 'SKILL',
  COMMUNITY = 'COMMUNITY',
}

export enum RewardType {
  FREE = 'FREE',
  PAID = 'PAID',
}

export enum TaskStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum OrderStatus {
  ACCEPTED = 'ACCEPTED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

// ===== 实体接口 =====

export interface User {
  id: string;
  nickname: string;
  avatar: string;
  phone?: string;
  role: UserRole;
  points: number;
  createdAt: string;
}

export interface UserPublic {
  id: string;
  nickname: string;
  avatar: string;
  points: number;
  taskCount: number;
  orderCount: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  type: TaskType;
}

export interface Task {
  id: string;
  publisherId: string;
  title: string;
  description: string;
  type: TaskType;
  category: Category;
  rewardType: RewardType;
  rewardAmount: number | null;
  images: string[];
  location: string | null;
  status: TaskStatus;
  publisher: UserPublic;
  createdAt: string;
}

export interface TaskDetail extends Task {
  description: string; // 全文
  images: string[]; // 完整列表
  order: OrderBrief | null; // 接单信息（如果有）
}

export interface TaskBrief {
  id: string;
  title: string;
  description: string;
  type: TaskType;
  category: Category;
  rewardType: RewardType;
  rewardAmount: number | null;
  images: string[];
  location: string | null;
  status: TaskStatus;
  publisher: UserPublic;
  createdAt: string;
}

export interface Order {
  id: string;
  taskId: string;
  helperId: string;
  status: OrderStatus;
  task: TaskBrief;
  helper: UserPublic;
  createdAt: string;
}

export interface OrderBrief {
  id: string;
  helper: UserPublic;
  status: OrderStatus;
  createdAt: string;
}

// ===== 分页 =====

export interface Paginated<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ===== API 响应 =====

export interface ApiResponse<T = unknown> {
  code: number;
  data: T;
  message: string;
}

// ===== 请求体 =====

export interface CreateTaskBody {
  title: string;
  description: string;
  type: TaskType;
  categoryId: string;
  rewardType: RewardType;
  rewardAmount?: number;
  images?: string[];
  location?: string;
}

export interface UpdateTaskBody extends Partial<CreateTaskBody> {}

export interface CreateOrderBody {
  taskId: string;
}

export interface UpdateUserBody {
  nickname?: string;
  avatar?: string;
  phone?: string;
}

export interface TaskListQuery {
  page?: number;
  pageSize?: number;
  type?: TaskType;
  categoryId?: string;
  rewardType?: RewardType;
  status?: TaskStatus;
  keyword?: string;
  sort?: 'newest' | 'reward_desc';
}
```

---

## 2. 小程序 API 请求层 `miniapp/src/api/`

### 2.1 HTTP 客户端封装 `api/client.ts`

```
api/client.ts
├── request<T>(method, url, data?, options?) → Promise<T>
│   ├── 自动拼接 BASE_URL
│   ├── 自动注入 Authorization header（从 storage 读 token）
│   ├── 统一处理响应：code !== 0 时 throw Error
│   ├── 401 时清除 token → 跳转登录页
│   └── 请求前显示 loading / 完成后隐藏
├── get<T>(url, params?) → Promise<T>
├── post<T>(url, data?) → Promise<T>
├── put<T>(url, data?) → Promise<T>
└── del<T>(url) → Promise<T>
```

### 2.2 接口模块

```
api/
├── client.ts          # 通用 HTTP 封装
├── auth.ts            # 登录、获取/更新用户信息
├── tasks.ts           # 任务 CRUD、列表
├── orders.ts          # 接单、完成、取消、列表
├── categories.ts      # 分类列表
└── users.ts           # 用户公开信息
```

**auth.ts**

```ts
export function wechatLogin(code: string): Promise<{ token: string; user: User }>;
export function getMe(): Promise<User>;
export function updateMe(body: UpdateUserBody): Promise<User>;
```

**tasks.ts**

```ts
export function getTaskList(query: TaskListQuery): Promise<Paginated<TaskBrief>>;
export function getTaskById(id: string): Promise<TaskDetail>;
export function createTask(body: CreateTaskBody): Promise<Task>;
export function updateTask(id: string, body: UpdateTaskBody): Promise<Task>;
export function cancelTask(id: string): Promise<Task>;
```

**orders.ts**

```ts
export function createOrder(body: CreateOrderBody): Promise<Order>;
export function completeOrder(id: string): Promise<Order>;
export function cancelOrder(id: string): Promise<Order>;
export function getMyOrders(query: {
  role?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}): Promise<Paginated<Order>>;
```

**categories.ts**

```ts
export function getCategories(type?: TaskType): Promise<Category[]>;
```

**users.ts**

```ts
export function getUserById(id: string): Promise<UserPublic>;
export function getUserTasks(
  id: string,
  query: { page?: number; pageSize?: number; status?: TaskStatus },
): Promise<Paginated<TaskBrief>>;
```

---

## 3. Pinia 状态管理 `miniapp/src/store/`

### 3.1 总览

```
store/
├── user.ts      # 用户登录态、个人信息
├── task.ts      # 任务列表、筛选条件、当前详情
└── order.ts     # 我的接单/发布列表
```

### 3.2 userStore

```ts
// store/user.ts
interface UserState {
  token: string | null; // JWT token，持久化到 uni.storage
  user: User | null; // 当前登录用户
  isLogin: boolean; // getter: !!token && !!user
  loading: boolean; // 登录请求进行中
}

// Actions
loginByWechat(); // 1. 调用 wx.login 获取 code
// 2. 调用 wechatLogin API
// 3. 存储 token 到 storage
// 4. 设置 user 状态

fetchMe(); // 获取当前用户信息（用于从 storage 恢复 token 后）

updateProfile(body); // 更新用户信息

logout(); // 清除 token 和 user，跳转登录页

init(); // 应用启动时调用
// 1. 从 storage 读取 token
// 2. 如果有 token，调用 fetchMe 恢复登录态
// 3. 如果 token 过期（401），清除并跳转登录页
```

**持久化策略**：

- `token` 存入 `uni.setStorageSync('token', token)`
- 应用启动时 `init()` 从 storage 恢复
- 退出登录时 `uni.removeStorageSync('token')`

### 3.3 taskStore

```ts
// store/task.ts
interface TaskState {
  // 列表
  list: TaskBrief[];
  total: number;
  page: number;
  pageSize: number;

  // 筛选条件（记忆用户选择）
  filter: {
    type: TaskType | null;
    categoryId: string | null;
    rewardType: RewardType | null;
    keyword: string;
    sort: 'newest' | 'reward_desc';
  };

  // 当前正在查看的详情
  current: TaskDetail | null;

  // 状态
  loading: boolean;
  loadingMore: boolean;       // 加载更多
  hasMore: boolean;           // getter: list.length < total
}

// Actions
fetchList(reset?: boolean)   // reset=true 时重新从第1页加载
                             // reset=false 时追加下一页

setFilter(f: Partial<TaskState['filter']>)  // 修改筛选条件并重新加载

fetchDetail(id: string)      // 获取详情，存储到 current

clearCurrent()               // 离开详情页时清空

createTask(body)             // 发布任务
updateTask(id, body)         // 编辑任务
cancelTask(id)               // 取消任务
```

**筛选记忆**：用户切换 Tab 或返回首页时保留筛选条件，下拉刷新使用当前条件重新加载。

### 3.4 orderStore

```ts
// store/order.ts
interface OrderState {
  myOrders: Order[];          // 我接的单
  myTasks: TaskBrief[];       // 我发布的任务（带接单状态）

  orderPage: number;
  taskPage: number;
  orderTotal: number;
  taskTotal: number;

  orderStatus: OrderStatus | null;   // 筛选
  taskStatus: TaskStatus | null;

  loading: boolean;
}

// Actions
fetchMyOrders(reset?: boolean)
fetchMyTasks(reset?: boolean)
acceptOrder(taskId: string)   // 接单 → 同时刷新任务详情
completeOrder(orderId: string)
cancelOrder(orderId: string)
```

---

## 4. 数据流

### 4.1 登录流程

```
用户点击「微信一键登录」
  ↓
loginByWechat()
  ↓
wx.login() → code
  ↓
POST /api/auth/wechat-login { code }
  ↓
收到 { token, user }
  ↓
uni.setStorageSync('token', token)   ← 持久化
  ↓
userStore.token = token
userStore.user = user
  ↓
uni.switchTab → 首页
```

### 4.2 任务列表加载

```
进入首页
  ↓
taskStore.fetchList(reset=true)
  ↓
GET /api/tasks?page=1&pageSize=10&type=...&categoryId=...
  ↓
更新 taskStore.list / total / page
  ↓
组件渲染 TaskCard 列表

用户下滑触底
  ↓
taskStore.fetchList(reset=false)
  ↓
GET /api/tasks?page=2&pageSize=10&...  (使用当前筛选条件)
  ↓
追加到 taskStore.list
```

### 4.3 接单流程

```
详情页 → 点击「我要接单」
  ↓
orderStore.acceptOrder(taskId)
  ↓
POST /api/orders { taskId }
  ↓
成功后：
  ├── 刷新 taskStore.current（状态变为 IN_PROGRESS，含 order 信息）
  └── 刷新 orderStore.myOrders
  ↓
底部操作栏切换为「标记完成」+「取消接单」
```

### 4.4 发布流程

```
发布页 → 填表 → 点击「确认发布」
  ↓
taskStore.createTask(body)
  ↓
POST /api/tasks { ... }
  ↓
成功后：
  ├── toast "发布成功"
  ├── uni.navigateBack → 返回上一页
  └── 上一页自动刷新列表（onShow 中调用 fetchList）
```

---

## 5. 组件通信

### 5.1 小程序页面生命周期

```
pages/
├── index      onLoad() → taskStore.fetchList()
│              onShow() → 检查是否需要刷新（从发布页返回时）
│              onReachBottom() → taskStore.fetchList(false)
│              onPullDownRefresh() → taskStore.fetchList(true)
│
├── publish    onUnload() → 清理表单临时数据
│
├── detail     onLoad(id) → taskStore.fetchDetail(id)
│              onUnload() → taskStore.clearCurrent()
│
├── mine       onShow() → userStore.fetchMe()（更新积分等）
│
└── login      onLoad() → 如果已登录则跳转首页
```

### 5.2 组件间传值

| 场景                | 方式                                        |
| ------------------- | ------------------------------------------- |
| 列表 → 详情         | URL 参数 `?id=xxx`                          |
| 详情 → 发布（编辑） | URL 参数 `?id=xxx&mode=edit`                |
| 发布 → 列表         | 返回后 onShow 自动刷新                      |
| 全局登录态          | userStore（所有页面直接引用）               |
| 筛选条件变化        | taskStore.setFilter() → 组件通过 store 响应 |

**不通过 props 层层传递**，所有页面直接从 Pinia store 取数据。

---

## 6. 错误处理策略

### 6.1 分层处理

```
┌─────────────────────────────────────┐
│ 页面层                               │
│ try/catch → toast 显示 message      │
│ 401 → 跳转登录页（client.ts 统一处理）│
└─────────────────────────────────────┘
         ↑ throw Error(message)
┌─────────────────────────────────────┐
│ store 层                             │
│ 调用 API，处理业务异常               │
│ 更新 loading 状态                    │
└─────────────────────────────────────┘
         ↑ Promise<ApiResponse<T>>
┌─────────────────────────────────────┐
│ client.ts 层                         │
│ code !== 0 → throw                  │
│ 网络异常 → throw                     │
│ 401 → 清除 token + 跳转登录          │
└─────────────────────────────────────┘
```

### 6.2 Toast 提示规范

| code     | 默认消息                 |
| -------- | ------------------------ |
| 401      | "请先登录"               |
| 403      | "无权操作"               |
| 404      | "资源不存在"             |
| 422      | 后端返回的校验 message   |
| 500      | "服务器异常，请稍后重试" |
| 网络异常 | "网络异常，请检查连接"   |

---

## 7. 图片上传方案

MVP 阶段使用 uni-app 的 `uni.chooseImage` + 后端直接上传。

```
选择图片：
  uni.chooseImage({ count: 9, sizeType: ['compressed'] })
  ↓
上传到后端：
  POST /api/upload (multipart/form-data)
  ↓
后端返回：
  { code: 0, data: { url: "https://..." } }
  ↓
前端存储 URL 到表单 / taskStore
```

> 后续可迁移到 OSS 直传，减轻后端压力。

---

## 8. 开发顺序建议

| 阶段 | 内容                                     | 依赖  |
| ---- | ---------------------------------------- | ----- |
| 1    | shared/types.ts                          | 无    |
| 2    | Prisma schema + 数据库初始化             | types |
| 3    | API：auth + categories                   | db    |
| 4    | API：tasks CRUD + list                   | db    |
| 5    | API：orders                              | db    |
| 6    | 管理后台：登录 + 仪表盘                  | API   |
| 7    | 管理后台：任务管理 + 用户管理            | API   |
| 8    | 小程序：client.ts + auth API + userStore | API   |
| 9    | 小程序：登录页 + 首页列表                | store |
| 10   | 小程序：详情页 + 发布页 + 个人中心       | store |
