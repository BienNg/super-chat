import React from 'react';
import { usePermissions } from '../../hooks/usePermissions';
import { PERMISSIONS } from '../../utils/permissions';
import ProtectedComponent from './ProtectedComponent';
import PermissionDebugger, { UserPermissionsDebug } from './PermissionDebugger';
import { Shield, Users, DollarSign, BookOpen, Settings, AlertTriangle } from 'lucide-react';

/**
 * PermissionTestComponent - Demonstrates the permission system usage
 * This component should only be used in development for testing
 */
const PermissionTestComponent = () => {
  const { 
    hasPermission, 
    permissionLevel, 
    userRoles,
    isAdmin,
    isManager,
    canModerate,
    canManageFinances,
    canTeach
  } = usePermissions();
  
  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return null;
  }
  
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 text-yellow-800">
          <AlertTriangle className="w-5 h-5" />
          <h2 className="text-lg font-semibold">Permission System Test Component</h2>
        </div>
        <p className="text-yellow-700 text-sm mt-1">
          This component demonstrates the permission system and is only visible in development mode.
        </p>
      </div>
      
      {/* Quick Status */}
      <UserPermissionsDebug className="mb-4" />
      
      {/* Permission Examples */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Admin Panel Access */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            Admin Panel Access
          </h3>
          
          <ProtectedComponent permission={PERMISSIONS.ACCESS_ADMIN_PANEL}>
            <div className="p-3 bg-green-50 border border-green-200 rounded text-green-800">
              ✅ You have admin panel access!
            </div>
          </ProtectedComponent>
          
          <ProtectedComponent 
            permission={PERMISSIONS.ACCESS_ADMIN_PANEL} 
            invert={true}
            showFallback={true}
            fallback={
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800">
                ❌ Admin panel access denied
              </div>
            }
          />
        </div>
        
        {/* User Management */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <Users className="w-5 h-5 mr-2" />
            User Management
          </h3>
          
          <ProtectedComponent permission={PERMISSIONS.MANAGE_USERS}>
            <button className="w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
              Manage Users
            </button>
          </ProtectedComponent>
          
          <ProtectedComponent 
            permission={PERMISSIONS.MANAGE_USERS}
            invert={true}
            showFallback={true}
            fallback={
              <button className="w-full px-4 py-2 bg-gray-300 text-gray-500 rounded cursor-not-allowed" disabled>
                Manage Users (No Permission)
              </button>
            }
          />
        </div>
        
        {/* Financial Access */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <DollarSign className="w-5 h-5 mr-2" />
            Financial Dashboard
          </h3>
          
          <ProtectedComponent feature="financial-dashboard">
            <div className="space-y-2">
              <div className="p-2 bg-blue-50 border border-blue-200 rounded text-blue-800 text-sm">
                💰 View Payments
              </div>
              <div className="p-2 bg-blue-50 border border-blue-200 rounded text-blue-800 text-sm">
                📊 Financial Reports
              </div>
            </div>
          </ProtectedComponent>
          
          <ProtectedComponent 
            feature="financial-dashboard"
            invert={true}
            showFallback={true}
            fallback={
              <div className="p-3 bg-gray-50 border border-gray-200 rounded text-gray-600 text-sm">
                Financial access restricted
              </div>
            }
          />
        </div>
        
        {/* Teaching Tools */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <BookOpen className="w-5 h-5 mr-2" />
            Teaching Tools
          </h3>
          
          <ProtectedComponent permission={[PERMISSIONS.CREATE_CLASSES, PERMISSIONS.MANAGE_ENROLLMENTS]} requireAll={false}>
            <div className="space-y-2">
              <ProtectedComponent permission={PERMISSIONS.CREATE_CLASSES}>
                <button className="w-full px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700">
                  Create Class
                </button>
              </ProtectedComponent>
              
              <ProtectedComponent permission={PERMISSIONS.MANAGE_ENROLLMENTS}>
                <button className="w-full px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                  Manage Enrollments
                </button>
              </ProtectedComponent>
            </div>
          </ProtectedComponent>
          
          <ProtectedComponent 
            permission={[PERMISSIONS.CREATE_CLASSES, PERMISSIONS.MANAGE_ENROLLMENTS]}
            invert={true}
            showFallback={true}
            fallback={
              <div className="p-3 bg-gray-50 border border-gray-200 rounded text-gray-600 text-sm">
                No teaching permissions
              </div>
            }
          />
        </div>
      </div>
      
      {/* Role-based Examples */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
          <Shield className="w-5 h-5 mr-2" />
          Role-based Access Examples
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <ProtectedComponent roles={['admin']}>
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm text-center">
              Admin Only
            </div>
          </ProtectedComponent>
          
          <ProtectedComponent roles={['manager', 'admin']}>
            <div className="p-3 bg-purple-50 border border-purple-200 rounded text-purple-800 text-sm text-center">
              Manager+
            </div>
          </ProtectedComponent>
          
          <ProtectedComponent roles={['teacher']}>
            <div className="p-3 bg-green-50 border border-green-200 rounded text-green-800 text-sm text-center">
              Teacher
            </div>
          </ProtectedComponent>
          
          <ProtectedComponent roles={['accountant']}>
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-sm text-center">
              Accountant
            </div>
          </ProtectedComponent>
        </div>
      </div>
      
      {/* Permission Summary */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Permission Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <span className={`w-3 h-3 rounded-full ${isAdmin ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span>Admin Access</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`w-3 h-3 rounded-full ${isManager ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span>Manager Access</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`w-3 h-3 rounded-full ${canModerate ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span>Can Moderate</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`w-3 h-3 rounded-full ${canManageFinances ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span>Financial Access</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`w-3 h-3 rounded-full ${canTeach ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span>Teaching Access</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
            <span>{permissionLevel}</span>
          </div>
        </div>
      </div>
      
      {/* Full Permission Debugger */}
      <PermissionDebugger />
    </div>
  );
};

export default PermissionTestComponent; 