import type { TASK_TYPE, REWARD_TYPE, TASK_STATUS, ORDER_STATUS, USER_ROLE } from './enums';

/** API 统一响应 */
export interface ApiResponse<T = unknown> {
  code: number;
  data: T;
  message: string;
}

/** 分页响应 */
export interface PaginatedData<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

/** 用户公开信息 */
export interface UserInfo {
  id: string;
  nickname: string;
  avatar: string;
  role: USER_ROLE;
  phone?: string;
  points: number;
  createdAt: string;
}

/** 分类 */
export interface Category {
  id: string;
  name: string;
  icon: string;
  type: TASK_TYPE;
}

/** 任务 */
export interface Task {
  id: string;
  title: string;
  description: string;
  type: TASK_TYPE;
  category: Category;
  rewardType: REWARD_TYPE;
  rewardAmount?: number;
  images: string[];
  location?: string;
  status: TASK_STATUS;
  publisher: Pick<UserInfo, 'id' | 'nickname' | 'avatar'>;
  createdAt: string;
}

/** 接单记录 */
export interface Order {
  id: string;
  taskId: string;
  helperId: string;
  status: ORDER_STATUS;
  createdAt: string;
}

// ===== 认证相关 =====

export interface WechatLoginRequest {
  code: string;
}

export interface PasswordLoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
}

export interface AdminLoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: UserInfo;
}
