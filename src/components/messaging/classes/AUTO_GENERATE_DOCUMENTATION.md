# Auto-Generate End Date Functionality

## Overview

The auto-generate functionality automatically calculates the end date for a course based on:
- Start date
- Total number of course days
- Selected weekdays for the course
- Location-specific holidays (Vietnam or Germany)

## How It Works

### 1. Requirements
Before the auto-generate button becomes active, the following fields must be filled:
- **Course Days**: At least one weekday must be selected
- **Total Days**: The total number of course sessions
- **Start Date**: The course start date
- **Location**: Either VN/DE for online courses, or Hanoi/Saigon for offline courses

### 2. Calculation Logic

The algorithm works as follows:

1. **Start from the selected start date**
2. **Check each day sequentially**: Starting from the start date, check each day to see if it's a course day
3. **Count only course days**: Only days that fall on selected weekdays count toward the total
4. **Skip holidays**: If a course day is a holiday, it's skipped and doesn't count
5. **Continue until target reached**: Keep going until the required number of course days is completed

**Important Note**: If the start date is not one of the selected course days, the algorithm will skip to the next course day. For example:
- Start date: Sunday May 4th, 2025
- Course days: Mon, Wed, Fri
- The first course day will be Monday May 5th (not Sunday May 4th)

### 3. Holiday Handling

#### Vietnam Holidays (VN, Hanoi, Saigon)
- New Year's Day (January 1)
- Lunar New Year (Tet) - 5 days (dates vary by year)
- Hung Kings' Festival (dates vary by year)
- Liberation Day (April 30)
- International Labor Day (May 1)
- National Day (September 2)

#### Germany Holidays (DE)
- New Year's Day (January 1)
- Good Friday (dates vary by year)
- Easter Monday (dates vary by year)
- Labor Day (May 1)
- Ascension Day (dates vary by year)
- Whit Monday (dates vary by year)
- German Unity Day (October 3)
- Christmas Day (December 25)
- Boxing Day (December 26)

### 4. Holiday Notification

When holidays are encountered during the calculation:
- The holidays are automatically skipped
- A modal appears showing which holidays were skipped
- Holiday names and dates are displayed for user awareness

## Usage

### 1. Fill Required Fields
```
Course Days: Select weekdays (e.g., Mon, Wed, Fri)
Total Days: Enter number (e.g., 20)
Start Date: Select from calendar
Location: Choose VN, DE, Hanoi, or Saigon
```

### 2. Click Auto-Generate
- The button appears in the top-right of the "End Date" calendar
- Only active when all required fields are filled
- Shows tooltip with missing fields when disabled

### 3. Review Results
- End date is automatically selected on the calendar
- Calendar navigates to the end date month
- Holiday modal appears if any holidays were skipped

## Example Scenarios

### Scenario 1: Start Date is Not a Course Day
```
Start Date: 2025-05-04 (Sunday)
Course Days: Mon, Wed, Fri
Total Days: 3
Location: DE

Calculation:
- May 4 (Sun): Skip (not a course day)
- May 5 (Mon): Day 1 ✓
- May 6 (Tue): Skip (not a course day)
- May 7 (Wed): Day 2 ✓
- May 8 (Thu): Skip (not a course day)
- May 9 (Fri): Day 3 ✓

Result: End Date = 2025-05-09 (Friday)
```

### Scenario 2: Online Course in Vietnam
```
Start Date: 2025-01-27 (Monday)
Course Days: Mon, Wed, Fri
Total Days: 18
Location: VN

Result: 
- Skips Lunar New Year (Jan 28 - Feb 2)
- End Date: 2025-03-07 (Friday)
- Shows holiday notification for skipped Tet holidays
```

### Scenario 3: Offline Course in Germany
```
Start Date: 2025-04-14 (Monday)
Course Days: Mon, Tue, Thu
Total Days: 20
Location: DE

Result:
- Skips Good Friday (April 18) and Easter Monday (April 21)
- End Date: 2025-05-22 (Thursday)
- Shows holiday notification for skipped Easter holidays
```

### Scenario 4: No Holidays
```
Start Date: 2025-03-03 (Monday)
Course Days: Mon, Wed, Fri
Total Days: 15
Location: VN

Result:
- No holidays in the period
- End Date: 2025-04-04 (Friday)
- No holiday notification
```

## Technical Implementation

### Files Structure
```
src/
├── utils/
│   └── holidays.js                 # Holiday data and calculation logic
└── components/messaging/classes/
    ├── components/
    │   ├── AutoGenerateTooltip.jsx  # Auto-generate button and modal
    │   ├── CourseSchedule.jsx       # Course schedule form
    │   └── DateCalendar.jsx         # Calendar component
    └── hooks/
        └── useCourseForm.js         # Form state management
```

### Key Functions

#### `calculateEndDate(startDate, totalDays, weekdays, location)`
- **Input**: Start date, total days, weekdays array, location code
- **Output**: `{ endDate: string, skippedHolidays: string[] }`
- **Purpose**: Core calculation logic

#### `getHolidayNames(holidayDates, location)`
- **Input**: Array of holiday dates, location code
- **Output**: Array of formatted holiday names
- **Purpose**: Convert dates to readable holiday names

### Holiday Data Structure
```javascript
HOLIDAYS = {
  VN: {
    2024: ['2024-01-01', '2024-02-08', ...],
    2025: ['2025-01-01', '2025-01-28', ...],
    2026: ['2026-01-01', '2026-02-16', ...]
  },
  DE: {
    2024: ['2024-01-01', '2024-03-29', ...],
    2025: ['2025-01-01', '2025-04-18', ...],
    2026: ['2026-01-01', '2026-04-03', ...]
  }
}
```

## User Experience

### Visual Feedback
- **Disabled State**: Gray button with tooltip showing missing fields
- **Active State**: Blue button with lightning icon
- **Loading State**: Button shows processing (if needed)
- **Success State**: End date selected, calendar navigates to result

### Error Handling
- **Invalid Inputs**: Button remains disabled
- **Unknown Location**: Console warning, no calculation
- **No Holidays Data**: Calculation proceeds without holiday skipping

### Accessibility
- **Keyboard Navigation**: Button is focusable and clickable
- **Screen Readers**: Proper ARIA labels and descriptions
- **Color Contrast**: Meets WCAG guidelines for button states

## Maintenance

### Adding New Years
To add holiday data for new years:

1. **Update `src/utils/holidays.js`**
2. **Add new year entries to HOLIDAYS object**
3. **Include all relevant holidays for both VN and DE**
4. **Test with courses spanning the new year**

### Adding New Locations
To support additional locations:

1. **Add location code to HOLIDAYS object**
2. **Update location mapping in AutoGenerateTooltip**
3. **Add holiday names to getHolidayNames function**
4. **Update documentation**

## Testing

### Manual Testing Scenarios
1. **Basic Calculation**: Simple course with no holidays
2. **Holiday Skipping**: Course spanning major holidays
3. **Edge Cases**: Start date on holiday, weekend start dates
4. **Location Variations**: Test all supported locations
5. **UI States**: Test disabled/enabled button states

### Automated Testing (Recommended)
```javascript
// Example test cases
describe('calculateEndDate', () => {
  test('calculates end date without holidays', () => {
    // Test implementation
  });
  
  test('skips holidays correctly', () => {
    // Test implementation
  });
  
  test('handles edge cases', () => {
    // Test implementation
  });
});
```

## Future Enhancements

### Potential Improvements
1. **Custom Holiday Support**: Allow users to add custom holidays
2. **Multiple Locations**: Support courses spanning multiple locations
3. **Holiday Preferences**: Allow users to choose which holidays to observe
4. **Bulk Generation**: Generate multiple course schedules at once
5. **Export Functionality**: Export calculated schedules to calendar apps

### Performance Optimizations
1. **Memoization**: Cache holiday calculations
2. **Lazy Loading**: Load holiday data only when needed
3. **Web Workers**: Move calculations to background thread for large datasets 