// src/utils/roleUtils.js
import { hasPermission, PERMISSIONS } from './permissions';

export const hasManagementRole = (userRoles) => {
    return hasPermission(userRoles, PERMISSIONS.MANAGE_USERS) || 
           hasPermission(userRoles, PERMISSIONS.ACCESS_ADMIN_PANEL);
};

export const canDeleteChannel = (userRoles) => {
    return hasPermission(userRoles, PERMISSIONS.DELETE_ANY_CHANNEL);
};

export const canManageChannelMembers = (userRoles, channel, userId) => {
    // Channel creator or admin can manage members
    if (channel.createdBy === userId || channel.admins?.includes(userId)) {
        return true;
    }
    
    // Check role-based permissions
    return hasPermission(userRoles, PERMISSIONS.MANAGE_CHANNEL_SETTINGS);
};

// Export new permission-based functions for easy access
export { 
    hasPermission, 
    hasAnyPermission, 
    hasAllPermissions, 
    getUserPermissions, 
    canAccessFeature, 
    isAdmin, 
    isManager, 
    canModerate, 
    canManageFinances,
    canManageStudents,
    canTeach,
    getUserPermissionLevel,
    PERMISSIONS,
    PERMISSION_GROUPS
} from './permissions';