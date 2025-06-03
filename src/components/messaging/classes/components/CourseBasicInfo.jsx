import React from 'react';
import { PlusCircle } from 'lucide-react';

const FORMATS = ['Online', 'Offline'];

const CourseBasicInfo = ({
  form,
  setForm,
  levels,
  types,
  teachers,
  levelDropdown,
  setLevelDropdown,
  levelRef,
  typeDropdown,
  setTypeDropdown,
  typeRef,
  teacherDropdown,
  setTeacherDropdown,
  teacherRef,
  teacherSearchValue,
  setTeacherSearchValue,
  onNewLevelClick,
  onNewTypeClick,
  onNewTeacherClick,
  calculateTotalDays,
  isFormatDisabled = false,
  isLocationDisabled = false,
  isTypeDisabled = false,
  isEditing = false
}) => {
  const handleLevelSelect = (level) => {
    setForm((prev) => ({ 
      ...prev, 
      level,
      totalDays: calculateTotalDays(prev.format, level)
    }));
    setLevelDropdown(false);
  };

  const handleTypeSelect = (type) => {
    setForm((prev) => ({ ...prev, type }));
    setTypeDropdown(false);
  };

  const handleTeacherSelect = (teacher) => {
    if (!form.teachers.includes(teacher)) {
      setForm((prev) => ({ ...prev, teachers: [...prev.teachers, teacher] }));
    }
    setTeacherDropdown(false);
    setTeacherSearchValue('');
  };

  const handleRemoveTeacher = (teacherToRemove) => {
    setForm((prev) => ({ 
      ...prev, 
      teachers: prev.teachers.filter(teacher => teacher !== teacherToRemove) 
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const filteredTeachers = teachers.filter(teacher => 
    !form.teachers.includes(teacher.value) &&
    teacher.value.toLowerCase().includes(teacherSearchValue.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Course Name/Class Name and Level Row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Course Name (Edit) / Class Name (Create) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {isEditing ? 'Course Name *' : 'Class Name *'}
          </label>
          <input
            type="text"
            name="className"
            value={form.className}
            onChange={handleChange}
            placeholder={isEditing 
              ? "Enter course name (e.g., German A1 Evening Course)" 
              : "Enter class name (e.g., G35)"
            }
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>

        {/* Level - custom dropdown */}
        <div className="relative" ref={levelRef}>
          <label className="block text-sm font-medium text-gray-700 mb-1">Level *</label>
          <button
            type="button"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-white text-left focus:outline-none focus:ring-2 focus:ring-indigo-500 flex items-center justify-between"
            onClick={() => setLevelDropdown((open) => !open)}
          >
            <span className={`text-gray-900 ${!form.level ? 'text-gray-400' : ''}`}>{form.level || 'Select level'}</span>
            <svg className="w-4 h-4 ml-2 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
          </button>
          {levelDropdown && (
            <div className="absolute z-20 mt-2 w-full bg-white rounded-xl shadow-lg border border-gray-100 py-1">
              {levels && levels.length > 0 && levels.map((lvl) => (
                <button
                  key={lvl.id}
                  type="button"
                  onClick={() => handleLevelSelect(lvl.value)}
                  className={`w-full text-left px-4 py-2 text-sm ${form.level === lvl.value ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-900 hover:bg-gray-50'} transition-colors`}
                >
                  {lvl.value}
                </button>
              ))}
              <div className="border-t border-gray-200 my-1" />
              <button
                type="button"
                className="w-full flex items-center px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 font-medium"
                onClick={onNewLevelClick}
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                New Level...
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Course Name Preview for Create Mode */}
      {!isEditing && form.className && form.level && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center">
            <div className="text-sm text-blue-700">
              <span className="font-medium">Generated Course Name:</span> {form.className} - {form.level}
            </div>
          </div>
        </div>
      )}

      {/* Format */}
      <div className="flex items-end space-x-6">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Format *
            {isFormatDisabled && (
              <span className="text-xs text-gray-500 ml-2">(Pre-selected from class)</span>
            )}
          </label>
          {isFormatDisabled ? (
            <div className="px-5 py-1.5 rounded-full border text-sm font-medium bg-gray-100 text-gray-700 border-gray-200 cursor-not-allowed">
              {form.format}
            </div>
          ) : (
            <div className="flex space-x-4">
              {FORMATS.map((fmt) => (
                <button
                  type="button"
                  key={fmt}
                  className={`px-5 py-1.5 rounded-full border text-sm font-medium transition-colors focus:outline-none ${form.format === fmt ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                  onClick={() => {
                    setForm((prev) => ({ 
                      ...prev, 
                      format: fmt,
                      formatOption: '',
                      totalDays: calculateTotalDays(fmt, prev.level)
                    }));
                  }}
                >
                  {fmt}
                </button>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Location *
            {isLocationDisabled && (
              <span className="text-xs text-gray-500 ml-2">(Pre-selected from class)</span>
            )}
          </label>
          {isLocationDisabled ? (
            <div className="px-5 py-1.5 rounded-full border text-sm font-medium bg-gray-100 text-gray-700 border-gray-200 cursor-not-allowed">
              {form.formatOption}
            </div>
          ) : (
            <div className="flex space-x-4">
              {form.format === 'Online' ? (
                <>
                  {['VN', 'DE'].map((option) => (
                    <button
                      type="button"
                      key={option}
                      className={`px-5 py-1.5 rounded-full border text-sm font-medium transition-colors focus:outline-none ${form.formatOption === option ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                      onClick={() => setForm((prev) => ({ ...prev, formatOption: option }))}
                    >
                      {option}
                    </button>
                  ))}
                </>
              ) : form.format === 'Offline' ? (
                <>
                  {['Hanoi', 'Saigon'].map((option) => (
                    <button
                      type="button"
                      key={option}
                      className={`px-5 py-1.5 rounded-full border text-sm font-medium transition-colors focus:outline-none ${form.formatOption === option ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                      onClick={() => setForm((prev) => ({ ...prev, formatOption: option }))}
                    >
                      {option}
                    </button>
                  ))}
                </>
              ) : (
                <div className="text-sm text-gray-400 py-1.5">Select format first</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Type - custom dropdown */}
      <div className="relative" ref={typeRef}>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Type
          {isTypeDisabled && (
            <span className="text-xs text-gray-500 ml-2">(Pre-selected from class)</span>
          )}
        </label>
        {isTypeDisabled ? (
          <div className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed">
            {form.type || 'Not specified'}
          </div>
        ) : (
          <>
            <button
              type="button"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-white text-left focus:outline-none focus:ring-2 focus:ring-indigo-500 flex items-center justify-between"
              onClick={() => setTypeDropdown((open) => !open)}
            >
              <span className={`text-gray-900 ${!form.type ? 'text-gray-400' : ''}`}>{form.type || 'Select type'}</span>
              <svg className="w-4 h-4 ml-2 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </button>
            {typeDropdown && (
              <div className="absolute z-20 mt-2 w-full bg-white rounded-xl shadow-lg border border-gray-100 py-1">
                {types && types.length > 0 && types.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleTypeSelect(t.value)}
                    className={`w-full text-left px-4 py-2 text-sm ${form.type === t.value ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-900 hover:bg-gray-50'} transition-colors`}
                  >
                    {t.value}
                  </button>
                ))}
                <div className="border-t border-gray-200 my-1" />
                <button
                  type="button"
                  className="w-full flex items-center px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 font-medium"
                  onClick={onNewTypeClick}
                >
                  <PlusCircle className="w-4 h-4 mr-2" />
                  New Type...
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Teachers - multiple selection with tags */}
      <div className="relative" ref={teacherRef}>
        <label className="block text-sm font-medium text-gray-700 mb-1">Teachers</label>
        <div className="relative">
          <div className="w-full min-h-[42px] px-3 py-2 border border-gray-200 rounded-lg focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 bg-white flex flex-wrap items-center gap-1">
            {form.teachers.map((teacher, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-indigo-100 text-indigo-800 border border-indigo-200"
              >
                {teacher}
                <button
                  type="button"
                  onClick={() => handleRemoveTeacher(teacher)}
                  className="ml-1 inline-flex items-center justify-center w-3 h-3 rounded-full text-indigo-400 hover:bg-indigo-200 hover:text-indigo-600 focus:outline-none"
                >
                  <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
            <input
              type="text"
              value={teacherSearchValue}
              onChange={(e) => setTeacherSearchValue(e.target.value)}
              onFocus={() => setTeacherDropdown(true)}
              placeholder={form.teachers.length === 0 ? "Search teachers..." : ""}
              className="flex-1 min-w-[120px] outline-none bg-transparent text-sm py-1"
            />
          </div>
          {teacherDropdown && (
            <div className="absolute z-20 mt-2 w-full bg-white rounded-xl shadow-lg border border-gray-100 py-1 max-h-48 overflow-y-auto">
              {filteredTeachers.length > 0 ? (
                filteredTeachers.map((teacher) => (
                  <button
                    key={teacher.id}
                    type="button"
                    onClick={() => handleTeacherSelect(teacher.value)}
                    className="w-full text-left px-4 py-2 text-sm text-gray-900 hover:bg-gray-50 transition-colors"
                  >
                    {teacher.value}
                  </button>
                ))
              ) : (
                <div className="px-4 py-2 text-sm text-gray-500">
                  {teacherSearchValue ? 'No teachers found' : 'No more teachers available'}
                </div>
              )}
              <div className="border-t border-gray-200 my-1" />
              <button
                type="button"
                className="w-full flex items-center px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 font-medium"
                onClick={onNewTeacherClick}
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                New Teacher...
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Google Sheets URL */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Google Sheets URL</label>
        <input
          type="url"
          name="sheetUrl"
          value={form.sheetUrl}
          onChange={handleChange}
          placeholder="https://docs.google.com/spreadsheets/d/..."
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
    </div>
  );
};

export default CourseBasicInfo; 