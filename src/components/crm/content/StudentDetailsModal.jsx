import React, { useState } from 'react';
import { X } from 'lucide-react';
import StudentInfoTab from './StudentInfoTab';
import StudentCoursesTab from './StudentCoursesTab';
import StudentPaymentsTab from './StudentPaymentsTab';

const StudentDetailsModal = ({ 
  student, 
  isOpen, 
  onClose, 
  updateStudent,
  countries,
  addCountry,
  cities,
  addCity,
  platforms,
  addPlatform,
  categories,
  addCategory
}) => {
  const [activeTab, setActiveTab] = useState('info');

  if (!isOpen || !student) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'info':
        return (
          <StudentInfoTab
            student={student}
            updateStudent={updateStudent}
            countries={countries}
            addCountry={addCountry}
            cities={cities}
            addCity={addCity}
            platforms={platforms}
            addPlatform={addPlatform}
            categories={categories}
            addCategory={addCategory}
          />
        );
      
      case 'courses':
        return <StudentCoursesTab student={student} />;
      
      case 'payments':
        return <StudentPaymentsTab student={student} />;
        
      default:
        return null;
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl mx-4 my-8 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center space-x-4">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-medium text-lg flex-shrink-0"
              style={{ backgroundColor: student.avatarColor || '#6B7280' }}
            >
              {student.avatar}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{student.name}</h2>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        
        {/* Tabs */}
        <div className="border-b border-gray-100">
          <div className="flex space-x-8 px-6">
            <button
              className={`py-3 text-sm font-medium border-b-2 ${
                activeTab === 'info' 
                  ? 'border-indigo-600 text-indigo-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('info')}
            >
              Student Information
            </button>
            <button
              className={`py-3 text-sm font-medium border-b-2 ${
                activeTab === 'courses' 
                  ? 'border-indigo-600 text-indigo-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('courses')}
            >
              Courses
            </button>
            <button
              className={`py-3 text-sm font-medium border-b-2 ${
                activeTab === 'payments' 
                  ? 'border-indigo-600 text-indigo-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('payments')}
            >
              Payments
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6 min-h-[480px]">
          <div className="transition-opacity duration-200 ease-in-out">
            {renderTabContent()}
          </div>
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentDetailsModal; 