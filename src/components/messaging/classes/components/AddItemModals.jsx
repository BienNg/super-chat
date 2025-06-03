import React from 'react';
import { X } from 'lucide-react';

const AddItemModal = ({ 
  isOpen, 
  onClose, 
  title, 
  placeholder, 
  value, 
  onChange, 
  onSubmit, 
  loading, 
  error 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {title.replace('Add New ', '')} Name
            </label>
            <input
              type="text"
              value={value}
              onChange={onChange}
              placeholder={placeholder}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
              autoFocus
            />
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !value.trim()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding...' : `Add ${title.replace('Add New ', '')}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AddItemModals = ({
  // Level modal
  showNewLevelModal,
  setShowNewLevelModal,
  newLevelValue,
  setNewLevelValue,
  addingLevel,
  levelError,
  setLevelError,
  handleAddNewLevel,
  
  // Type modal
  showNewTypeModal,
  setShowNewTypeModal,
  newTypeValue,
  setNewTypeValue,
  addingType,
  typeError,
  setTypeError,
  handleAddNewType,
  
  // Teacher modal
  showNewTeacherModal,
  setShowNewTeacherModal,
  newTeacherValue,
  setNewTeacherValue,
  addingTeacher,
  teacherError,
  setTeacherError,
  handleAddNewTeacher
}) => {
  return (
    <>
      {/* New Level Modal */}
      <AddItemModal
        isOpen={showNewLevelModal}
        onClose={() => {
          setShowNewLevelModal(false);
          setNewLevelValue('');
          setLevelError('');
        }}
        title="Add New Level"
        placeholder="e.g., C1.1"
        value={newLevelValue}
        onChange={(e) => setNewLevelValue(e.target.value)}
        onSubmit={handleAddNewLevel}
        loading={addingLevel}
        error={levelError}
      />

      {/* New Type Modal */}
      <AddItemModal
        isOpen={showNewTypeModal}
        onClose={() => {
          setShowNewTypeModal(false);
          setNewTypeValue('');
          setTypeError('');
        }}
        title="Add New Type"
        placeholder="e.g., Workshop"
        value={newTypeValue}
        onChange={(e) => setNewTypeValue(e.target.value)}
        onSubmit={handleAddNewType}
        loading={addingType}
        error={typeError}
      />

      {/* New Teacher Modal */}
      <AddItemModal
        isOpen={showNewTeacherModal}
        onClose={() => {
          setShowNewTeacherModal(false);
          setNewTeacherValue('');
          setTeacherError('');
        }}
        title="Add New Teacher"
        placeholder="e.g., John Smith"
        value={newTeacherValue}
        onChange={(e) => setNewTeacherValue(e.target.value)}
        onSubmit={handleAddNewTeacher}
        loading={addingTeacher}
        error={teacherError}
      />
    </>
  );
};

export default AddItemModals; 