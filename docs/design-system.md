# 互帮互助 — 设计系统

> 来源：UI/UX Pro Max skill 数据库匹配 | 日期：2026-05-12

---

## 1. 产品匹配

| 维度     | 匹配                                    | 来源                     |
| -------- | --------------------------------------- | ------------------------ |
| 产品类型 | Marketplace (P2P) + Hyperlocal Services | products.csv #48, #31    |
| 辅助类型 | Membership/Community                    | products.csv #71         |
| 主风格   | Flat Design + Vibrant & Block-based     | Primary recommendation   |
| 辅助风格 | Micro-interactions, Trust & Authority   | Secondary recommendation |

---

## 2. 色彩系统

来源：colors.csv row 32 (Hyperlocal Services) + 调整

```css
:root {
  /* 主色 — 信任绿：代表帮助、成长、社区 */
  --color-primary: #059669; /* 主按钮、链接、选中态 */
  --color-primary-dark: #047857; /* hover 态 */
  --color-primary-light: #10b981; /* 辅助元素 */
  --color-primary-bg: #ecfdf5; /* 选中背景、提示底色 */
  --color-primary-border: #a7f3d0; /* 边框、分隔线 */

  /* 强调色 — 温暖橙：CTA、付费标识、紧急操作 */
  --color-accent: #ea580c; /* 重要按钮、价格 */
  --color-accent-bg: #fff7ed; /* 强调背景 */

  /* 中性色 */
  --color-bg: #f8fafc; /* 页面底色 */
  --color-card: #ffffff; /* 卡片、输入框 */
  --color-text: #0f172a; /* 标题、正文 */
  --color-text-secondary: #64748b; /* 描述、标签 */
  --color-text-tertiary: #94a3b8; /* 占位、禁用 */
  --color-border: #e2e8f0; /* 默认边框 */
  --color-border-light: #f1f5f9; /* 浅边框 */

  /* 语义色 */
  --color-success: #059669; /* 完成、免费 */
  --color-success-bg: #d1fae5;
  --color-warning: #d97706; /* 付费、待处理 */
  --color-warning-bg: #fef3c7;
  --color-danger: #dc2626; /* 取消、删除 */
  --color-danger-bg: #fee2e2;
  --color-info: #2563eb; /* 进行中、链接 */
  --color-info-bg: #dbeafe;
}
```

---

## 3. 字体

小程序端使用微信默认字体（PingFang SC / Microsoft YaHei），不额外引入。

| 层级    | 字号    | 字重         | 用途               |
| ------- | ------- | ------------ | ------------------ |
| H1      | 20px    | Bold 700     | 页面/详情标题      |
| H2      | 17px    | SemiBold 600 | 卡片标题           |
| Body    | 15px    | Regular 400  | 正文               |
| Caption | 14px    | Regular 400  | 描述文字           |
| Small   | 12-13px | Regular 400  | 辅助、时间戳、标签 |
| Mini    | 11px    | Medium 500   | Badge 内文字       |

行高：正文 1.5-1.7，标题 1.3-1.4。

---

## 4. 间距（4/8pt 系统）

| Token   | 值   | 用途                   |
| ------- | ---- | ---------------------- |
| space-1 | 4px  | 图标内间距             |
| space-2 | 8px  | 元素间最小间距         |
| space-3 | 12px | 常规间距、卡片间距     |
| space-4 | 16px | 页面内边距、卡片内边距 |
| space-5 | 20px | 模块间距               |
| space-6 | 24px | 大模块间距             |
| space-8 | 32px | 页面级间距             |

---

## 5. 圆角

| Token     | 值   | 用途                     |
| --------- | ---- | ------------------------ |
| radius-sm | 6px  | 标签、小按钮             |
| radius-md | 10px | 输入框、按钮、卡片内元素 |
| radius-lg | 14px | 卡片                     |
| radius-xl | 20px | 模态框、大面板           |

---

## 6. 阴影

| Token     | 值                          | 用途           |
| --------- | --------------------------- | -------------- |
| shadow-sm | 0 1px 2px rgba(0,0,0,0.04)  | 卡片默认       |
| shadow-md | 0 4px 16px rgba(0,0,0,0.08) | 悬浮态、下拉   |
| shadow-lg | 0 20px 60px rgba(0,0,0,0.1) | 模态框、大面板 |

---

## 7. 交互规范

| 规则     | 标准                                        | 避免               |
| -------- | ------------------------------------------- | ------------------ |
| 触控区域 | ≥44px (微信小程序规范)                      | 小图标无 padding   |
| 按压反馈 | transform: scale(0.98) + opacity 变化 150ms | 无反馈或布局跳动   |
| 动画时长 | 150-300ms micro-interactions                | >500ms 阻塞动画    |
| 禁用态   | 降低透明度 0.4-0.5 + cursor not-allowed     | 无视觉区分的禁用   |
| 错误提示 | 就近展示在字段下方，含明确修复指引          | 仅顶部汇总或无提示 |
| Toast    | 3-5秒自动消失，aria-live polite             | 不消失或抢占焦点   |

---

## 8. 图标规范

- **不使用 emoji 作结构性图标**
- 小程序端使用 uni-app 内置 icon 或 uView Plus 图标库
- 管理后台使用 Lucide Icons（shadcn/ui 默认）
- 图标尺寸统一：列表/按钮 20px，导航 24px

---

## 9. 反模式（避免）

| 反模式                    | 原因                   |
| ------------------------- | ---------------------- |
| Emoji 作为导航/状态图标   | 跨平台不一致，不可控   |
| 仅用 placeholder 作 label | 可访问性差，填写后消失 |
| 灰色文字堆叠在浅灰背景    | 对比度不足 4.5:1       |
| 瞬间状态切换（0ms）       | 用户感知不到变化       |
| 多级嵌套滚动              | 移动端体验差           |
| 颜色作为唯一信息载体      | 色盲用户无法区分       |
