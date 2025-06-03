import React, { useState, useRef, useEffect } from 'react';
import DateCalendar from './DateCalendar';
import AutoGenerateTooltip from './AutoGenerateTooltip';

const WEEKDAYS = [
  { key: 'Mon', label: 'M' },
  { key: 'Tue', label: 'T' },
  { key: 'Wed', label: 'W' },
  { key: 'Thu', label: 'T' },
  { key: 'Fri', label: 'F' },
  { key: 'Sat', label: 'S' },
  { key: 'Sun', label: 'S' },
];

const TIMEZONES = [
  { value: 'vn', label: 'vn' },
  { value: 'de', label: 'de' },
];

const CourseSchedule = ({
  form,
  setForm,
  startMonth,
  setStartMonth,
  startYear,
  setStartYear,
  endMonth,
  setEndMonth,
  endYear,
  setEndYear,
  navigateStartMonth,
  navigateEndMonth,
  formatDateString,
  isStartToday,
  isEndToday,
  monthNames
}) => {
  const [timezoneDropdown, setTimezoneDropdown] = useState(false);
  const timezoneRef = useRef(null);

  const handleDayToggle = (dayKey) => {
    setForm((prev) => ({
      ...prev,
      days: prev.days.includes(dayKey)
        ? prev.days.filter((d) => d !== dayKey)
        : [...prev.days, dayKey],
    }));
  };

  const handleTimezoneSelect = (timezone) => {
    setForm(prev => ({ ...prev, timezone }));
    setTimezoneDropdown(false);
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (timezoneRef.current && !timezoneRef.current.contains(event.target)) {
        setTimezoneDropdown(false);
      }
    }
    if (timezoneDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [timezoneDropdown]);

  return (
    <div className="space-y-6">
      {/* Course Days */}
      <div className="flex items-center space-x-6">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Course Days</label>
          <div className="flex space-x-2">
            {WEEKDAYS.map((d) => (
              <button
                type="button"
                key={d.key}
                className={`w-9 h-9 rounded-full border text-sm font-medium transition-colors focus:outline-none ${form.days.includes(d.key) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                onClick={() => handleDayToggle(d.key)}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
        
        <div className="w-20">
          <label className="block text-sm font-medium text-gray-700 mb-1">Total Days</label>
          <input
            type="number"
            min="1"
            max="99"
            value={form.totalDays}
            onChange={(e) => {
              const value = Math.max(1, Math.min(99, parseInt(e.target.value) || 1));
              setForm(prev => ({ ...prev, totalDays: value }));
            }}
            className="w-full px-2 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-center"
          />
        </div>
      </div>

      {/* Time Selectors */}
      <div className="flex items-center space-x-6">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
          <input
            type="time"
            value={form.startTime}
            onChange={(e) => setForm(prev => ({ ...prev, startTime: e.target.value }))}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
          <input
            type="time"
            value={form.endTime}
            onChange={(e) => setForm(prev => ({ ...prev, endTime: e.target.value }))}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="w-24 relative" ref={timezoneRef}>
          <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
          <button
            type="button"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-left focus:outline-none focus:ring-1 focus:ring-indigo-500 flex items-center justify-between"
            onClick={() => setTimezoneDropdown(!timezoneDropdown)}
          >
            <span className={`text-gray-900 ${!form.timezone ? 'text-gray-400' : ''}`}>
              {form.timezone || 'Select'}
            </span>
            <svg className="w-4 h-4 ml-2 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {timezoneDropdown && (
            <div className="absolute z-20 mt-2 w-full bg-white rounded-xl shadow-lg border border-gray-100 py-1">
              {TIMEZONES.map((tz) => (
                <button
                  key={tz.value}
                  type="button"
                  onClick={() => handleTimezoneSelect(tz.value)}
                  className={`w-full text-left px-4 py-2 text-sm ${
                    form.timezone === tz.value 
                      ? 'bg-indigo-50 text-indigo-700 font-semibold' 
                      : 'text-gray-900 hover:bg-gray-50'
                  } transition-colors`}
                >
                  {tz.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Date Selectors Row */}
      <div className="grid grid-cols-2 gap-10">
        {/* Start Date Calendar */}
        <DateCalendar
          type="start"
          form={form}
          setForm={setForm}
          month={startMonth}
          year={startYear}
          navigateMonth={navigateStartMonth}
          formatDateString={formatDateString}
          isToday={isStartToday}
          monthNames={monthNames}
          label="Start Date"
        />

        {/* End Date Calendar */}
        <DateCalendar
          type="end"
          form={form}
          setForm={setForm}
          month={endMonth}
          year={endYear}
          navigateMonth={navigateEndMonth}
          formatDateString={formatDateString}
          isToday={isEndToday}
          monthNames={monthNames}
          label="End Date"
          showAutoGenerate={true}
          AutoGenerateComponent={AutoGenerateTooltip}
        />
      </div>
    </div>
  );
};

export default CourseSchedule; 