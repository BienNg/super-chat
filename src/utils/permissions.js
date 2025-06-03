// src/utils/permissions.js

// Define all possible permissions in the system
export const PERMISSIONS = {
  // User Management
  MANAGE_USERS: 'manage_users',
  VIEW_ALL_PROFILES: 'view_all_profiles',
  EDIT_USER_ROLES: 'edit_user_roles',
  DELETE_USERS: 'delete_users',
  
  // Channel Management
  CREATE_CHANNELS: 'create_channels',
  DELETE_ANY_CHANNEL: 'delete_any_channel',
  MANAGE_CHANNEL_SETTINGS: 'manage_channel_settings',
  MODERATE_CHANNELS: 'moderate_channels',
  
  // Content Management
  DELETE_ANY_MESSAGE: 'delete_any_message',
  EDIT_ANY_MESSAGE: 'edit_any_message',
  MODERATE_CONTENT: 'moderate_content',
  MANAGE_FILES: 'manage_files',
  
  // Class Management
  CREATE_CLASSES: 'create_classes',
  MANAGE_ALL_CLASSES: 'manage_all_classes',
  VIEW_CLASS_ANALYTICS: 'view_class_analytics',
  MANAGE_ENROLLMENTS: 'manage_enrollments',
  
  // Financial
  VIEW_PAYMENTS: 'view_payments',
  MANAGE_PAYMENTS: 'manage_payments',
  CREATE_DISCOUNTS: 'create_discounts',
  VIEW_FINANCIAL_REPORTS: 'view_financial_reports',
  
  // Analytics & Reporting
  VIEW_ANALYTICS: 'view_analytics',
  EXPORT_DATA: 'export_data',
  VIEW_SYSTEM_LOGS: 'view_system_logs',
  
  // System Administration
  MANAGE_SYSTEM_SETTINGS: 'manage_system_settings',
  ACCESS_ADMIN_PANEL: 'access_admin_panel',
  MANAGE_INTEGRATIONS: 'manage_integrations',
  
  // Student Management
  MANAGE_STUDENTS: 'manage_students',
  VIEW_STUDENT_PROFILES: 'view_student_profiles',
  MANAGE_VISA_APPLICATIONS: 'manage_visa_applications',
  
  // Communication
  SEND_ANNOUNCEMENTS: 'send_announcements',
  MANAGE_NOTIFICATIONS: 'manage_notifications',
  ACCESS_SUPPORT_TOOLS: 'access_support_tools'
};

// Define which permissions each role has
export const ROLE_PERMISSIONS = {
  admin: [
    // All permissions
    ...Object.values(PERMISSIONS)
  ],
  manager: [
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.VIEW_ALL_PROFILES,
    PERMISSIONS.DELETE_ANY_CHANNEL,
    PERMISSIONS.MANAGE_CHANNEL_SETTINGS,
    PERMISSIONS.MODERATE_CHANNELS,
    PERMISSIONS.MODERATE_CONTENT,
    PERMISSIONS.MANAGE_ALL_CLASSES,
    PERMISSIONS.VIEW_CLASS_ANALYTICS,
    PERMISSIONS.MANAGE_ENROLLMENTS,
    PERMISSIONS.VIEW_PAYMENTS,
    PERMISSIONS.VIEW_FINANCIAL_REPORTS,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.EXPORT_DATA,
    PERMISSIONS.MANAGE_STUDENTS,
    PERMISSIONS.VIEW_STUDENT_PROFILES,
    PERMISSIONS.SEND_ANNOUNCEMENTS,
    PERMISSIONS.MANAGE_NOTIFICATIONS
  ],
  teacher: [
    PERMISSIONS.CREATE_CHANNELS,
    PERMISSIONS.CREATE_CLASSES,
    PERMISSIONS.VIEW_CLASS_ANALYTICS,
    PERMISSIONS.MANAGE_ENROLLMENTS,
    PERMISSIONS.VIEW_STUDENT_PROFILES,
    PERMISSIONS.MANAGE_STUDENTS,
    PERMISSIONS.MODERATE_CONTENT,
    PERMISSIONS.SEND_ANNOUNCEMENTS
  ],
  accountant: [
    PERMISSIONS.VIEW_PAYMENTS,
    PERMISSIONS.MANAGE_PAYMENTS,
    PERMISSIONS.CREATE_DISCOUNTS,
    PERMISSIONS.VIEW_FINANCIAL_REPORTS,
    PERMISSIONS.EXPORT_DATA,
    PERMISSIONS.VIEW_STUDENT_PROFILES
  ],
  support: [
    PERMISSIONS.VIEW_ALL_PROFILES,
    PERMISSIONS.MODERATE_CONTENT,
    PERMISSIONS.MANAGE_FILES,
    PERMISSIONS.ACCESS_SUPPORT_TOOLS,
    PERMISSIONS.VIEW_STUDENT_PROFILES,
    PERMISSIONS.MANAGE_STUDENTS,
    PERMISSIONS.MANAGE_NOTIFICATIONS
  ],
  visa: [
    PERMISSIONS.VIEW_ALL_PROFILES,
    PERMISSIONS.MANAGE_ENROLLMENTS,
    PERMISSIONS.EXPORT_DATA,
    PERMISSIONS.MANAGE_VISA_APPLICATIONS,
    PERMISSIONS.VIEW_STUDENT_PROFILES,
    PERMISSIONS.MANAGE_STUDENTS
  ],
  social: [
    PERMISSIONS.CREATE_CHANNELS,
    PERMISSIONS.MODERATE_CONTENT,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.SEND_ANNOUNCEMENTS,
    PERMISSIONS.MANAGE_NOTIFICATIONS
  ]
};

// Core permission checking functions
export const hasPermission = (userRoles, permission) => {
  if (!userRoles || !Array.isArray(userRoles)) return false;
  
  return userRoles.some(role => {
    const roleId = typeof role === 'string' ? role : role.id;
    const permissions = ROLE_PERMISSIONS[roleId] || [];
    return permissions.includes(permission);
  });
};

export const hasAnyPermission = (userRoles, permissions) => {
  if (!permissions || !Array.isArray(permissions)) return false;
  return permissions.some(permission => hasPermission(userRoles, permission));
};

export const hasAllPermissions = (userRoles, permissions) => {
  if (!permissions || !Array.isArray(permissions)) return false;
  return permissions.every(permission => hasPermission(userRoles, permission));
};

export const getUserPermissions = (userRoles) => {
  if (!userRoles || !Array.isArray(userRoles)) return [];
  
  const allPermissions = new Set();
  userRoles.forEach(role => {
    const roleId = typeof role === 'string' ? role : role.id;
    const permissions = ROLE_PERMISSIONS[roleId] || [];
    permissions.forEach(permission => allPermissions.add(permission));
  });
  
  return Array.from(allPermissions);
};

export const canAccessFeature = (userRoles, feature) => {
  const featurePermissions = {
    'admin-panel': [PERMISSIONS.ACCESS_ADMIN_PANEL],
    'user-management': [PERMISSIONS.MANAGE_USERS],
    'financial-dashboard': [PERMISSIONS.VIEW_PAYMENTS, PERMISSIONS.VIEW_FINANCIAL_REPORTS],
    'analytics': [PERMISSIONS.VIEW_ANALYTICS],
    'system-logs': [PERMISSIONS.VIEW_SYSTEM_LOGS],
    'student-management': [PERMISSIONS.MANAGE_STUDENTS, PERMISSIONS.VIEW_STUDENT_PROFILES],
    'class-management': [PERMISSIONS.CREATE_CLASSES, PERMISSIONS.MANAGE_ALL_CLASSES],
    'visa-management': [PERMISSIONS.MANAGE_VISA_APPLICATIONS]
  };
  
  const requiredPermissions = featurePermissions[feature] || [];
  return hasAnyPermission(userRoles, requiredPermissions);
};

// Helper functions for common checks
export const isAdmin = (userRoles) => hasPermission(userRoles, PERMISSIONS.ACCESS_ADMIN_PANEL);
export const isManager = (userRoles) => hasPermission(userRoles, PERMISSIONS.MANAGE_USERS);
export const canModerate = (userRoles) => hasPermission(userRoles, PERMISSIONS.MODERATE_CONTENT);
export const canManageFinances = (userRoles) => hasPermission(userRoles, PERMISSIONS.MANAGE_PAYMENTS);
export const canManageStudents = (userRoles) => hasPermission(userRoles, PERMISSIONS.MANAGE_STUDENTS);
export const canTeach = (userRoles) => hasPermission(userRoles, PERMISSIONS.CREATE_CLASSES);

// Permission groups for easier management
export const PERMISSION_GROUPS = {
  USER_MANAGEMENT: [
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.VIEW_ALL_PROFILES,
    PERMISSIONS.EDIT_USER_ROLES,
    PERMISSIONS.DELETE_USERS
  ],
  CONTENT_MANAGEMENT: [
    PERMISSIONS.DELETE_ANY_MESSAGE,
    PERMISSIONS.EDIT_ANY_MESSAGE,
    PERMISSIONS.MODERATE_CONTENT,
    PERMISSIONS.MANAGE_FILES
  ],
  FINANCIAL: [
    PERMISSIONS.VIEW_PAYMENTS,
    PERMISSIONS.MANAGE_PAYMENTS,
    PERMISSIONS.CREATE_DISCOUNTS,
    PERMISSIONS.VIEW_FINANCIAL_REPORTS
  ],
  ACADEMIC: [
    PERMISSIONS.CREATE_CLASSES,
    PERMISSIONS.MANAGE_ALL_CLASSES,
    PERMISSIONS.VIEW_CLASS_ANALYTICS,
    PERMISSIONS.MANAGE_ENROLLMENTS
  ],
  SYSTEM_ADMIN: [
    PERMISSIONS.MANAGE_SYSTEM_SETTINGS,
    PERMISSIONS.ACCESS_ADMIN_PANEL,
    PERMISSIONS.MANAGE_INTEGRATIONS,
    PERMISSIONS.VIEW_SYSTEM_LOGS
  ]
};

// Get permission group name for a permission
export const getPermissionGroup = (permission) => {
  for (const [groupName, permissions] of Object.entries(PERMISSION_GROUPS)) {
    if (permissions.includes(permission)) {
      return groupName;
    }
  }
  return 'OTHER';
};

// Check if user has any permissions in a group
export const hasPermissionInGroup = (userRoles, groupName) => {
  const groupPermissions = PERMISSION_GROUPS[groupName] || [];
  return hasAnyPermission(userRoles, groupPermissions);
};

// Get user's permission level (for display purposes)
export const getUserPermissionLevel = (userRoles) => {
  if (isAdmin(userRoles)) return 'Administrator';
  if (isManager(userRoles)) return 'Manager';
  if (canTeach(userRoles)) return 'Teacher';
  if (canManageFinances(userRoles)) return 'Financial Staff';
  if (canModerate(userRoles)) return 'Support Staff';
  return 'Standard User';
};

// Validate role permissions (for admin interface)
export const validateRolePermissions = (roleId, permissions) => {
  const validPermissions = Object.values(PERMISSIONS);
  const invalidPermissions = permissions.filter(p => !validPermissions.includes(p));
  
  return {
    isValid: invalidPermissions.length === 0,
    invalidPermissions,
    validPermissions: permissions.filter(p => validPermissions.includes(p))
  };
}; 