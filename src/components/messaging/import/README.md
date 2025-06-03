# Import Components

This directory contains components related to import functionality for channels with type "import".

## Current Status

The import tab is currently showing a "coming soon" message. The basic structure is in place with:

- Import tab navigation
- ImportTab component with coming soon UI
- Routing configured

## Planned Components

### Core Import Components
- `ImportWizard.jsx` - Step-by-step import process
- `FileUpload.jsx` - File upload interface for CSV/Excel files
- `DataMapping.jsx` - Map imported data to channel fields
- `ImportHistory.jsx` - View past imports and their status

### Supporting Components
- `ImportPreview.jsx` - Preview data before import
- `ImportProgress.jsx` - Show import progress
- `ImportSettings.jsx` - Configure import preferences
- `ImportValidation.jsx` - Validate imported data

## Features to Implement

### File Import
- CSV file upload and parsing
- Excel file support
- Data validation and error handling
- Column mapping interface

### Database Integration
- Connect to external databases
- Query builder interface
- Scheduled imports

### API Integration
- REST API connections
- Authentication handling
- Data transformation

### Import Management
- Import history and logs
- Rollback functionality
- Duplicate detection
- Error reporting

## Design Guidelines

Follow the established design system:
- Use indigo color scheme for primary actions
- Implement proper loading states
- Include helpful error messages
- Maintain consistent spacing and typography
- Ensure accessibility compliance 