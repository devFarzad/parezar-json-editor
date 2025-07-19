export type UserRole = 'admin' | 'operator' | 'cleaner';

// Defines the navigation paths accessible to each role.
const rolePermissions: Record<UserRole, string[]> = {
  admin: ['/dashboard', '/dashboard/aws-files', '/dashboard/analytics', '/dashboard/users', '/dashboard/notification-templates', '/dashboard/plans', '/dashboard/settings'],
  operator: ['/dashboard', '/dashboard/aws-files', '/dashboard/analytics', '/dashboard/notification-templates', '/dashboard/plans', '/dashboard/settings'],
  cleaner: ['/dashboard', '/dashboard/aws-files', '/dashboard/settings'],
};

/**
 * Checks if a user with a given role has access to a specific navigation path.
 * An 'admin' role will always have access.
 * @param role The role of the user ('admin', 'operator', 'cleaner').
 * @param path The navigation path (e.g., '/dashboard/users').
 * @returns `true` if the user is permitted to access the path, otherwise `false`.
 */
export const canAccess = (role: UserRole | string | null, path: string): boolean => {
  if (!role) {
    return false;
  }
  if (role === 'admin') {
    return true; // Admins have universal access to all defined paths.
  }
  
  // Check if the path is in the allowed list for the given role.
  return rolePermissions[role as UserRole]?.includes(path) ?? false;
}; 