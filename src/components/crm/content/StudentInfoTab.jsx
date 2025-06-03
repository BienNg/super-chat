import React from 'react';
import { Mail, Phone, MapPin, Calendar, Tag, User, Globe, Monitor, FileText, Edit2, Check, X } from 'lucide-react';
import { SupabaseCollectionSelector, SupabaseMultiSelectSelector } from '../../shared/index';
import { useFieldEdit } from '../../../hooks/useFieldEdit';

const StudentInfoTab = ({ 
  student, 
  updateStudent,
  countries,
  addCountry,
  cities,
  addCity,
  platforms,
  addPlatform,
  categories,
  addCategory
}) => {
  const {
    editField,
    editValue,
    handleEditStart,
    handleEditCancel,
    handleEditSave,
    setEditValue
  } = useFieldEdit(updateStudent);

  const CompactField = ({ label, value, fieldName, type = "text", placeholder = "", rows = 1, icon: Icon }) => (
    <div className="flex items-center space-x-2 py-1">
      {Icon && (
        <div className="flex-shrink-0 p-1 bg-gray-50 rounded">
          <Icon className="w-3 h-3 text-gray-500" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-gray-600 w-20 flex-shrink-0">{label}</label>
          {!editField && (
            <button 
              onClick={() => handleEditStart(fieldName, value)}
              className="p-0.5 text-gray-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Edit2 className="w-3 h-3" />
            </button>
          )}
        </div>
        
        {editField === fieldName ? (
          <div className="space-y-1 mt-1">
            {type === "textarea" ? (
              <textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                rows={rows}
                placeholder={placeholder}
                autoFocus
              />
            ) : (
              <input
                type={type}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder={placeholder}
                autoFocus
              />
            )}
            <div className="flex justify-end space-x-1">
              <button 
                onClick={() => handleEditSave(student.id)}
                className="px-2 py-0.5 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700"
              >
                ✓
              </button>
              <button 
                onClick={handleEditCancel}
                className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded hover:bg-gray-200"
              >
                ✕
              </button>
            </div>
          </div>
        ) : (
          <p className="text-xs text-gray-900 mt-0.5 truncate">{value || <span className="text-gray-400 italic">Not provided</span>}</p>
        )}
      </div>
    </div>
  );

  const SelectorField = ({ label, children, icon: Icon }) => (
    <div className="flex items-center space-x-2 py-1">
      {Icon && (
        <div className="flex-shrink-0 p-1 bg-gray-50 rounded">
          <Icon className="w-3 h-3 text-gray-500" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <label className="text-xs font-medium text-gray-600 block mb-1">{label}</label>
        {children}
      </div>
    </div>
  );

  return (
    <div className="space-y-3 max-h-[70vh] overflow-y-auto">
      {/* Quick Overview Header */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-3 border border-indigo-100">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="text-center">
            <div className="text-gray-500">Email</div>
            <div className="font-medium text-gray-900 truncate">{student.email || 'Not provided'}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-500">Status</div>
            <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${
              student.status === 'active' ? 'bg-green-100 text-green-800' :
              student.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
              student.status === 'suspended' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {student.status || 'Active'}
            </span>
          </div>
        </div>
      </div>

      {/* Compact Form Fields */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 space-y-2 group">
        <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
          <User className="w-4 h-4 text-indigo-600 mr-2" />
          Personal Information
        </h3>
        
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <CompactField
            label="Name"
            value={student.name}
            fieldName="name"
            placeholder="Full name"
            icon={User}
          />
          
          <CompactField
            label="Phone"
            value={student.phone}
            fieldName="phone"
            type="tel"
            placeholder="+1 (555) 123-4567"
            icon={Phone}
          />
          
          <CompactField
            label="Email"
            value={student.email}
            fieldName="email"
            type="email"
            placeholder="email@example.com"
            icon={Mail}
          />
          
          <CompactField
            label="Emergency"
            value={student.emergencyContact}
            fieldName="emergencyContact"
            placeholder="Emergency contact"
            icon={Phone}
          />
        </div>

        {/* Quick Info Row */}
        <div className="grid grid-cols-3 gap-2 pt-2 mt-2 border-t border-gray-100 text-xs">
          <div>
            <span className="text-gray-500">DOB:</span>
            <span className="ml-1 text-gray-900">{student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not provided'}</span>
          </div>
          <div>
            <span className="text-gray-500">Gender:</span>
            <span className="ml-1 text-gray-900">{student.gender || 'Not provided'}</span>
          </div>
          <div>
            <span className="text-gray-500">Level:</span>
            <span className="ml-1 text-gray-900">{student.level || 'Not provided'}</span>
          </div>
        </div>
      </div>

      {/* Location & Platform */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 space-y-2">
        <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
          <MapPin className="w-4 h-4 text-indigo-600 mr-2" />
          Location & Platform
        </h3>
        
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          <SelectorField label="Country" icon={Globe}>
            <SupabaseCollectionSelector
              tableName="countries"
              record={student}
              updateRecord={updateStudent}
              fieldName="location"
              fieldDisplayName="Country"
              options={countries}
              addOption={addCountry}
            />
          </SelectorField>
          
          <SelectorField label="City" icon={MapPin}>
            <SupabaseCollectionSelector
              tableName="cities"
              record={student}
              updateRecord={updateStudent}
              fieldName="city"
              fieldDisplayName="City"
              options={cities}
              addOption={addCity}
            />
          </SelectorField>
          
          <SelectorField label="Platform" icon={Monitor}>
            <SupabaseCollectionSelector
              tableName="platforms"
              record={student}
              updateRecord={updateStudent}
              fieldName="platform"
              fieldDisplayName="Platform"
              options={platforms}
              addOption={addPlatform}
            />
          </SelectorField>
          
          <SelectorField label="Categories" icon={Tag}>
            <SupabaseMultiSelectSelector
              tableName="categories"
              record={student}
              updateRecord={updateStudent}
              fieldName="categories"
              fieldDisplayName="Category"
              options={categories}
              addOption={addCategory}
            />
          </SelectorField>
        </div>
        
        <div className="pt-2 border-t border-gray-100">
          <CompactField
            label="Address"
            value={student.address}
            fieldName="address"
            placeholder="Full address"
            icon={MapPin}
          />
        </div>
      </div>

      {/* Academic & Notes */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 space-y-2">
        <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
          <FileText className="w-4 h-4 text-indigo-600 mr-2" />
          Academic Information
        </h3>
        
        <div className="grid grid-cols-2 gap-2 text-xs mb-2">
          <div>
            <span className="text-gray-500">Enrolled:</span>
            <span className="ml-1 text-gray-900">{student.enrollmentDate ? new Date(student.enrollmentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not provided'}</span>
          </div>
          <div>
            <span className="text-gray-500">Level:</span>
            <span className="ml-1 text-gray-900">{student.level || 'Not provided'}</span>
          </div>
        </div>
        
        <CompactField
          label="Notes"
          value={student.notes}
          fieldName="notes"
          type="textarea"
          rows={2}
          placeholder="Add notes..."
          icon={FileText}
        />
      </div>
    </div>
  );
};

export default StudentInfoTab; 