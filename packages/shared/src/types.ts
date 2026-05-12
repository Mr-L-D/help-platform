import type { TaskType, RewardType, TaskStatus, OrderStatus, UserRole } from './enums';

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
  role: UserRole;
  phone?: string;
  points: number;
  createdAt: string;
}

/** 分类 */
export interface Category {
  id: string;
  name: string;
  icon: string;
  type: TaskType;
}

/** 任务 */
export interface Task {
  id: string;
  title: string;
  description: string;
  type: TaskType;
  category: Category;
  rewardType: RewardType;
  rewardAmount?: number;
  images: string[];
  location?: string;
  status: TaskStatus;
  publisher: Pick<UserInfo, 'id' | 'nickname' | 'avatar'>;
  createdAt: string;
}

/** 接单记录 */
export interface Order {
  id: string;
  taskId: string;
  helperId: string;
  status: OrderStatus;
  createdAt: string;
}
