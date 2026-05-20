export enum TASK_TYPE {
  /** 求助 */
  HELP = 'HELP',
  /** 技能 */
  SKILL = 'SKILL',
  /** 社区 */
  COMMUNITY = 'COMMUNITY',
}

export enum REWARD_TYPE {
  /** 免费 */
  FREE = 'FREE',
  /** 付费 */
  PAID = 'PAID',
}

export enum TASK_STATUS {
  /** 待接单 */
  OPEN = 'OPEN',
  /** 进行中 */
  IN_PROGRESS = 'IN_PROGRESS',
  /** 已完成 */
  COMPLETED = 'COMPLETED',
  /** 已取消 */
  CANCELLED = 'CANCELLED',
}

export enum ORDER_STATUS {
  /** 已接单 */
  ACCEPTED = 'ACCEPTED',
  /** 已完成 */
  COMPLETED = 'COMPLETED',
  /** 已取消 */
  CANCELLED = 'CANCELLED',
}

export enum USER_ROLE {
  /** 普通用户 */
  USER = 'USER',
  /** 管理员 */
  ADMIN = 'ADMIN',
}
