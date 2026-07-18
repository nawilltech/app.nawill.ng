/** The `users` fields safe to return from any endpoint — never passwordHash or twoFactorSecret. */
export const SAFE_USER_SELECT = {
  id: true,
  name: true,
  email: true,
  userType: true,
  clientType: true,
  organizationId: true,
  phoneNo: true,
  emailVerifiedAt: true,
  twoFactorMethod: true,
  lastLoginAt: true,
  createdAt: true,
} as const;
