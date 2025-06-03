import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  hasPermission, 
  hasAnyPermission, 
  hasAllPermissions, 
  getUserPermissions, 
  canAccessFeature,
  getUserPermissionLevel,
  isAdmin,
  isManager,
  canModerate,
  canManageFinances,
  canManageStudents,
  canTeach
} from '../utils/permissions';

export const usePermissions = () => {
  const { userProfile } = useAuth();
  
  const userRoles = useMemo(() => {
    return userProfile?.roles || [];
  }, [userProfile?.roles]);
  
  const userPermissions = useMemo(() => {
    return getUserPermissions(userRoles);
  }, [userRoles]);
  
  const permissionLevel = useMemo(() => {
    return getUserPermissionLevel(userRoles);
  }, [userRoles]);
  
  const checkPermission = useMemo(() => {
    return (permission) => hasPermission(userRoles, permission);
  }, [userRoles]);
  
  const checkAnyPermission = useMemo(() => {
    return (permissions) => hasAnyPermission(userRoles, permissions);
  }, [userRoles]);
  
  const checkAllPermissions = useMemo(() => {
    return (permissions) => hasAllPermissions(userRoles, permissions);
  }, [userRoles]);
  
  const checkFeatureAccess = useMemo(() => {
    return (feature) => canAccessFeature(userRoles, feature);
  }, [userRoles]);
  
  // Role-based checks
  const roleChecks = useMemo(() => ({
    isAdmin: isAdmin(userRoles),
    isManager: isManager(userRoles),
    canModerate: canModerate(userRoles),
    canManageFinances: canManageFinances(userRoles),
    canManageStudents: canManageStudents(userRoles),
    canTeach: canTeach(userRoles)
  }), [userRoles]);
  
  return {
    // User data
    userRoles,
    userPermissions,
    permissionLevel,
    
    // Permission checking functions
    hasPermission: checkPermission,
    hasAnyPermission: checkAnyPermission,
    hasAllPermissions: checkAllPermissions,
    canAccessFeature: checkFeatureAccess,
    
    // Role-based checks
    ...roleChecks,
    
    // Utility functions
    hasRole: (roleId) => userRoles.some(role => 
      (typeof role === 'string' ? role : role.id) === roleId
    ),
    
    getRoleNames: () => userRoles.map(role => 
      typeof role === 'string' ? role : role.name || role.id
    ),
    
    // Debug information (only in development)
    debug: process.env.NODE_ENV === 'development' ? {
      userProfile,
      userRoles,
      userPermissions,
      permissionLevel
    } : null
  };
}; 