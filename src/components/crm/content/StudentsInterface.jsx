import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Search, Download, Plus, Trash2, AlertTriangle, ChevronDown, Eye, Edit, MessageSquare } from 'lucide-react';
import AddStudentModal from './AddStudentModal';
import StudentDetailsModal from '../../shared/StudentDetailsModal';
import SendStudentToChatModal from './SendStudentToChatModal';
import { useStudents } from '../../../hooks/useStudents';
import { useCountries } from '../../../hooks/useCountries';
import { useCities } from '../../../hooks/useCities';
import { usePlatforms } from '../../../hooks/usePlatforms';
import { useCategories } from '../../../hooks/useCategories';
import { useClasses } from '../../../hooks/useClasses';
import { useEnrollments } from '../../../hooks/useEnrollments';
import FirebaseCollectionSelector from '../../shared/FirebaseCollectionSelector.jsx';
import { FirebaseMultiSelectSelector, ActionsDropdown } from '../../shared/index.js';

const StudentsInterface = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [editingCell, setEditingCell] = useState({ studentId: null, field: null });
  const [editValue, setEditValue] = useState('');
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [showSendToChatModal, setShowSendToChatModal] = useState(false);
  const [studentToShare, setStudentToShare] = useState(null);

  const navigate = useNavigate();
  const params = useParams();

  // Database hooks
  const { students, loading, error, addStudent, deleteStudent, updateStudent } = useStudents();
  const { getStudentEnrollments, updateEnrollment } = useEnrollments();
  const { countries, addCountry } = useCountries();
  const { cities, addCity } = useCities();
  const { platforms, addPlatform } = usePlatforms();
  const { categories, addCategory } = useCategories();

  // URL Parameter Handling
  useEffect(() => {
    if (params.studentId) {
      // Find the student by ID and open the details modal
      const student = students.find(s => s.id === params.studentId);
      if (student) {
        // Create enrollment-like object for the modal
        const enrollmentData = {
          studentId: student.id,
          studentName: student.name,
          studentEmail: student.email,
          studentPhone: student.phone,
          avatar: student.avatar,
          avatarColor: student.avatarColor
        };
        setSelectedEnrollment(enrollmentData);
        setDetailsModalOpen(true);
      }
    } else {
      // Close modal if no studentId in URL
      setDetailsModalOpen(false);
      setSelectedEnrollment(null);
    }
  }, [params.studentId, students]);

  // Function to handle opening student details via URL
  const handleViewStudentDetails = (studentId) => {
    navigate(`/crm/students/${studentId}`);
  };

  // Function to handle closing the modal
  const handleCloseStudentModal = () => {
    navigate('/crm');
  };

  const handleRowClick = (student) => {
    handleViewStudentDetails(student.id);
  };

  // Handle auto-save when editing cells
  const handleAutoSave = useCallback(async () => {
    if (!editingCell.studentId || !editingCell.field) return;
    
    // Function to update all enrollment records when student data changes
    const updateEnrollmentRecords = async (studentId, updates) => {
      try {
        console.log('=== CRM updateEnrollmentRecords DEBUG ===');
        console.log('Looking for enrollments with studentId:', studentId);
        console.log('Updates to apply:', updates);
        
        // Get all enrollments for this student
        const enrollments = await getStudentEnrollments(studentId);
        console.log('Found enrollments:', enrollments);
        console.log('Number of enrollments found:', enrollments.length);
        
        // Prepare enrollment updates based on what student fields changed
        const enrollmentUpdates = {};
        
        if (updates.name) {
          enrollmentUpdates.studentName = updates.name;
        }
        
        if (updates.email) {
          enrollmentUpdates.studentEmail = updates.email;
        }
        
        // Only update if there are relevant changes
        if (Object.keys(enrollmentUpdates).length > 0) {
          console.log(`Updating ${enrollments.length} enrollment records for student ${studentId}`);
          console.log('Enrollment updates to apply:', enrollmentUpdates);
          
          // Update each enrollment record
          const updatePromises = enrollments.map(enrollment => {
            console.log('Updating enrollment:', enrollment.id, 'with updates:', enrollmentUpdates);
            return updateEnrollment(enrollment.id, enrollmentUpdates);
          });
          
          await Promise.all(updatePromises);
          console.log('Successfully updated all enrollment records');
        } else {
          console.log('No relevant enrollment updates to apply');
        }
      } catch (error) {
        console.error('Error updating enrollment records:', error);
        // Don't throw here - we don't want to fail the student update if enrollment sync fails
      }
    };
    
    // Only save if the value has actually changed
    const student = students.find(s => s.id === editingCell.studentId);
    const currentValue = student?.[editingCell.field] || '';
    const newValue = editValue.trim();
    
    // Validation for name field
    if (editingCell.field === 'name') {
      if (newValue.length < 2) {
        // Silently restore previous value and exit edit mode
        setEditingCell({ studentId: null, field: null });
        setEditValue('');
        return;
      }
    }

    if (currentValue !== newValue) {
      try {
        const updates = {
          [editingCell.field]: newValue
        };
        
        // If updating name, also update the avatar text
        if (editingCell.field === 'name') {
          const avatarText = newValue.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
          updates.avatar = avatarText;
        }
        
        await updateStudent(editingCell.studentId, updates);
        
        // Update enrollment records if name or email changed
        if (editingCell.field === 'name' || editingCell.field === 'email') {
          await updateEnrollmentRecords(student.studentId || editingCell.studentId, updates);
        }
      } catch (error) {
        console.error('Error updating student:', error);
      }
    }
    
    setEditingCell({ studentId: null, field: null });
    setEditValue('');
  }, [editingCell.studentId, editingCell.field, editValue, students, updateStudent, getStudentEnrollments, updateEnrollment]);

  // Handle click outside to auto-save
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (editingCell.studentId && editingCell.field) {
        // Check if the click is outside the current editing input
        const clickedElement = event.target;
        const isInputClick = clickedElement.tagName === 'INPUT' && 
                            clickedElement.dataset.studentId === editingCell.studentId &&
                            clickedElement.dataset.field === editingCell.field;
    
        if (!isInputClick) {
          handleAutoSave();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [editingCell.studentId, editingCell.field, handleAutoSave]);

  // Filtered students - simplified to only search by name and email
  const filteredStudents = useMemo(() => {
    return students.filter(student =>
      student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [students, searchTerm]);

  const handleAddStudent = async (newStudent) => {
    try {
      await addStudent(newStudent);
      console.log('Student added successfully');
    } catch (error) {
      console.error('Error adding student:', error);
      // Re-throw the error so it can be caught by the modal
      throw error;
    }
  };

  const handleDeleteClick = (student, e) => {
    e.stopPropagation(); // Prevent row click
    setDeleteConfirm(student.id);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    
    try {
      await deleteStudent(deleteConfirm);
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting student:', error);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm(null);
  };

  const handleEditStart = (e, studentId, field, currentValue) => {
    e.stopPropagation(); // Prevent row click
    
    // Only allow editing if the field is empty
    const isEmpty = !currentValue || currentValue.trim() === '';
    if (isEmpty) {
      setEditingCell({ studentId, field });
      setEditValue(currentValue || '');
    }
  };

  const handleEditCancel = () => {
    setEditingCell({ studentId: null, field: null });
    setEditValue('');
  };

  const handleSendToChat = (student) => {
    setStudentToShare(student);
    setShowSendToChatModal(true);
  };

  const handleCloseSendToChatModal = () => {
    setShowSendToChatModal(false);
    setStudentToShare(null);
  };

  // Inline editable text component
  const renderInlineEditableText = (student, field, value, placeholder = "Add value") => {
    const isEditing = editingCell.studentId === student.id && editingCell.field === field;
    const isEmpty = !value || value.trim() === '';
    
    // Custom placeholders based on field type
    let customPlaceholder = placeholder;
    if (isEmpty) {
      switch (field) {
        case 'email':
          customPlaceholder = 'Add email';
          break;
        case 'phone':
          customPlaceholder = 'Add phone';
          break;
        case 'name':
          customPlaceholder = 'Enter name';
          break;
        default:
          customPlaceholder = placeholder;
      }
    }
    
    if (isEditing) {
      return (
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className="text-sm text-gray-900 bg-transparent border-b-2 border-indigo-500 outline-none focus:border-indigo-600 min-w-0 max-w-full"
          style={{ 
            textDecoration: 'underline', 
            textDecorationColor: '#6366f1',
            width: '100%',
            padding: '0',
            margin: '0'
          }}
          autoFocus
          data-student-id={student.id}
          data-field={field}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAutoSave();
            if (e.key === 'Escape') handleEditCancel();
          }}
          placeholder={customPlaceholder}
          onClick={(e) => e.stopPropagation()} // Prevent row click
        />
      );
    }
    
    const displayValue = value || customPlaceholder;
    const isPlaceholder = isEmpty;
    
    // Only make the cell appear editable if it's empty
    const isEditable = isEmpty;
    const cursorStyle = isEditable ? 'cursor-pointer' : 'cursor-default';
    const hoverStyle = isEditable ? 'hover:bg-gray-100 hover:underline' : '';
    const titleText = isEditable ? 'Click to add information' : 'Field already has data';
    
    return (
      <span
        className={`text-sm ${cursorStyle} ${hoverStyle} transition-all block ${
          isPlaceholder ? 'text-gray-400 italic' : 'text-gray-900'
        }`}
        onClick={(e) => isEditable ? handleEditStart(e, student.id, field, value) : e.stopPropagation()}
        title={titleText}
        style={{ padding: '0', margin: '0' }}
      >
        {displayValue}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex-1 bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading students...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-semibold text-gray-900">Students</h1>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Student
            </button>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-64"
              />
            </div>
            
            {/* Export Button */}
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 relative">
        <div className="absolute inset-0 overflow-auto">
          <table className="w-full table-fixed">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-64">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-56">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Country</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">City</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-36">Course/Service</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Payments</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Platform</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-36">Notes</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.map((student) => (
                <tr 
                  key={student.id} 
                  className="hover:bg-gray-50 h-20 cursor-pointer transition-colors"
                  onClick={() => handleRowClick(student)}
                >
                  <td className="px-6 py-4 whitespace-nowrap w-64 h-20">
                    <div className="flex items-center h-full">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-sm flex-shrink-0"
                        style={{ 
                          backgroundColor: student.avatarColor || '#6B7280'
                        }}
                      >
                        {student.avatar}
                      </div>
                      <div className="ml-4 min-w-0 flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          {renderInlineEditableText(student, 'name', student.name)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap w-56 h-20">
                    <div className="space-y-1 flex flex-col justify-center h-full">
                      <div className="text-sm text-gray-900">{renderInlineEditableText(student, 'email', student.email)}</div>
                      <div className="text-sm text-gray-900">{renderInlineEditableText(student, 'phone', student.phone)}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap w-32 h-20" onClick={(e) => e.stopPropagation()}>
                    <FirebaseCollectionSelector
                      collectionName="countries"
                      record={student}
                      updateRecord={updateStudent}
                      fieldName="location"
                      fieldDisplayName="Country"
                      options={countries}
                      addOption={addCountry}
                      allowEditExisting={false}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap w-32 h-20" onClick={(e) => e.stopPropagation()}>
                    <FirebaseCollectionSelector
                      collectionName="cities"
                      record={student}
                      updateRecord={updateStudent}
                      fieldName="city"
                      fieldDisplayName="City"
                      options={cities}
                      addOption={addCity}
                      allowEditExisting={false}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap w-32 h-20" onClick={(e) => e.stopPropagation()}>
                    <FirebaseMultiSelectSelector
                      collectionName="categories"
                      record={student}
                      updateRecord={updateStudent}
                      fieldName="categories"
                      fieldDisplayName="Category"
                      options={categories}
                      addOption={addCategory}
                      allowEditExisting={false}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap w-36 h-20">
                    {/* Empty Course/Service column */}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap w-32 h-20">
                    {/* Empty Payments column */}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap w-32 h-20" onClick={(e) => e.stopPropagation()}>
                    <FirebaseCollectionSelector
                      collectionName="platforms"
                      record={student}
                      updateRecord={updateStudent}
                      fieldName="platform"
                      fieldDisplayName="Platform"
                      options={platforms}
                      addOption={addPlatform}
                      allowEditExisting={false}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap w-36 h-20">
                    {/* Empty Notes column */}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium w-20 h-20">
                    <div className="flex items-center justify-start h-full">
                      <ActionsDropdown
                        itemId={student.id}
                        item={student}
                        actions={[
                          {
                            key: 'view',
                            label: 'View Details',
                            icon: Eye,
                            onClick: (student) => handleRowClick(student),
                          },
                          {
                            key: 'edit',
                            label: 'Edit Student',
                            icon: Edit,
                            onClick: (student) => handleRowClick(student),
                          },
                          {
                            key: 'sendToChat',
                            label: 'Send to Chat',
                            icon: MessageSquare,
                            onClick: (student) => handleSendToChat(student),
                          },
                          {
                            key: 'delete',
                            label: 'Delete Student',
                            icon: Trash2,
                            onClick: (student, e) => handleDeleteClick(student, e),
                            isDanger: true,
                            separator: true
                          }
                        ]}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredStudents.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500">
                {searchTerm 
                  ? 'No students match your search criteria.' 
                  : 'No students found. Add your first student to get started.'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pagination Footer */}
      <div className="bg-white border-t border-gray-200 px-6 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">{filteredStudents.length}</span> of{' '}
            <span className="font-medium">{students.length}</span> students
          </div>
          <div className="flex items-center space-x-2">
            <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
              Previous
            </button>
            <span className="px-3 py-1 bg-indigo-600 text-white rounded text-sm">1</span>
            <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Add Student Modal */}
      <AddStudentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddStudent}
      />

      {/* Student Details Modal */}
      <StudentDetailsModal
        enrollment={selectedEnrollment}
        isOpen={detailsModalOpen}
        onClose={handleCloseStudentModal}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Delete Student</h3>
                    <p className="text-sm text-gray-500">This action cannot be undone</p>
                  </div>
                </div>
                
                <p className="text-gray-700 mb-6">
                  Are you sure you want to delete this student? All associated data will be permanently removed.
                </p>
                
                <div className="flex items-center justify-end space-x-3">
                  <button
                    onClick={handleDeleteCancel}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                    className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Delete Student
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Send to Chat Modal */}
      {showSendToChatModal && (
        <SendStudentToChatModal
          isOpen={showSendToChatModal}
          onClose={handleCloseSendToChatModal}
          student={studentToShare}
        />
      )}
    </div>
  );
};

export default StudentsInterface; 