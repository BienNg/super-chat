import React, { useState, useRef, useEffect } from 'react';
import { calculateEndDate, getHolidayNames } from '../../../../utils/holidays';

const AutoGenerateTooltip = ({ form, setForm }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [holidayInfo, setHolidayInfo] = useState({ holidays: [], location: '' });
  const tooltipTimeoutRef = useRef(null);
  const lastProcessedFormRef = useRef(null);

  const isDisabled = !(form.days.length > 0 && form.totalDays && form.beginDate && form.formatOption);

  const handleCloseModal = () => {
    if (!showHolidayModal) return;
    setShowHolidayModal(false);
    lastProcessedFormRef.current = null;
  };

  const handleButtonClose = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    handleCloseModal();
  };

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape' && showHolidayModal) {
        handleCloseModal();
      }
    };

    if (showHolidayModal) {
      document.addEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    };
  }, [showHolidayModal]);

  const handleMouseEnter = () => {
    // Clear any existing timeout
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
      tooltipTimeoutRef.current = null;
    }
    if (isDisabled) {
      setShowTooltip(true);
    }
  };

  const handleMouseLeave = () => {
    // Add a delay before hiding the tooltip
    tooltipTimeoutRef.current = setTimeout(() => {
      setShowTooltip(false);
    }, 300); // 300ms delay
  };

  const handleTooltipMouseEnter = () => {
    // Clear timeout when mouse enters tooltip
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
      tooltipTimeoutRef.current = null;
    }
  };

  const handleTooltipMouseLeave = () => {
    // Hide tooltip when mouse leaves tooltip
    setShowTooltip(false);
  };

  const handleAutoGenerate = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (isDisabled) return;

    // Prevent multiple calls if modal is already open
    if (showHolidayModal) return;

    // Check if we've already processed this exact form state
    const currentFormKey = `${form.beginDate}-${form.totalDays}-${form.days.join(',')}-${form.formatOption}`;
    if (lastProcessedFormRef.current === currentFormKey) return;
    lastProcessedFormRef.current = currentFormKey;

    // Map location to holiday code
    const locationMap = {
      'VN': 'VN',
      'DE': 'DE',
      'Hanoi': 'VN',
      'Saigon': 'VN'
    };

    const holidayLocation = locationMap[form.formatOption];
    if (!holidayLocation) return;

    // Calculate end date
    const result = calculateEndDate(
      form.beginDate,
      parseInt(form.totalDays),
      form.days,
      holidayLocation
    );

    if (result.endDate) {
      // Update the form with the calculated end date
      setForm(prev => ({
        ...prev,
        endDate: result.endDate
      }));

      // Show holiday information if any holidays were skipped
      if (result.skippedHolidays.length > 0) {
        const holidayNames = getHolidayNames(result.skippedHolidays, holidayLocation);
        setHolidayInfo({
          holidays: holidayNames,
          location: form.formatOption
        });
        setShowHolidayModal(true);
      }
    }
  };

  const handleModalBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      e.preventDefault();
      e.stopPropagation();
      handleCloseModal();
    }
  };

  return (
    <>
      <div className="relative">
        <div
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <button
            type="button"
            onClick={handleAutoGenerate}
            disabled={isDisabled}
            className={`text-sm font-medium flex items-center transition-colors ${
              !isDisabled
                ? 'text-indigo-600 hover:text-indigo-700 cursor-pointer'
                : 'text-gray-400 cursor-not-allowed'
            }`}
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Auto-generate
          </button>
        </div>
        
        {/* Tooltip - Only show when button is disabled and hovering */}
        {showTooltip && (
          <div 
            className="absolute -top-20 left-0 px-3 py-2 bg-black text-white text-sm rounded-lg shadow-lg whitespace-nowrap"
            style={{ zIndex: 99999 }}
            onMouseEnter={handleTooltipMouseEnter}
            onMouseLeave={handleTooltipMouseLeave}
          >
            <div className="font-medium mb-1">Fill required fields:</div>
            <div className="text-xs space-y-0.5">
              {form.days.length === 0 && <div>• Course Days</div>}
              {!form.totalDays && <div>• Total Days</div>}
              {!form.beginDate && <div>• Start Date</div>}
              {!form.formatOption && <div>• Location</div>}
            </div>
            {/* Tooltip arrow */}
            <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-black"></div>
          </div>
        )}
      </div>

      {/* Holiday Information Modal */}
      {showHolidayModal && (
        <div 
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
          style={{ zIndex: 50 }}
          onClick={handleModalBackdropClick}
        >
          <div 
            className="bg-white rounded-lg shadow-xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Holidays Skipped</h3>
              <button 
                onClick={handleButtonClose} 
                className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition-colors"
                type="button"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-3">
                The following holidays in <strong>{holidayInfo.location === 'VN' || holidayInfo.location === 'Hanoi' || holidayInfo.location === 'Saigon' ? 'Vietnam' : 'Germany'}</strong> were skipped when calculating the end date:
              </p>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <ul className="space-y-1">
                  {holidayInfo.holidays.map((holiday, index) => (
                    <li key={index} className="text-sm text-yellow-800 flex items-center">
                      <svg className="w-4 h-4 mr-2 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      {holiday}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={handleButtonClose}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                type="button"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AutoGenerateTooltip; 