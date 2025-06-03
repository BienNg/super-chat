import React from 'react';

const DateCalendar = ({
  type, // 'start' or 'end'
  form,
  setForm,
  month,
  year,
  navigateMonth,
  formatDateString,
  isToday,
  monthNames,
  label,
  showAutoGenerate = false,
  AutoGenerateComponent = null
}) => {
  // Calendar calculations
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonthJS = new Date(year, month, 1).getDay(); // JavaScript day (0=Sunday)
  // Convert to Monday-first (0=Monday, 1=Tuesday, ..., 6=Sunday)
  const firstDayOfMonth = firstDayOfMonthJS === 0 ? 6 : firstDayOfMonthJS - 1;
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const daysInPrevMonth = new Date(prevYear, prevMonth + 1, 0).getDate();
  const prevMonthDays = Array.from(
    { length: firstDayOfMonth }, 
    (_, i) => daysInPrevMonth - firstDayOfMonth + i + 1
  );
  const totalCells = 42; // 6 rows × 7 days
  const remainingCells = totalCells - firstDayOfMonth - daysInMonth;
  const nextMonthDays = Array.from({ length: remainingCells }, (_, i) => i + 1);

  const selectedDate = type === 'start' ? form.beginDate : form.endDate;
  const dateField = type === 'start' ? 'beginDate' : 'endDate';

  const handleDateClick = (day) => {
    const dateString = formatDateString(year, month, day);
    const isSelected = selectedDate === dateString;
    
    if (type === 'start') {
      if (isSelected) {
        setForm(prev => ({ ...prev, beginDate: '', endDate: '' }));
      } else {
        setForm(prev => ({ ...prev, beginDate: dateString, endDate: '' }));
      }
    } else {
      // End date logic
      const startDate = form.beginDate ? new Date(form.beginDate) : null;
      const currentDate = new Date(dateString);
      const isBeforeStart = startDate && currentDate < startDate;
      
      if (!isBeforeStart) {
        if (isSelected) {
          setForm(prev => ({ ...prev, endDate: '' }));
        } else {
          setForm(prev => ({ ...prev, endDate: dateString }));
        }
      }
    }
  };

  const isDayDisabled = (day) => {
    if (type === 'start') return false;
    
    const dateString = formatDateString(year, month, day);
    const startDate = form.beginDate ? new Date(form.beginDate) : null;
    const currentDate = new Date(dateString);
    return startDate && currentDate < startDate;
  };

  const isDayInRange = (day) => {
    if (type === 'start') return false;
    
    const dateString = formatDateString(year, month, day);
    const isSelected = selectedDate === dateString;
    const startDate = form.beginDate ? new Date(form.beginDate) : null;
    const currentDate = new Date(dateString);
    const isBeforeStart = startDate && currentDate < startDate;
    
    return form.beginDate && !isSelected && !isBeforeStart && (
      form.endDate && currentDate < new Date(form.endDate) && currentDate > startDate
    );
  };

  // Check if a date is a course day (matches selected weekdays)
  const isCourseDay = (day) => {
    if (type === 'start' || !form.days.length) return false;
    
    const dateString = formatDateString(year, month, day);
    const currentDate = new Date(dateString);
    const dayOfWeek = currentDate.getDay(); // 0=Sunday, 1=Monday, etc.
    
    // Map JavaScript day numbers to our weekday keys
    const dayMap = {
      0: 'Sun', // Sunday
      1: 'Mon', // Monday
      2: 'Tue', // Tuesday
      3: 'Wed', // Wednesday
      4: 'Thu', // Thursday
      5: 'Fri', // Friday
      6: 'Sat'  // Saturday
    };
    
    const dayKey = dayMap[dayOfWeek];
    return form.days.includes(dayKey);
  };

  // Check if a date is the start date (from the other calendar)
  const isStartDate = (day) => {
    if (type === 'start') return false;
    const dateString = formatDateString(year, month, day);
    return form.beginDate === dateString;
  };

  // Check if a date is the end date
  const isEndDate = (day) => {
    if (type === 'start') return false;
    const dateString = formatDateString(year, month, day);
    return form.endDate === dateString;
  };

  return (
    <div className="group">
      <label className="block text-sm font-semibold text-gray-700 mb-4 flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-2"></div>
          {label}
        </div>
        {showAutoGenerate && AutoGenerateComponent && (
          <AutoGenerateComponent form={form} setForm={setForm} />
        )}
      </label>
      
      <div className={`bg-white border-2 rounded-2xl p-6 transition-all duration-300 hover:shadow-lg ${
        selectedDate 
          ? 'border-indigo-300' 
          : 'border-gray-200 group-hover:border-indigo-200'
      }`}>
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-4">
          <button 
            type="button" 
            onClick={() => navigateMonth('prev')}
            className="p-2.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="text-center">
            <h4 className="text-lg font-bold text-gray-900">{monthNames[month]} {year}</h4>
          </div>
          <button 
            type="button" 
            onClick={() => navigateMonth('next')}
            className="p-2.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        
        {/* Days of Week */}
        <div className="grid grid-cols-7 gap-1">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
            <div key={`${type}-day-${index}`} className="h-8 flex items-center justify-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-0.5">
          {/* Previous month days */}
          {prevMonthDays.map((day, index) => (
            <button 
              key={`prev-${day}`} 
              type="button" 
              className="h-8 flex items-center justify-center text-sm text-gray-300 rounded-md"
            >
              {day}
            </button>
          ))}
          
          {/* Current month days */}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
            const dateString = formatDateString(year, month, day);
            const isSelected = selectedDate === dateString;
            const isTodayDate = isToday(day);
            const isDisabled = isDayDisabled(day);
            const isInRange = isDayInRange(day);
            const isCourseDayDate = isCourseDay(day);
            const isStartDateDate = isStartDate(day);
            const isEndDateDate = isEndDate(day);
            
            // Determine styling based on date type
            let buttonClasses = 'h-8 flex items-center justify-center text-sm font-medium rounded-md transition-colors ';
            
            if (isDisabled) {
              buttonClasses += 'text-gray-300 cursor-not-allowed';
            } else if (isStartDateDate) {
              // Start date - sophisticated blue with refined border
              buttonClasses += 'bg-blue-50 text-blue-900 border border-blue-200 font-semibold shadow-sm';
            } else if (isEndDateDate) {
              // End date - elegant purple with refined border
              buttonClasses += 'bg-purple-50 text-purple-900 border border-purple-200 font-semibold shadow-sm';
            } else if (isSelected) {
              // Currently selected date
              buttonClasses += 'bg-indigo-600 text-white';
            } else if (isCourseDayDate && form.beginDate && form.endDate) {
              // Course day between start and end dates
              const currentDate = new Date(dateString);
              const startDate = new Date(form.beginDate);
              const endDate = new Date(form.endDate);
              
              if (currentDate >= startDate && currentDate <= endDate) {
                buttonClasses += 'bg-slate-50 text-slate-700 border border-slate-200/50 font-medium';
              } else {
                buttonClasses += 'text-gray-700 hover:bg-gray-50';
              }
            } else if (isInRange) {
              // In range but not a course day
              buttonClasses += 'bg-gray-25 text-gray-400';
            } else if (isTodayDate) {
              // Today
              buttonClasses += 'bg-indigo-50 text-indigo-700 border border-indigo-200';
            } else {
              // Regular day
              buttonClasses += 'text-gray-700 hover:bg-gray-50';
            }
            
            return (
              <button
                key={day}
                type="button"
                disabled={isDisabled}
                onClick={() => handleDateClick(day)}
                className={buttonClasses}
              >
                {day}
              </button>
            );
          })}
          
          {/* Next month days */}
          {nextMonthDays.map((day, index) => (
            <button 
              key={`next-${day}`} 
              type="button" 
              className="h-8 flex items-center justify-center text-sm text-gray-300 rounded-md"
            >
              {day}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DateCalendar; 