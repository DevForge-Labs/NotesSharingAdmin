export const AccountStatus = {
  ACTIVE: 'ACTIVE',
  DISABLED: 'DISABLED',
  AUTH_DELETED: 'AUTH_DELETED',
} as const;

export type AccountStatusType = typeof AccountStatus[keyof typeof AccountStatus];
