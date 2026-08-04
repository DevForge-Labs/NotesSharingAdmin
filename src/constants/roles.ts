export const Roles = {
  USER: 'user',
  ADMIN: 'admin',
  SUPERADMIN: 'superadmin',
} as const;

export type RoleType = typeof Roles[keyof typeof Roles];
