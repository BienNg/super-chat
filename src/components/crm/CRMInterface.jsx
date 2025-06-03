import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import { CRMLayout } from './layout';
import StudentsInterface from './content/StudentsInterface';
import DatabaseInitializer from './content/DatabaseInitializer';
import InterfaceWrapper from '../shared/InterfaceWrapper';
import { Database } from 'lucide-react';

/**
 * CRMInterface - Main CRM application component
 * Handles the CRM system interface with student management
 */
const CRMInterface = () => {
  const { currentUser, userProfile, logout } = useAuth();
  const { isAdmin } = usePermissions();
  const [showDatabaseInitializer, setShowDatabaseInitializer] = useState(false);
  const params = useParams();

  useEffect(() => {
    if (params.studentId) {
      // Handle student details route
      console.log('Student details route accessed:', params.studentId);
    }
  }, [params.studentId]);

  return (
    <InterfaceWrapper>
      <CRMLayout
        userProfile={userProfile}
        currentUser={currentUser}
        onLogout={logout}
      >
        {showDatabaseInitializer ? (
          <div className="flex-1 bg-gray-50 p-6">
            <div className="mb-4">
              <button
                onClick={() => setShowDatabaseInitializer(false)}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                ← Back to Students
              </button>
            </div>
            <DatabaseInitializer />
          </div>
        ) : (
          <>
            {/* Admin-only DB Admin Button */}
            {isAdmin && (
              <div className="absolute top-4 right-4 z-10">
                <button
                  onClick={() => setShowDatabaseInitializer(true)}
                  className="inline-flex items-center px-3 py-2 text-xs font-medium text-white bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                  title="Database Management"
                >
                  <Database className="w-4 h-4 mr-1" />
                  DB Admin
                </button>
              </div>
            )}
            <StudentsInterface />
          </>
        )}
      </CRMLayout>
    </InterfaceWrapper>
  );
};

export default CRMInterface; 