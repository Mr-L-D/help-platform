/** 任务类型 */
export enum TaskType {
  HELP = 'HELP',
  SKILL = 'SKILL',
  COMMUNITY = 'COMMUNITY',
}

/** 悬赏类型 */
export enum RewardType {
  FREE = 'FREE',
  PAID = 'PAID',
}

/** 任务状态 */
export enum TaskStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

/** 接单状态 */
export enum OrderStatus {
  ACCEPTED = 'ACCEPTED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

/** 用户角色 */
export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}
