// src/components/ChannelSettings.jsx
import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, UserPlus, Users, Settings } from 'lucide-react';
import { useChannelManagement } from '../../../hooks/useChannelManagement';
import { useAuth } from '../../../contexts/AuthContext';
import { canManageChannelMembers, hasManagementRole } from '../../../utils/roleUtils';

const ChannelSettings = ({ channel, isOpen, onClose, onUpdate }) => {
    const [activeTab, setActiveTab] = useState('members');
    const [allUsers, setAllUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [bulkMode, setBulkMode] = useState(false);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [error, setError] = useState('');
    
    const { userProfile } = useAuth();
    const {
        loading,
        addMemberToChannel,
        removeMemberFromChannel,
        bulkAddMembers,
        bulkRemoveMembers,
        getAllUsers
    } = useChannelManagement();

    // Check user permissions
    const isChannelAdmin = channel.admins?.includes(userProfile?.id);
    const isChannelModerator = channel.moderators?.includes(userProfile?.id);
    const isChannelCreator = channel.createdBy === userProfile?.id;
    const canManageChannel = isChannelAdmin || isChannelModerator || isChannelCreator;

    useEffect(() => {
        if (isOpen && channel) {
            loadAllUsers();
        }
    }, [isOpen, channel]);

    const loadAllUsers = async () => {
        try {
            setLoadingUsers(true);
            setError('');
            const users = await getAllUsers();
            setAllUsers(users);
            if (users.length === 0) {
                setError('No users found. Make sure users are properly registered in the system.');
            }
        } catch (error) {
            console.error('Error loading users:', error);
            setError('Failed to load users. Please try again.');
        } finally {
            setLoadingUsers(false);
        }
    };

    // Ensure channel.members is an array
    const channelMembersArray = channel.members || [];
    
    // Simplified filtering - first just show all users without search filter
    const filteredUsers = searchTerm.trim() === '' ? allUsers : allUsers.filter((user) => {
        const displayName = user.displayName || '';
        const email = user.email || '';
        const searchLower = searchTerm.toLowerCase();
        return displayName.toLowerCase().includes(searchLower) || email.toLowerCase().includes(searchLower);
    });
    
    // Ensure we have valid user IDs and channel member IDs
    const validFilteredUsers = filteredUsers.filter(user => user && user.id);
    const validChannelMembersArray = channelMembersArray.filter(id => id && typeof id === 'string');
    
    const availableUsers = validFilteredUsers.filter((user) => !validChannelMembersArray.includes(user.id));
    const channelMembers = validFilteredUsers.filter((user) => validChannelMembersArray.includes(user.id));



    const handleAddMember = async (userId) => {
        try {
            await addMemberToChannel(channel.id, userId);
            onUpdate?.();
            // TODO: Send notification to added user
        } catch (error) {
            console.error('Failed to add member:', error);
        }
    };

    const handleRemoveMember = async (userId) => {
        try {
            await removeMemberFromChannel(channel.id, userId);
            onUpdate?.();
            // TODO: Send notification to removed user
        } catch (error) {
            console.error('Failed to remove member:', error);
        }
    };

    const handleBulkAdd = async () => {
        if (selectedUsers.length === 0 || selectedUsers.length > 50) return;
        
        try {
            await bulkAddMembers(channel.id, selectedUsers);
            setSelectedUsers([]);
            setBulkMode(false);
            onUpdate?.();
            // TODO: Send bulk notifications
        } catch (error) {
            console.error('Failed to bulk add members:', error);
        }
    };

    const handleBulkRemove = async () => {
        if (selectedUsers.length === 0 || selectedUsers.length > 50) return;
        
        try {
            await bulkRemoveMembers(channel.id, selectedUsers);
            setSelectedUsers([]);
            setBulkMode(false);
            onUpdate?.();
            // TODO: Send bulk notifications
        } catch (error) {
            console.error('Failed to bulk remove members:', error);
        }
    };

    const toggleUserSelection = (userId) => {
        setSelectedUsers((prev) =>
            prev.includes(userId)
                ? prev.filter((id) => id !== userId)
                : [...prev, userId]
        );
    };

    if (!isOpen) return null;

    console.log('ChannelSettings rendering with:', {
        channel,
        allUsers,
        channelMembers,
        availableUsers,
        loadingUsers,
        error
    });

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[80vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">Channel Settings (Admin)</h2>
                        <p className="text-sm text-gray-500">#{channel.name}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('members')}
                        className={`px-6 py-3 text-sm font-medium ${
                            activeTab === 'members'
                                ? 'text-indigo-600 border-b-2 border-indigo-600'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <Users className="h-4 w-4 inline mr-2" />
                        Members ({channelMembersArray.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`px-6 py-3 text-sm font-medium ${
                            activeTab === 'settings'
                                ? 'text-indigo-600 border-b-2 border-indigo-600'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <Settings className="h-4 w-4 inline mr-2" />
                        Settings
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-96">
                    {activeTab === 'members' && (
                        <div className="space-y-6">
                            {/* Error Display */}
                            {error && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <p className="text-red-700 text-sm">{error}</p>
                                    <button 
                                        onClick={loadAllUsers}
                                        className="mt-2 text-red-600 hover:text-red-700 text-sm underline"
                                    >
                                        Try again
                                    </button>
                                </div>
                            )}

                            {/* Loading State */}
                            {loadingUsers && (
                                <div className="flex items-center justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                                    <span className="ml-2 text-gray-600">Loading users...</span>
                                </div>
                            )}
                            {/* Member Management Controls */}
                            {!canManageChannel && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                    <p className="text-yellow-700 text-sm">
                                        You don't have permission to manage members in this channel. 
                                        Only channel creators, admins, or users with management roles can add/remove members.
                                    </p>
                                </div>
                            )}
                            {canManageChannel && (
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <button
                                            onClick={() => setBulkMode(!bulkMode)}
                                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                                        >
                                            {bulkMode ? 'Exit Bulk Mode' : 'Bulk Operations'}
                                        </button>
                                        
                                        {bulkMode && selectedUsers.length > 0 && (
                                            <div className="flex items-center space-x-2">
                                                <span className="text-sm text-gray-600">
                                                    {selectedUsers.length}/50 selected
                                                </span>
                                                <button
                                                    onClick={handleBulkAdd}
                                                    className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                                                    disabled={selectedUsers.length === 0}
                                                >
                                                    Add Selected
                                                </button>
                                                <button
                                                    onClick={handleBulkRemove}
                                                    className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                                                    disabled={selectedUsers.length === 0}
                                                >
                                                    Remove Selected
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <input
                                        type="text"
                                        placeholder="Search users..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            )}



                            {/* Current Members */}
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-4">
                                    Current Members ({channelMembers.length})
                                </h3>
                                <div className="space-y-2 max-h-40 overflow-y-auto">
                                    {channelMembers.length === 0 ? (
                                        <div className="text-center py-4 text-gray-500">
                                            <p>No members found</p>
                                            <p className="text-sm">This might indicate an issue with user data or permissions.</p>
                                        </div>
                                    ) : (
                                        channelMembers.map((user) => (
                                        <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div className="flex items-center space-x-3">
                                                {bulkMode && (
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedUsers.includes(user.id)}
                                                        onChange={() => toggleUserSelection(user.id)}
                                                        className="h-4 w-4 text-indigo-600 rounded"
                                                    />
                                                )}
                                                <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                                    {user.displayName?.charAt(0) || user.email?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{user.displayName || user.email}</p>
                                                    <p className="text-xs text-gray-500">{user.email}</p>
                                                    {user.roles && (
                                                        <div className="flex space-x-1 mt-1">
                                                            {user.roles.map((role, idx) => (
                                                                <span key={idx} className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded">
                                                                    {role.name}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            {canManageChannel && !bulkMode && user.id !== channel.createdBy && (
                                                <button
                                                    onClick={() => handleRemoveMember(user.id)}
                                                    disabled={loading}
                                                    className="text-red-600 hover:text-red-700 disabled:opacity-50"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            )}
                                            {user.id === channel.createdBy && (
                                                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded">
                                                    Creator
                                                </span>
                                            )}
                                        </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Available Users to Add */}
                            {canManageChannel && (
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                                        Add Members ({availableUsers.length} available)
                                    </h3>
                                    {availableUsers.length === 0 ? (
                                        <div className="text-center py-4 text-gray-500">
                                            <p>No available users to add</p>
                                            <p className="text-sm">All users are already members or filtered out</p>
                                        </div>
                                    ) : (
                                    <div className="space-y-2 max-h-40 overflow-y-auto">
                                        {availableUsers.map((user) => (
                                            <div key={user.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                                                <div className="flex items-center space-x-3">
                                                    {bulkMode && (
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedUsers.includes(user.id)}
                                                            onChange={() => toggleUserSelection(user.id)}
                                                            className="h-4 w-4 text-indigo-600 rounded"
                                                        />
                                                    )}
                                                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-sm font-medium">
                                                        {user.displayName?.charAt(0) || user.email?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">{user.displayName || user.email}</p>
                                                        <p className="text-xs text-gray-500">{user.email}</p>
                                                        {user.roles && (
                                                            <div className="flex space-x-1 mt-1">
                                                                {user.roles.map((role, idx) => (
                                                                    <span key={idx} className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded">
                                                                        {role.name}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                {!bulkMode && (
                                                    <button
                                                        onClick={() => handleAddMember(user.id)}
                                                        disabled={loading}
                                                        className="text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
                                                    >
                                                        <UserPlus className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Channel Information</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Channel Name</label>
                                        <input
                                            type="text"
                                            value={channel.name}
                                            disabled={!canManageChannel}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                                        <textarea
                                            value={channel.description || ''}
                                            disabled={!canManageChannel}
                                            rows={3}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Channel Type</label>
                                        <select
                                            value={channel.type || 'general'}
                                            disabled={!canManageChannel}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50"
                                        >
                                            <option value="general">General</option>
                                            <option value="project">Project</option>
                                            <option value="department">Department</option>
                                            <option value="announcement">Announcement</option>
                                            <option value="social">Social</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Danger Zone for Managers */}
                            {isChannelCreator && (
                                <div className="border-t border-gray-200 pt-6">
                                    <h3 className="text-lg font-medium text-red-900 mb-4">Danger Zone</h3>
                                    <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
                                        Delete Channel
                                    </button>
                                    <p className="text-sm text-gray-500 mt-2">
                                        This action cannot be undone. All messages and data will be permanently deleted.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChannelSettings;