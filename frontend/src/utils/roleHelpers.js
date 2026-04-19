export const ROLES = {
  ADMIN: 'admin',
  STAFF: 'staff',
  STUDENT: 'student'
}

export const PERMISSIONS = {
  MANAGE_USERS: 'manage_users',
  MANAGE_ATTENDANCE: 'manage_attendance',
  VIEW_REPORTS: 'view_reports',
  MANAGE_SETTINGS: 'manage_settings'
}

export const canAccess = (userRole, permission) => {
  const rolePermissions = {
    admin: [PERMISSIONS.MANAGE_USERS, PERMISSIONS.MANAGE_ATTENDANCE, PERMISSIONS.VIEW_REPORTS, PERMISSIONS.MANAGE_SETTINGS],
    staff: [PERMISSIONS.MANAGE_ATTENDANCE, PERMISSIONS.VIEW_REPORTS],
    student: [PERMISSIONS.VIEW_REPORTS]
  }
  return rolePermissions[userRole]?.includes(permission) || false
}