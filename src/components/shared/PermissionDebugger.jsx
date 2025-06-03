import React, { useState } from 'react';
import { usePermissions } from '../../hooks/usePermissions';
import { PERMISSIONS, PERMISSION_GROUPS } from '../../utils/permissions';
import { Shield, ShieldCheck, ShieldX, Eye, EyeOff, User, Settings } from 'lucide-react';

/**
 * PermissionBadge - Shows individual permission status
 */
const PermissionBadge = ({ permission, hasPermission, className = "" }) => {
  return (
    <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded text-xs ${className}`}>
      {hasPermission ? (
        <ShieldCheck className="w-3 h-3 text-green-500" />
      ) : (
        <ShieldX className="w-3 h-3 text-red-500" />
      )}
      <span className={`font-medium ${hasPermission ? 'text-green-700' : 'text-red-700'}`}>
        {permission.replace(/_/g, ' ').toLowerCase()}
      </span>
    </div>
  );
};

/**
 * PermissionDebugger - Shows all user permissions for debugging
 */
const PermissionDebugger = ({ className = "", compact = false }) => {
  const { 
    userPermissions, 
    userRoles, 
    permissionLevel,
    hasPermission,
    isAdmin,
    isManager,
    canModerate,
    canManageFinances,
    canManageStudents,
    canTeach,
    debug
  } = usePermissions();
  
  const [isVisible, setIsVisible] = useState(false);
  const [activeGroup, setActiveGroup] = useState('ALL');
  
  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return null;
  }
  
  const groupedPermissions = Object.entries(PERMISSION_GROUPS).reduce((acc, [groupName, permissions]) => {
    acc[groupName] = permissions.filter(permission => 
      activeGroup === 'ALL' || activeGroup === groupName
    );
    return acc;
  }, {});
  
  // Add ungrouped permissions
  const ungroupedPermissions = Object.values(PERMISSIONS).filter(permission => {
    return !Object.values(PERMISSION_GROUPS).flat().includes(permission) &&
           (activeGroup === 'ALL' || activeGroup === 'OTHER');
  });
  
  if (ungroupedPermissions.length > 0) {
    groupedPermissions.OTHER = ungroupedPermissions;
  }
  
  const roleChecks = {
    'Admin': isAdmin,
    'Manager': isManager,
    'Can Moderate': canModerate,
    'Can Manage Finances': canManageFinances,
    'Can Manage Students': canManageStudents,
    'Can Teach': canTeach
  };
  
  if (compact) {
    return (
      <div className={`bg-gray-900 text-white p-2 rounded-lg text-xs ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4" />
            <span className="font-medium">{permissionLevel}</span>
            <span className="text-gray-400">({userPermissions.length} permissions)</span>
          </div>
          <button
            onClick={() => setIsVisible(!isVisible)}
            className="text-gray-400 hover:text-white"
          >
            {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        
        {isVisible && (
          <div className="mt-2 pt-2 border-t border-gray-700">
            <div className="grid grid-cols-2 gap-1">
              {userPermissions.slice(0, 6).map(permission => (
                <PermissionBadge 
                  key={permission} 
                  permission={permission} 
                  hasPermission={true}
                  className="bg-green-900 text-green-100"
                />
              ))}
              {userPermissions.length > 6 && (
                <span className="text-gray-400 text-xs">
                  +{userPermissions.length - 6} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div className={`bg-gray-100 border border-gray-300 rounded-lg ${className}`}>
      {/* Header */}
      <div className="bg-gray-800 text-white px-4 py-3 rounded-t-lg">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold flex items-center">
            <Shield className="w-4 h-4 mr-2" />
            Permission Debugger
          </h4>
          <button
            onClick={() => setIsVisible(!isVisible)}
            className="text-gray-300 hover:text-white"
          >
            {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>
      
      {isVisible && (
        <div className="p-4 space-y-4">
          {/* User Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <User className="w-4 h-4 mr-1" />
                User Roles
              </h5>
              <div className="flex flex-wrap gap-1">
                {userRoles.map((role, index) => (
                  <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded font-medium">
                    {typeof role === 'string' ? role : role.name || role.id}
                  </span>
                ))}
                {userRoles.length === 0 && (
                  <span className="text-gray-500 text-xs">No roles assigned</span>
                )}
              </div>
            </div>
            
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Settings className="w-4 h-4 mr-1" />
                Permission Level
              </h5>
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 bg-indigo-100 text-indigo-800 text-sm rounded font-medium">
                  {permissionLevel}
                </span>
                <span className="text-gray-500 text-xs">
                  {userPermissions.length} permissions
                </span>
              </div>
            </div>
          </div>
          
          {/* Role Checks */}
          <div>
            <h5 className="text-sm font-medium text-gray-700 mb-2">Quick Role Checks</h5>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {Object.entries(roleChecks).map(([label, hasAccess]) => (
                <div key={label} className="flex items-center space-x-2">
                  {hasAccess ? (
                    <ShieldCheck className="w-4 h-4 text-green-500" />
                  ) : (
                    <ShieldX className="w-4 h-4 text-red-500" />
                  )}
                  <span className={`text-xs ${hasAccess ? 'text-green-700' : 'text-red-700'}`}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Permission Groups Filter */}
          <div>
            <h5 className="text-sm font-medium text-gray-700 mb-2">Permission Groups</h5>
            <div className="flex flex-wrap gap-1 mb-3">
              <button
                onClick={() => setActiveGroup('ALL')}
                className={`px-2 py-1 text-xs rounded ${
                  activeGroup === 'ALL' 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                All
              </button>
              {Object.keys(PERMISSION_GROUPS).map(groupName => (
                <button
                  key={groupName}
                  onClick={() => setActiveGroup(groupName)}
                  className={`px-2 py-1 text-xs rounded ${
                    activeGroup === groupName 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {groupName.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>
          
          {/* Permissions List */}
          <div className="max-h-64 overflow-y-auto">
            {Object.entries(groupedPermissions).map(([groupName, permissions]) => (
              permissions.length > 0 && (
                <div key={groupName} className="mb-4">
                  {activeGroup === 'ALL' && (
                    <h6 className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-2">
                      {groupName.replace(/_/g, ' ')}
                    </h6>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                    {permissions.map(permission => (
                      <PermissionBadge 
                        key={permission} 
                        permission={permission} 
                        hasPermission={hasPermission(permission)}
                        className={hasPermission(permission) ? 'bg-green-50' : 'bg-red-50'}
                      />
                    ))}
                  </div>
                </div>
              )
            ))}
          </div>
          
          {/* Debug Data */}
          {debug && (
            <details className="text-xs">
              <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                Raw Debug Data
              </summary>
              <pre className="mt-2 p-2 bg-gray-800 text-green-400 rounded text-xs overflow-auto">
                {JSON.stringify(debug, null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * UserPermissionsDebug - Simplified version for quick debugging
 */
export const UserPermissionsDebug = ({ className = "" }) => {
  return <PermissionDebugger className={className} compact={true} />;
};

export default PermissionDebugger; 