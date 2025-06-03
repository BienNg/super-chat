import { useState, useRef, useEffect, useCallback } from 'react';
import { useLevels } from '../../../../hooks/useLevels';
import { useTypes } from '../../../../hooks/useTypes';
import { useTeachers } from '../../../../hooks/useTeachers';
import { useCourses } from '../../../../hooks/useCourses';
import { useClasses } from '../../../../hooks/useClasses';

export const useCourseForm = (channelName, channelId, initialData, isEditing, isOpen) => {
  const { levels, addLevel } = useLevels();
  const { types, addType } = useTypes();
  const { teachers, addTeacher } = useTeachers();
  const { createCourse, updateCourse } = useCourses();
  const { getClassByChannelId, updateClass } = useClasses();

  // State to store the classId and class data
  const [classId, setClassId] = useState(null);
  const [classData, setClassData] = useState(null);
  const [formInitialized, setFormInitialized] = useState(false);

  // Form state
  const [form, setForm] = useState({
    className: channelName ? channelName.toUpperCase() : '',
    level: '',
    format: '',
    formatOption: '',
    type: '',
    teachers: [],
    beginDate: '',
    endDate: '',
    days: [],
    startTime: '09:00',
    endTime: '10:30',
    timezone: '',
    sheetUrl: '',
    totalDays: '',
  });

  const [loading, setLoading] = useState(false);

  // Dropdown states
  const [levelDropdown, setLevelDropdown] = useState(false);
  const levelRef = useRef(null);
  const [typeDropdown, setTypeDropdown] = useState(false);
  const typeRef = useRef(null);
  const [teacherDropdown, setTeacherDropdown] = useState(false);
  const teacherRef = useRef(null);
  const [teacherSearchValue, setTeacherSearchValue] = useState('');

  // New item modal states
  const [showNewLevelModal, setShowNewLevelModal] = useState(false);
  const [newLevelValue, setNewLevelValue] = useState('');
  const [addingLevel, setAddingLevel] = useState(false);
  const [levelError, setLevelError] = useState('');

  const [showNewTypeModal, setShowNewTypeModal] = useState(false);
  const [newTypeValue, setNewTypeValue] = useState('');
  const [addingType, setAddingType] = useState(false);
  const [typeError, setTypeError] = useState('');

  const [showNewTeacherModal, setShowNewTeacherModal] = useState(false);
  const [newTeacherValue, setNewTeacherValue] = useState('');
  const [addingTeacher, setAddingTeacher] = useState(false);
  const [teacherError, setTeacherError] = useState('');

  // Calendar states
  const today = new Date();
  const [startMonth, setStartMonth] = useState(today.getMonth());
  const [startYear, setStartYear] = useState(today.getFullYear());
  const [endMonth, setEndMonth] = useState(today.getMonth());
  const [endYear, setEndYear] = useState(today.getFullYear());

  // Get current date info
  const todayDate = today.getDate();
  const todayMonth = today.getMonth();
  const todayYear = today.getFullYear();

  // Month names
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Function to calculate total days based on format and level
  const calculateTotalDays = useCallback((format, level) => {
    if (!format || !level) return '';
    
    if (format === 'Offline') {
      return 20;
    }
    
    if (format === 'Online') {
      if (level === 'A1.1' || level === 'A1.2') {
        return 18;
      }
      if (level === 'A2.1' || level === 'A2.2' || level === 'B1.1' || level === 'B1.2') {
        return 20;
      }
    }
    
    return '';
  }, []);

  // Helper functions
  const isStartToday = (day) => {
    return day === todayDate && startMonth === todayMonth && startYear === todayYear;
  };

  const isEndToday = (day) => {
    return day === todayDate && endMonth === todayMonth && endYear === todayYear;
  };

  const formatDateString = (year, month, day) => {
    return `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  };

  const navigateStartMonth = (direction) => {
    if (direction === 'prev') {
      if (startMonth === 0) {
        setStartMonth(11);
        setStartYear(startYear - 1);
      } else {
        setStartMonth(startMonth - 1);
      }
    } else {
      if (startMonth === 11) {
        setStartMonth(0);
        setStartYear(startYear + 1);
      } else {
        setStartMonth(startMonth + 1);
      }
    }
  };

  const navigateEndMonth = (direction) => {
    // If no start date is selected, keep calendars in sync
    if (!form.beginDate) {
      navigateStartMonth(direction);
    }
    
    if (direction === 'prev') {
      if (endMonth === 0) {
        setEndMonth(11);
        setEndYear(endYear - 1);
      } else {
        setEndMonth(endMonth - 1);
      }
    } else {
      if (endMonth === 11) {
        setEndMonth(0);
        setEndYear(endYear + 1);
      } else {
        setEndMonth(endMonth + 1);
      }
    }
  };

  // Handle new item functions
  const handleNewLevelClick = () => {
    setLevelDropdown(false);
    setLevelError('');
    setShowNewLevelModal(true);
  };

  const handleAddNewLevel = async (e) => {
    e.preventDefault();
    if (!newLevelValue.trim()) return;
    
    setAddingLevel(true);
    setLevelError('');
    try {
      await addLevel(newLevelValue.trim());
      setForm((prev) => ({ ...prev, level: newLevelValue.trim() }));
      setShowNewLevelModal(false);
      setNewLevelValue('');
    } catch (error) {
      console.error('Error adding level:', error);
      setLevelError(error.message);
    } finally {
      setAddingLevel(false);
    }
  };

  const handleNewTypeClick = () => {
    setTypeDropdown(false);
    setTypeError('');
    setShowNewTypeModal(true);
  };

  const handleAddNewType = async (e) => {
    e.preventDefault();
    if (!newTypeValue.trim()) return;
    
    setAddingType(true);
    setTypeError('');
    try {
      await addType(newTypeValue.trim());
      setForm((prev) => ({ ...prev, type: newTypeValue.trim() }));
      setShowNewTypeModal(false);
      setNewTypeValue('');
    } catch (error) {
      console.error('Error adding type:', error);
      setTypeError(error.message);
    } finally {
      setAddingType(false);
    }
  };

  const handleNewTeacherClick = () => {
    setTeacherDropdown(false);
    setTeacherError('');
    setShowNewTeacherModal(true);
  };

  const handleAddNewTeacher = async (e) => {
    e.preventDefault();
    if (!newTeacherValue.trim()) return;
    
    setAddingTeacher(true);
    setTeacherError('');
    try {
      await addTeacher(newTeacherValue.trim());
      if (!form.teachers.includes(newTeacherValue.trim())) {
        setForm((prev) => ({ ...prev, teachers: [...prev.teachers, newTeacherValue.trim()] }));
      }
      setShowNewTeacherModal(false);
      setNewTeacherValue('');
    } catch (error) {
      console.error('Error adding teacher:', error);
      setTeacherError(error.message);
    } finally {
      setAddingTeacher(false);
    }
  };

  const handleClearForm = () => {
    setForm({
      className: channelName ? channelName.toUpperCase() : '',
      level: '',
      format: classData?.format || '',
      formatOption: classData?.formatOption || '',
      type: classData?.classType || '',
      teachers: [],
      beginDate: '',
      endDate: '',
      days: classData?.days || [],
      startTime: '09:00',
      endTime: '10:30',
      timezone: '',
      sheetUrl: '',
      totalDays: '',
    });
  };

  const handleSubmit = async (e, onCreate, onClose) => {
    e.preventDefault();
    
    if (!channelId) {
      console.error('No channelId provided for course creation');
      return;
    }

    // Validate required fields
    if (!form.className.trim()) {
      alert(isEditing ? 'Course name is required' : 'Class name is required');
      return;
    }
    
    if (!form.level.trim()) {
      alert('Level is required');
      return;
    }
    
    if (!form.format.trim()) {
      alert('Format is required');
      return;
    }
    
    if (!form.formatOption.trim()) {
      alert('Location is required');
      return;
    }

    setLoading(true);

    try {
      // Ensure we have a class ID
      let currentClassId = classId;
      if (!currentClassId) {
        const classData = await getClassByChannelId(channelId);
        if (classData) {
          setClassId(classData.id);
          currentClassId = classData.id;
        } else {
          throw new Error('No class found for this channel');
        }
      }

      // Update the class with format, location (formatOption), type, and days
      const classUpdates = {
        format: form.format,
        formatOption: form.formatOption,
        classType: form.type,
        days: form.days, // Course Days should be in classes collection
        startTime: form.startTime,
        endTime: form.endTime,
        timezone: form.timezone,
      };

      await updateClass(currentClassId, classUpdates);

      let result;
      if (isEditing && initialData) {
        // Update existing course - exclude format, formatOption, and type as they're now in classes
        result = await updateCourse(initialData.id, {
          courseName: form.className, // When editing, className field contains the courseName
          level: form.level,
          teachers: form.teachers,
          beginDate: form.beginDate,
          endDate: form.endDate,
          days: form.days, // Course Days should also be in courses collection
          startTime: form.startTime,
          endTime: form.endTime,
          timezone: form.timezone,
          sheetUrl: form.sheetUrl,
          totalDays: form.totalDays,
        });
      } else {
        // Create new course - generate courseName from className + level
        const generatedCourseName = `${form.className} - ${form.level}`;
        const courseData = {
          courseName: generatedCourseName,
          level: form.level,
          teachers: form.teachers,
          beginDate: form.beginDate,
          endDate: form.endDate,
          days: form.days, // Course Days should also be in courses collection
          startTime: form.startTime,
          endTime: form.endTime,
          timezone: form.timezone,
          sheetUrl: form.sheetUrl,
          totalDays: form.totalDays,
        };
        result = await createCourse(courseData, currentClassId, channelId);
        
        // Log successful course creation with IDs
        console.log('Course created successfully with background IDs:', {
          courseId: result.id,
          courseName: result.courseName,
          classId: result.classId,
          channelId: result.channelId,
          createdAt: result.createdAt
        });
      }

      if (onCreate) {
        onCreate(result);
      }

      onClose();
    } catch (error) {
      console.error('Error saving course:', error);
      alert('Error saving course: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Effects
  useEffect(() => {
    function handleClickOutside(event) {
      if (levelRef.current && !levelRef.current.contains(event.target)) {
        setLevelDropdown(false);
      }
      if (typeRef.current && !typeRef.current.contains(event.target)) {
        setTypeDropdown(false);
      }
      if (teacherRef.current && !teacherRef.current.contains(event.target)) {
        setTeacherDropdown(false);
      }
    }
    if (levelDropdown || typeDropdown || teacherDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [levelDropdown, typeDropdown, teacherDropdown]);

  // Update form with class data when it becomes available
  useEffect(() => {
    if (isOpen && classData && !isEditing && !formInitialized) {
      // Only update if fields are currently empty (haven't been manually changed)
      if (!form.format && classData.format) {
        setForm(prev => ({
          ...prev,
          format: classData.format,
          formatOption: classData.formatOption || '',
          type: classData.classType || '',
          days: classData.days || prev.days,
          totalDays: calculateTotalDays(classData.format, prev.level) || prev.totalDays
        }));
        setFormInitialized(true);
      }
    }
  }, [classData, isOpen, isEditing, form.format, calculateTotalDays, formInitialized]);

  // Populate form with initial data when editing
  useEffect(() => {
    const populateFormData = async () => {
      if (isOpen && isEditing && initialData && !formInitialized) {
        // Get class data to populate format, formatOption, and type
        let currentClassData = classData;
        if (!currentClassData && channelId) {
          try {
            currentClassData = await getClassByChannelId(channelId);
            if (currentClassData) {
              setClassData(currentClassData);
            }
          } catch (error) {
            console.error('Error fetching class data for editing:', error);
          }
        }

        setForm({
          className: initialData.courseName || '', // When editing, put courseName into className field
          level: initialData.level || '',
          format: currentClassData?.format || initialData.format || '',
          formatOption: currentClassData?.formatOption || initialData.formatOption || '',
          type: currentClassData?.classType || initialData.courseType || initialData.classType || '',
          teachers: initialData.teachers || [],
          beginDate: initialData.beginDate || '',
          endDate: initialData.endDate || '',
          days: currentClassData?.days || initialData.days || [],
          startTime: initialData.startTime || '09:00',
          endTime: initialData.endTime || '10:30',
          timezone: initialData.timezone || '',
          sheetUrl: initialData.sheetUrl || initialData.googleDriveUrl || '',
          totalDays: initialData.totalDays || '',
        });
        
        setFormInitialized(true);
      }
    };

    populateFormData();
  }, [isOpen, isEditing, initialData, channelId, formInitialized]);

  // Reset form initialization flag when modal closes or mode changes
  useEffect(() => {
    if (!isOpen) {
      setFormInitialized(false);
    }
  }, [isOpen]);

  // Initialize form for new courses - only run once when modal opens
  useEffect(() => {
    if (isOpen && !isEditing && channelName && !form.className) {
      setForm(prev => ({
        ...prev,
        className: channelName.toUpperCase(),
      }));
    }
  }, [isOpen, isEditing, channelName, form.className]);

  // Reset calendar to current month when modal opens
  useEffect(() => {
    if (isOpen && !form.beginDate && !form.endDate) {
      setStartMonth(todayMonth);
      setStartYear(todayYear);
      setEndMonth(todayMonth);
      setEndYear(todayYear);
    }
  }, [isOpen, form.beginDate, form.endDate, todayMonth, todayYear]);

  // Update end calendar when start date is selected
  useEffect(() => {
    if (form.beginDate) {
      const startDate = new Date(form.beginDate);
      setEndMonth(startDate.getMonth());
      setEndYear(startDate.getFullYear());
    }
  }, [form.beginDate]);

  // Update end calendar when end date is set (for auto-generate)
  useEffect(() => {
    if (form.endDate) {
      const endDate = new Date(form.endDate);
      setEndMonth(endDate.getMonth());
      setEndYear(endDate.getFullYear());
    }
  }, [form.endDate]);

  // Update total days when format or level changes
  useEffect(() => {
    const newTotalDays = calculateTotalDays(form.format, form.level);
    if (newTotalDays !== form.totalDays) {
      setForm(prev => ({ ...prev, totalDays: newTotalDays }));
    }
  }, [form.format, form.level, calculateTotalDays]);

  // Fetch class data when channelId changes
  useEffect(() => {
    const fetchClassData = async () => {
      if (channelId) {
        try {
          const fetchedClassData = await getClassByChannelId(channelId);
          if (fetchedClassData) {
            setClassId(fetchedClassData.id);
            setClassData(fetchedClassData);
          }
        } catch (error) {
          console.error('Error fetching class data:', error);
        }
      }
    };

    fetchClassData();
  }, [channelId]);

  // Check if all required fields are filled
  const isFormValid = form.className.trim() && form.level.trim() && form.format.trim() && form.formatOption.trim();

  // Determine if fields should be disabled based on class data
  const isFormatDisabled = !!(classData?.format);
  const isLocationDisabled = !!(classData?.formatOption);
  const isTypeDisabled = !!(classData?.classType);

  return {
    // Form state
    form,
    setForm,
    loading,
    isFormValid,
    
    // Field disabled states
    isFormatDisabled,
    isLocationDisabled,
    isTypeDisabled,
    
    // Data
    levels,
    types,
    teachers,
    
    // Dropdown states
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
    
    // New item modal states
    showNewLevelModal,
    setShowNewLevelModal,
    newLevelValue,
    setNewLevelValue,
    addingLevel,
    levelError,
    setLevelError,
    showNewTypeModal,
    setShowNewTypeModal,
    newTypeValue,
    setNewTypeValue,
    addingType,
    typeError,
    setTypeError,
    showNewTeacherModal,
    setShowNewTeacherModal,
    newTeacherValue,
    setNewTeacherValue,
    addingTeacher,
    teacherError,
    setTeacherError,
    
    // Calendar states
    startMonth,
    setStartMonth,
    startYear,
    setStartYear,
    endMonth,
    setEndMonth,
    endYear,
    setEndYear,
    monthNames,
    
    // Functions
    calculateTotalDays,
    isStartToday,
    isEndToday,
    formatDateString,
    navigateStartMonth,
    navigateEndMonth,
    handleNewLevelClick,
    handleAddNewLevel,
    handleNewTypeClick,
    handleAddNewType,
    handleNewTeacherClick,
    handleAddNewTeacher,
    handleClearForm,
    handleSubmit,
  };
}; 