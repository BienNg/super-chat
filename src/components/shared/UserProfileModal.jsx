import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Mail, 
  Calendar, 
  Clock, 
  Settings, 
  Bell, 
  Shield, 
  Palette, 
  Save,
  Edit3,
  Camera,
  Check,
  AlertCircle,
  Moon,
  Sun,
  Globe,
  Smartphone
} from 'lucide-react';

/**
 * ProfileSettingsModal - Comprehensive profile and settings management
 */
const ProfileSettingsModal = ({ isOpen, onClose, userProfile, currentUser, onLogout, onSave }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({});
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: true,
      mentions: true,
      messages: true
    },
    appearance: {
      theme: 'light',
      language: 'en',
      timezone: 'UTC'
    },
    privacy: {
      showOnlineStatus: true,
      allowDirectMessages: true,
      showEmail: false
    }
  });
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setEditedProfile({
        fullName: userProfile.fullName || '',
        role: userProfile.role || '',
        department: userProfile.department || '',
        bio: userProfile.bio || '',
        phone: userProfile.phone || '',
        location: userProfile.location || ''
      });
    }
  }, [userProfile]);

  if (!isOpen) return null;

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'account', label: 'Account', icon: Settings }
  ];

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });
  };

  const handleInputChange = (field, value) => {
    setEditedProfile(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSettingChange = (category, setting, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: value
      }
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    if (onSave) {
      onSave({ profile: editedProfile, settings });
    }
    setIsEditing(false);
    setHasChanges(false);
  };

  const renderProfileTab = () => (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="flex items-center space-x-6 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-indigo-600 flex items-center justify-center text-white text-3xl font-semibold shadow-lg">
            {editedProfile.fullName?.charAt(0) || currentUser?.email?.charAt(0) || 'U'}
          </div>
          <button className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center text-indigo-600 hover:bg-indigo-50 transition-colors">
            <Camera className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <h3 className="text-2xl font-semibold text-gray-900">
              {editedProfile.fullName || 'Your Name'}
            </h3>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          </div>
          <p className="text-indigo-600 font-medium">{editedProfile.role || 'Member'}</p>
          <p className="text-gray-500 text-sm">{currentUser?.email}</p>
        </div>
      </div>

      {/* Profile Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
          <input
            type="text"
            value={editedProfile.fullName || ''}
            onChange={(e) => handleInputChange('fullName', e.target.value)}
            disabled={!isEditing}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
            placeholder="Enter your full name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
          <input
            type="text"
            value={editedProfile.role || ''}
            onChange={(e) => handleInputChange('role', e.target.value)}
            disabled={!isEditing}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
            placeholder="Your role or title"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
          <input
            type="text"
            value={editedProfile.department || ''}
            onChange={(e) => handleInputChange('department', e.target.value)}
            disabled={!isEditing}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
            placeholder="Department or team"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
          <input
            type="tel"
            value={editedProfile.phone || ''}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            disabled={!isEditing}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
            placeholder="Phone number"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
          <input
            type="text"
            value={editedProfile.location || ''}
            onChange={(e) => handleInputChange('location', e.target.value)}
            disabled={!isEditing}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
            placeholder="City, Country"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
          <textarea
            value={editedProfile.bio || ''}
            onChange={(e) => handleInputChange('bio', e.target.value)}
            disabled={!isEditing}
            rows={3}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50 disabled:text-gray-500 transition-colors resize-none"
            placeholder="Tell us about yourself..."
          />
        </div>
      </div>
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="space-y-6">
      <div>
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Notification Preferences</h4>
        <div className="space-y-4">
          {[
            { key: 'email', label: 'Email Notifications', desc: 'Receive notifications via email' },
            { key: 'push', label: 'Push Notifications', desc: 'Browser and mobile push notifications' },
            { key: 'mentions', label: 'Mentions & Replies', desc: 'When someone mentions you or replies' },
            { key: 'messages', label: 'Direct Messages', desc: 'New direct message notifications' }
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h5 className="font-medium text-gray-900">{label}</h5>
                <p className="text-sm text-gray-500">{desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifications[key]}
                  onChange={(e) => handleSettingChange('notifications', key, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAppearanceTab = () => (
    <div className="space-y-6">
      <div>
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Appearance Settings</h4>
        <div className="space-y-6">
          {/* Theme Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Theme</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'light', label: 'Light', icon: Sun },
                { value: 'dark', label: 'Dark', icon: Moon }
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => handleSettingChange('appearance', 'theme', value)}
                  className={`p-4 border-2 rounded-lg flex items-center space-x-3 transition-colors ${
                    settings.appearance.theme === value
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Language Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
            <select
              value={settings.appearance.language}
              onChange={(e) => handleSettingChange('appearance', 'language', e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
            </select>
          </div>

          {/* Timezone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
            <select
              value={settings.appearance.timezone}
              onChange={(e) => handleSettingChange('appearance', 'timezone', e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="UTC">UTC</option>
              <option value="EST">Eastern Time</option>
              <option value="PST">Pacific Time</option>
              <option value="GMT">Greenwich Mean Time</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPrivacyTab = () => (
    <div className="space-y-6">
      <div>
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Privacy Settings</h4>
        <div className="space-y-4">
          {[
            { key: 'showOnlineStatus', label: 'Show Online Status', desc: 'Let others see when you\'re online' },
            { key: 'allowDirectMessages', label: 'Allow Direct Messages', desc: 'Allow others to send you direct messages' },
            { key: 'showEmail', label: 'Show Email Address', desc: 'Display your email in your profile' }
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h5 className="font-medium text-gray-900">{label}</h5>
                <p className="text-sm text-gray-500">{desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.privacy[key]}
                  onChange={(e) => handleSettingChange('privacy', key, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAccountTab = () => (
    <div className="space-y-6">
      <div>
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h4>
        <div className="bg-gray-50 rounded-lg p-6 space-y-4">
          <div className="flex items-center space-x-3">
            <Mail className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Email Address</p>
              <p className="font-medium text-gray-900">{currentUser?.email}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <User className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">User ID</p>
              <p className="font-medium text-gray-900 font-mono text-sm">{currentUser?.uid}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Calendar className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Member Since</p>
              <p className="font-medium text-gray-900">{formatDate(currentUser?.metadata?.creationTime)}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Clock className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Last Sign In</p>
              <p className="font-medium text-gray-900">{formatDate(currentUser?.metadata?.lastSignInTime)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="border border-red-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-red-900 mb-2 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          Danger Zone
        </h4>
        <p className="text-sm text-red-700 mb-4">
          These actions cannot be undone. Please be careful.
        </p>
        <button
          onClick={onLogout}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
        >
          Sign Out
        </button>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile': return renderProfileTab();
      case 'notifications': return renderNotificationsTab();
      case 'appearance': return renderAppearanceTab();
      case 'privacy': return renderPrivacyTab();
      case 'account': return renderAccountTab();
      default: return renderProfileTab();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden transform transition-all">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-white">Profile & Settings</h2>
          <button 
            onClick={onClose}
            className="text-white hover:text-indigo-200 transition-colors p-1"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex h-[calc(90vh-80px)]">
          {/* Sidebar Navigation */}
          <div className="w-64 bg-gray-50 border-r border-gray-200 p-4">
            <nav className="space-y-2">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === id
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1 overflow-y-auto p-6">
              {renderTabContent()}
            </div>

            {/* Footer */}
            {hasChanges && (
              <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-between items-center">
                <div className="flex items-center space-x-2 text-amber-600">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">You have unsaved changes</span>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setHasChanges(false);
                      setIsEditing(false);
                      // Reset changes
                      if (userProfile) {
                        setEditedProfile({
                          fullName: userProfile.fullName || '',
                          role: userProfile.role || '',
                          department: userProfile.department || '',
                          bio: userProfile.bio || '',
                          phone: userProfile.phone || '',
                          location: userProfile.location || ''
                        });
                      }
                    }}
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettingsModal;
