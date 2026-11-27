export type UserRole = "user" | "moderator" | "admin";

export function isStaffRole(role: UserRole): boolean {
  return role === "moderator" || role === "admin";
}

export function isAdminRole(role: UserRole): boolean {
  return role === "admin";
}

export function canManageCatalog(role: UserRole): boolean {
  return isStaffRole(role);
}

export function canManageOrders(role: UserRole): boolean {
  return isStaffRole(role);
}

export function canManageCouponsAndBanners(role: UserRole): boolean {
  return isStaffRole(role);
}

export function canManageSettings(role: UserRole): boolean {
  return isStaffRole(role);
}

export function canChangeUserRole(actorRole: UserRole): boolean {
  return actorRole === "admin";
}

export function canTouchTargetUser(actorRole: UserRole, targetRole: UserRole): boolean {
  if (actorRole === "admin") return true;
  if (actorRole === "moderator") {
    // Moderator can only block/unblock normal users; cannot touch moderators or admins.
    return targetRole === "user";
  }
  return false;
}

export function canBlockTargetUser(
  actorRole: UserRole,
  actorId: string,
  targetId: string,
  targetRole: UserRole
): boolean {
  if (actorId === targetId) return false;
  return canTouchTargetUser(actorRole, targetRole);
}
