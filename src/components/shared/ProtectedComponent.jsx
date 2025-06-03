import React from 'react';
import { usePermissions } from '../../hooks/usePermissions';

/**
 * ProtectedComponent - Conditionally renders children based on user permissions
 * 
 * @param {string|string[]} permission - Single permission or array of permissions
 * @param {string|string[]} roles - Single role or array of roles (alternative to permission)
 * @param {string} feature - Feature name to check access for
 * @param {boolean} requireAll - If true, user must have ALL permissions (default: false - ANY permission)
 * @param {React.ReactNode} children - Content to render if user has permission
 * @param {React.ReactNode} fallback - Content to render if user lacks permission
 * @param {boolean} showFallback - Whether to show fallback content (default: false - render nothing)
 * @param {boolean} invert - If true, renders children when user LACKS permission (default: false)
 */
const ProtectedComponent = ({ 
  permission, 
  roles, 
  feature,
  requireAll = false, 
  children, 
  fallback = null, 
  showFallback = false,
  invert = false
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, canAccessFeature, userRoles } = usePermissions();
  
  let hasAccess = false;
  
  if (feature) {
    hasAccess = canAccessFeature(feature);
  } else if (permission) {
    const permissions = Array.isArray(permission) ? permission : [permission];
    hasAccess = requireAll 
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
  } else if (roles) {
    const requiredRoles = Array.isArray(roles) ? roles : [roles];
    hasAccess = userRoles.some(userRole => {
      const roleId = typeof userRole === 'string' ? userRole : userRole.id;
      return requiredRoles.includes(roleId);
    });
  }
  
  // Apply invert logic
  const shouldRender = invert ? !hasAccess : hasAccess;
  
  if (shouldRender) {
    return children;
  }
  
  return showFallback ? fallback : null;
};

export default ProtectedComponent; 