import React from 'react';
import { X } from 'lucide-react';
import { useCourseForm } from './hooks/useCourseForm';
import CourseBasicInfo from './components/CourseBasicInfo';
import CourseSchedule from './components/CourseSchedule';
import AddItemModals from './components/AddItemModals';

const CreateCourseModal = ({ 
  isOpen, 
  onClose, 
  onCreate, 
  channelName, 
  channelId, 
  initialData = null, 
  isEditing = false 
}) => {
  const courseForm = useCourseForm(channelName, channelId, initialData, isEditing, isOpen);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    courseForm.handleSubmit(e, onCreate, onClose);
  };

  return (
    <>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
        onClick={onClose}
      >
        <div 
          className="bg-white rounded-2xl shadow-xl w-full max-w-6xl p-8 relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {isEditing ? 'Edit Course' : 'Create New Course'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-16">
              {/* Left Column - Basic Info */}
              <CourseBasicInfo
                form={courseForm.form}
                setForm={courseForm.setForm}
                levels={courseForm.levels}
                types={courseForm.types}
                teachers={courseForm.teachers}
                levelDropdown={courseForm.levelDropdown}
                setLevelDropdown={courseForm.setLevelDropdown}
                levelRef={courseForm.levelRef}
                typeDropdown={courseForm.typeDropdown}
                setTypeDropdown={courseForm.setTypeDropdown}
                typeRef={courseForm.typeRef}
                teacherDropdown={courseForm.teacherDropdown}
                setTeacherDropdown={courseForm.setTeacherDropdown}
                teacherRef={courseForm.teacherRef}
                teacherSearchValue={courseForm.teacherSearchValue}
                setTeacherSearchValue={courseForm.setTeacherSearchValue}
                onNewLevelClick={courseForm.handleNewLevelClick}
                onNewTypeClick={courseForm.handleNewTypeClick}
                onNewTeacherClick={courseForm.handleNewTeacherClick}
                calculateTotalDays={courseForm.calculateTotalDays}
                isFormatDisabled={courseForm.isFormatDisabled}
                isLocationDisabled={courseForm.isLocationDisabled}
                isTypeDisabled={courseForm.isTypeDisabled}
                isEditing={isEditing}
              />

              {/* Right Column - Schedule */}
              <CourseSchedule
                form={courseForm.form}
                setForm={courseForm.setForm}
                startMonth={courseForm.startMonth}
                setStartMonth={courseForm.setStartMonth}
                startYear={courseForm.startYear}
                setStartYear={courseForm.setStartYear}
                endMonth={courseForm.endMonth}
                setEndMonth={courseForm.setEndMonth}
                endYear={courseForm.endYear}
                setEndYear={courseForm.setEndYear}
                navigateStartMonth={courseForm.navigateStartMonth}
                navigateEndMonth={courseForm.navigateEndMonth}
                formatDateString={courseForm.formatDateString}
                isStartToday={courseForm.isStartToday}
                isEndToday={courseForm.isEndToday}
                monthNames={courseForm.monthNames}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-2">
              {!isEditing && (
              <button
                type="button"
                  onClick={courseForm.handleClearForm}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                  Clear Form
              </button>
              )}
              <button
                type="submit"
                disabled={courseForm.loading || !courseForm.isFormValid}
                className={`px-4 py-2 rounded-lg transition ${
                  courseForm.loading || !courseForm.isFormValid
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {courseForm.loading 
                  ? (isEditing ? 'Updating...' : 'Creating...') 
                  : (isEditing ? 'Update Course' : 'Create Course')
                }
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Add Item Modals */}
      <AddItemModals
        showNewLevelModal={courseForm.showNewLevelModal}
        setShowNewLevelModal={courseForm.setShowNewLevelModal}
        newLevelValue={courseForm.newLevelValue}
        setNewLevelValue={courseForm.setNewLevelValue}
        addingLevel={courseForm.addingLevel}
        levelError={courseForm.levelError}
        setLevelError={courseForm.setLevelError}
        handleAddNewLevel={courseForm.handleAddNewLevel}
        
        showNewTypeModal={courseForm.showNewTypeModal}
        setShowNewTypeModal={courseForm.setShowNewTypeModal}
        newTypeValue={courseForm.newTypeValue}
        setNewTypeValue={courseForm.setNewTypeValue}
        addingType={courseForm.addingType}
        typeError={courseForm.typeError}
        setTypeError={courseForm.setTypeError}
        handleAddNewType={courseForm.handleAddNewType}
        
        showNewTeacherModal={courseForm.showNewTeacherModal}
        setShowNewTeacherModal={courseForm.setShowNewTeacherModal}
        newTeacherValue={courseForm.newTeacherValue}
        setNewTeacherValue={courseForm.setNewTeacherValue}
        addingTeacher={courseForm.addingTeacher}
        teacherError={courseForm.teacherError}
        setTeacherError={courseForm.setTeacherError}
        handleAddNewTeacher={courseForm.handleAddNewTeacher}
      />
    </>
  );
};

export default CreateCourseModal; 