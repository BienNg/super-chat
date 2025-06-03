import React, { useState, useEffect } from 'react';
import { 
    X, 
    Star, 
    Bell, 
    Search, 
    UserPlus, 
    MoreHorizontal, 
    Loader2, 
    Trash2,
    Hash,
    Users,
    Settings,
    Crown,
    Shield,
    Copy,
    ChevronDown,
    Edit3,
    Calendar,
    Globe,
    Lock,
    AlertCircle,
    Check
} from 'lucide-react';
import { doc, updateDoc, serverTimestamp, query, where, getDocs, collection } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useChannelManagement } from '../../../hooks/useChannelManagement';
import { useAuth } from '../../../contexts/AuthContext';
import { useChannelClassSync } from '../../../hooks/useChannelClassSync';
import { canDeleteChannel as canDeleteChannelUtil } from '../../../utils/roleUtils';
import { useClasses } from '../../../hooks/useClasses';
import DeleteChannelModal from './DeleteChannelModal';

const ChannelAboutModal = ({ isOpen, onClose, channel, onUpdate, onChannelDeleted, initialTab = 'about' }) => {
    const [activeTab, setActiveTab] = useState(initialTab);
    const [searchQuery, setSearchQuery] = useState('');
    const [allUsers, setAllUsers] = useState([]);
    const [channelMembers, setChannelMembers] = useState([]);
    const [availableUsers, setAvailableUsers] = useState([]);
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    const [selectedUsersToAdd, setSelectedUsersToAdd] = useState([]);
    const [editingType, setEditingType] = useState(false);
    const [selectedType, setSelectedType] = useState(channel?.type || 'general');
    const [showTypeDropdown, setShowTypeDropdown] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [copiedChannelId, setCopiedChannelId] = useState(false);
    const [editingName, setEditingName] = useState(false);
    const [editingTopic, setEditingTopic] = useState(false);
    const [editingDescription, setEditingDescription] = useState(false);
    const [tempChannelName, setTempChannelName] = useState(channel?.name || '');
    const [tempTopic, setTempTopic] = useState(channel?.topic || '');
    const [tempDescription, setTempDescription] = useState(channel?.description || '');
    const [nameError, setNameError] = useState('');
    const { classes } = useClasses(channel?.id);
    const classInfo = classes && classes.length > 0 ? classes[0] : null;

    const { userProfile } = useAuth();
    const {
        loading,
        addMemberToChannel,
        removeMemberFromChannel,
        getAllUsers,
        deleteChannel
    } = useChannelManagement();

    const { handleChannelTypeChange } = useChannelClassSync();

    // Channel types with enhanced metadata
    const channelTypes = [
        { id: 'general', name: 'General', icon: Hash, description: 'General discussions and announcements' },
        { id: 'class', name: 'Class', icon: Users, description: 'Educational content and class management' },
        { id: 'import', name: 'Import', icon: Globe, description: 'External content and integrations' },
        { id: 'social-media', name: 'Social Media', icon: Globe, description: 'Social media management and content' },
        { id: 'management', name: 'Management', icon: Settings, description: 'Administrative and management tasks' },
        { id: 'customer-support', name: 'Customer Support', icon: Users, description: 'Customer service and support' },
        { id: 'bookkeeping', name: 'Bookkeeping', icon: Settings, description: 'Financial records and accounting' }
    ];

    useEffect(() => {
        if (isOpen) {
            loadUsers();
            setSelectedType(channel?.type || 'general');
            setTempChannelName(channel?.name || '');
            setTempTopic(channel?.topic || '');
            setTempDescription(channel?.description || '');
            setActiveTab(initialTab);
        }
    }, [isOpen, channel, initialTab]);

    if (!isOpen) return null;

    const loadUsers = async () => {
        try {
            const users = await getAllUsers();
            setAllUsers(users);
            
            // Filter members and available users
            const members = users.filter(user => channel.members?.includes(user.id));
            const available = users.filter(user => !channel.members?.includes(user.id));
            
            setChannelMembers(members);
            setAvailableUsers(available);
        } catch (error) {
            console.error('Error loading users:', error);
        }
    };

    const handleCopyChannelId = async () => {
        try {
            await navigator.clipboard.writeText(channel.id);
            setCopiedChannelId(true);
            setTimeout(() => setCopiedChannelId(false), 2000);
        } catch (error) {
            console.error('Failed to copy channel ID:', error);
        }
    };

    const handleUpdateChannelType = async () => {
        if (selectedType === channel.type) {
            setEditingType(false);
            return;
        }

        try {
            setUpdating(true);
            const oldType = channel.type;
            
            // Update channel type in database
            const channelRef = doc(db, 'channels', channel.id);
            await updateDoc(channelRef, {
                type: selectedType,
                updatedAt: serverTimestamp()
            });
            
            // Handle class creation/archiving based on type change
            await handleChannelTypeChange(channel.id, selectedType, oldType, channel.name);
            
            setEditingType(false);
            onUpdate?.(); // Notify parent component to refresh
        } catch (error) {
            console.error('Failed to update channel type:', error);
            // Reset to original value on error
            setSelectedType(channel?.type || 'general');
        } finally {
            setUpdating(false);
        }
    };

    const handleCancelTypeEdit = () => {
        setSelectedType(channel?.type || 'general');
        setEditingType(false);
        setShowTypeDropdown(false);
    };

    const handleAddMember = async (userId) => {
        try {
            await addMemberToChannel(channel.id, userId, channel.name);
            await loadUsers(); // Refresh the user lists
            onUpdate?.(); // Notify parent component to refresh
        } catch (error) {
            console.error('Failed to add member:', error);
            // TODO: Show error toast
        }
    };

    const handleRemoveMember = async (userId) => {
        try {
            await removeMemberFromChannel(channel.id, userId, channel.name);
            await loadUsers(); // Refresh the user lists
            onUpdate?.(); // Notify parent component to refresh
        } catch (error) {
            console.error('Failed to remove member:', error);
            // TODO: Show error toast
        }
    };

    const handleBulkAddMembers = async () => {
        if (selectedUsersToAdd.length === 0) return;
        
        try {
            // Add members one by one to ensure proper notifications
            for (const userId of selectedUsersToAdd) {
                await addMemberToChannel(channel.id, userId, channel.name);
            }
            
            setSelectedUsersToAdd([]);
            setShowAddMemberModal(false);
            await loadUsers();
            onUpdate?.();
        } catch (error) {
            console.error('Failed to add members:', error);
            // TODO: Show error toast
        }
    };

    const toggleUserSelection = (userId) => {
        setSelectedUsersToAdd(prev => 
            prev.includes(userId) 
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const filteredMembers = channelMembers.filter(member => 
        member.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredAvailableUsers = availableUsers.filter(user =>
        user.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusColor = (userId) => {
        // Simple status simulation - in real app, you'd track this in Firebase
        const colors = ['bg-green-500', 'bg-yellow-500', 'bg-gray-400'];
        return colors[userId.length % 3];
    };

    const getLastSeen = (userId) => {
        // Simple last seen simulation - in real app, you'd track this in Firebase
        const options = ['Active now', '5m ago', '1h ago', '2h ago'];
        return options[userId.length % 4];
    };

    const getUserInitials = (user) => {
        if (user.displayName) {
            return user.displayName.charAt(0).toUpperCase();
        }
        return user.email?.charAt(0).toUpperCase() || '?';
    };

    const getUserColor = (userId) => {
        const colors = ['bg-indigo-500', 'bg-pink-500', 'bg-green-500', 'bg-purple-500', 'bg-blue-500', 'bg-red-500'];
        return colors[userId.length % colors.length];
    };

    const isChannelCreator = (userId) => {
        return channel.createdBy === userId;
    };

    const canManageMembers = () => {
        // Allow everyone to add members - no restrictions
        return true;
    };

    const handleDeleteChannel = async () => {
        try {
            await deleteChannel(channel.id, channel.name);
            setShowDeleteModal(false);
            onClose();
            // Notify parent component that channel was deleted
            if (onChannelDeleted) {
                onChannelDeleted(channel.id);
            }
        } catch (error) {
            // Error will be handled by the DeleteChannelModal
            throw error;
        }
    };

    // Check if current user can delete the channel
    const canDeleteChannel = () => {
        if (!userProfile || !channel) return false;
        
        // Channel creator can always delete
        if (channel.createdBy === userProfile.id) return true;
        
        // Channel admins can delete
        if (channel.admins?.includes(userProfile.id)) return true;
        
        // Use role-based permissions
        if (canDeleteChannelUtil(userProfile.roles)) return true;
        
        return false;
    };

    const getCurrentChannelType = () => {
        return channelTypes.find(t => t.id === (channel.type || 'general')) || channelTypes[0];
    };

    const formatCreatedDate = (timestamp) => {
        if (!timestamp) return 'Unknown date';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    };

    // Render format/location for class channels
    const renderClassMeta = () => {
        if (channel.type !== 'class' || !classInfo) return null;
        if (!classInfo.format && !classInfo.formatOption) return null;
        return (
            <span className="flex items-center ml-2 gap-1 text-gray-100 text-xs">
                <Globe className="w-3 h-3 text-indigo-200 mr-1" />
                <span className="font-semibold">{classInfo.format}</span>
                {classInfo.format && classInfo.formatOption && <span className="mx-1">·</span>}
                {classInfo.formatOption && <span>{classInfo.formatOption}</span>}
            </span>
        );
    };

    // Function to check if channel name already exists (excluding current channel)
    const checkChannelNameExists = async (channelName) => {
        try {
            const channelsRef = collection(db, 'channels');
            const q = query(channelsRef, where('name', '==', channelName.trim()));
            const snapshot = await getDocs(q);
            
            // Check if any found channel is different from current channel
            return snapshot.docs.some(doc => doc.id !== channel.id);
        } catch (error) {
            console.error('Error checking channel name:', error);
            throw new Error('Unable to verify channel name availability');
        }
    };

    // Handle channel name update
    const handleUpdateChannelName = async () => {
        if (tempChannelName.trim() === channel.name) {
            setEditingName(false);
            return;
        }

        if (!tempChannelName.trim()) {
            setNameError('Channel name cannot be empty. Please enter a valid name.');
            return;
        }

        try {
            setNameError('');
            setUpdating(true);
            
            // Check if channel name already exists
            const nameExists = await checkChannelNameExists(tempChannelName);
            if (nameExists) {
                setNameError(`The name "${tempChannelName}" is already taken by another channel. Please try something like "${tempChannelName}-2" or "${tempChannelName}-updated".`);
                return;
            }
            
            const channelRef = doc(db, 'channels', channel.id);
            await updateDoc(channelRef, {
                name: tempChannelName.trim(),
                updatedAt: serverTimestamp()
            });
            
            setEditingName(false);
            onUpdate?.(); // Notify parent component to refresh
        } catch (error) {
            console.error('Failed to update channel name:', error);
            if (error.message.includes('Unable to verify channel name availability')) {
                setNameError('Unable to verify if this name is available. Please check your connection and try again.');
            } else {
                setNameError('Unable to save the new channel name. Please try again in a moment.');
            }
            // Reset to original value on error
            setTempChannelName(channel?.name || '');
        } finally {
            setUpdating(false);
        }
    };

    // Handle channel topic update
    const handleUpdateChannelTopic = async () => {
        if (tempTopic.trim() === (channel.topic || '')) {
            setEditingTopic(false);
            return;
        }

        try {
            setUpdating(true);
            
            const channelRef = doc(db, 'channels', channel.id);
            await updateDoc(channelRef, {
                topic: tempTopic.trim(),
                updatedAt: serverTimestamp()
            });
            
            setEditingTopic(false);
            onUpdate?.(); // Notify parent component to refresh
        } catch (error) {
            console.error('Failed to update channel topic:', error);
            // Reset to original value on error
            setTempTopic(channel?.topic || '');
        } finally {
            setUpdating(false);
        }
    };

    // Handle channel description update
    const handleUpdateChannelDescription = async () => {
        if (tempDescription.trim() === (channel.description || '')) {
            setEditingDescription(false);
            return;
        }

        try {
            setUpdating(true);
            
            const channelRef = doc(db, 'channels', channel.id);
            await updateDoc(channelRef, {
                description: tempDescription.trim(),
                updatedAt: serverTimestamp()
            });
            
            setEditingDescription(false);
            onUpdate?.(); // Notify parent component to refresh
        } catch (error) {
            console.error('Failed to update channel description:', error);
            // Reset to original value on error
            setTempDescription(channel?.description || '');
        } finally {
            setUpdating(false);
        }
    };

    const renderMembersTab = () => (
        <div className="space-y-6">
            {/* Enhanced Search and Add Members Section */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search members by name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white shadow-sm"
                        />
                    </div>
                    {canManageMembers() && (
                        <button 
                            onClick={() => setShowAddMemberModal(true)}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-200 disabled:opacity-50 shadow-sm hover:shadow-md font-medium"
                        >
                            {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <UserPlus className="h-4 w-4" />
                            )}
                            <span className="text-sm">Add Members</span>
                        </button>
                    )}
                </div>
                
                {/* Member count and stats */}
                <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {channelMembers.length} member{channelMembers.length !== 1 ? 's' : ''}
                    </span>
                    <span className="flex items-center gap-1">
                        <Crown className="h-4 w-4 text-yellow-500" />
                        {channelMembers.filter(m => isChannelCreator(m.id)).length} creator
                    </span>
                    <span className="flex items-center gap-1">
                        <Shield className="h-4 w-4 text-purple-500" />
                        {channelMembers.filter(m => m.roles?.some(role => role.name === 'admin')).length} admin{channelMembers.filter(m => m.roles?.some(role => role.name === 'admin')).length !== 1 ? 's' : ''}
                    </span>
                </div>
            </div>

            {/* Enhanced Members List */}
            <div className="space-y-3">
                {filteredMembers.map((member) => (
                    <div key={member.id} className="group bg-white border border-gray-200 rounded-xl p-4 hover:border-indigo-200 hover:shadow-md transition-all duration-200">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <div className={`w-12 h-12 ${getUserColor(member.id)} rounded-full flex items-center justify-center text-white font-semibold text-lg shadow-sm`}>
                                        {getUserInitials(member)}
                                    </div>
                                    <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${getStatusColor(member.id)} shadow-sm`} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-base font-semibold text-gray-900">
                                            {member.displayName || member.email}
                                        </h3>
                                        {isChannelCreator(member.id) && (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs font-medium">
                                                <Crown className="h-3 w-3" />
                                                Creator
                                            </span>
                                        )}
                                        {member.roles?.some(role => role.name === 'admin') && (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-medium">
                                                <Shield className="h-3 w-3" />
                                                Admin
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-500">
                                        <span>{member.email}</span>
                                        <span>•</span>
                                        <span className="flex items-center gap-1">
                                            <div className={`w-2 h-2 rounded-full ${getStatusColor(member.id)}`} />
                                            {getLastSeen(member.id)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            {canManageMembers() && !isChannelCreator(member.id) && (
                                <button 
                                    onClick={() => handleRemoveMember(member.id)}
                                    disabled={loading}
                                    className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 disabled:opacity-50"
                                    title="Remove member"
                                >
                                    <MoreHorizontal className="h-5 w-5" />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Enhanced Add Members Modal */}
            {showAddMemberModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg max-h-[600px] flex flex-col shadow-2xl">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <div>
                                <h3 className="text-xl font-semibold text-gray-900">Add Members</h3>
                                <p className="text-sm text-gray-500 mt-1">Select users to add to #{channel.name}</p>
                            </div>
                            <button 
                                onClick={() => {
                                    setShowAddMemberModal(false);
                                    setSelectedUsersToAdd([]);
                                }}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="space-y-3">
                                {filteredAvailableUsers.map((user) => (
                                    <label key={user.id} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={selectedUsersToAdd.includes(user.id)}
                                            onChange={() => toggleUserSelection(user.id)}
                                            className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                                        />
                                        <div className={`w-10 h-10 ${getUserColor(user.id)} rounded-full flex items-center justify-center text-white text-sm font-semibold`}>
                                            {getUserInitials(user)}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">
                                                {user.displayName || user.email}
                                            </p>
                                            <p className="text-xs text-gray-500">{user.email}</p>
                                        </div>
                                    </label>
                                ))}
                                {filteredAvailableUsers.length === 0 && (
                                    <div className="text-center py-8">
                                        <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-500">No available users to add</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
                            <button
                                onClick={() => {
                                    setShowAddMemberModal(false);
                                    setSelectedUsersToAdd([]);
                                }}
                                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleBulkAddMembers}
                                disabled={selectedUsersToAdd.length === 0 || loading}
                                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium transition-colors shadow-sm"
                            >
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Adding...
                                    </div>
                                ) : (
                                    `Add ${selectedUsersToAdd.length} member${selectedUsersToAdd.length !== 1 ? 's' : ''}`
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    const renderTabsTab = () => (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Channel Features</h3>
                <p className="text-sm text-gray-600 mb-4">Configure which features are available in this channel</p>
                <div className="space-y-4">
                    {['Messages', 'Tasks', 'Wiki'].map((tab) => (
                        <div key={tab} className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                                    {tab === 'Messages' && <Hash className="h-4 w-4 text-indigo-600" />}
                                    {tab === 'Tasks' && <Check className="h-4 w-4 text-indigo-600" />}
                                    {tab === 'Wiki' && <Globe className="h-4 w-4 text-indigo-600" />}
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-gray-900">{tab}</span>
                                    <p className="text-xs text-gray-500">
                                        {tab === 'Messages' && 'Real-time messaging and conversations'}
                                        {tab === 'Tasks' && 'Task management and tracking'}
                                        {tab === 'Wiki' && 'Knowledge base and documentation'}
                                    </p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" defaultChecked />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-4xl h-[700px] flex flex-col shadow-2xl">
                {/* Enhanced Header */}
                <div className="flex-shrink-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-2xl">
                    <div className="flex items-center justify-between p-6">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                                <Hash className="h-6 w-6" />
                            </div>
                            <div className="flex items-center">
                                <h2 className="text-2xl font-bold">#{channel.name}</h2>
                                {renderClassMeta()}
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <button className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors">
                                <Star className="h-5 w-5" />
                            </button>
                            <div className="relative">
                                <button className="flex items-center space-x-2 text-sm bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg px-3 py-2 transition-colors">
                                    <Bell className="h-4 w-4" />
                                    <span>Notifications</span>
                                    <ChevronDown className="h-4 w-4" />
                                </button>
                            </div>
                            <button 
                                onClick={onClose} 
                                className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Enhanced Tabs */}
                <div className="flex-shrink-0 flex border-b border-gray-200 bg-gray-50">
                    {[
                        { id: 'about', label: 'About', icon: Settings },
                        { id: 'members', label: `Members (${channelMembers.length})`, icon: Users },
                        { id: 'tabs', label: 'Features', icon: Globe }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-all duration-200 ${
                                activeTab === tab.id
                                    ? 'text-indigo-600 border-indigo-600 bg-white'
                                    : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300 hover:bg-gray-100'
                            }`}
                        >
                            {React.createElement(tab.icon, { className: "h-4 w-4" })}
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Enhanced Content */}
                <div className="flex-1 overflow-y-auto bg-gray-50">
                    <div className="p-6">
                        {activeTab === 'about' && (
                            <div className="space-y-6">
                                {/* Channel Overview Card */}
                                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Channel Information</h3>
                                    
                                    {/* Channel Name */}
                                    <div className="mb-6">
                                        <div className="flex items-center justify-between mb-3">
                                            <label className="text-sm font-medium text-gray-700">Channel name</label>
                                            <button 
                                                onClick={() => setEditingName(!editingName)}
                                                className="text-sm text-indigo-600 hover:text-indigo-700 transition-colors font-medium"
                                            >
                                                {editingName ? 'Cancel' : 'Edit'}
                                            </button>
                                        </div>
                                        {editingName ? (
                                            <div className="space-y-2">
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={tempChannelName}
                                                        onChange={(e) => {
                                                            setTempChannelName(e.target.value);
                                                            setNameError(''); // Clear error on change
                                                        }}
                                                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                                        placeholder="Enter channel name"
                                                    />
                                                    <button 
                                                        onClick={handleUpdateChannelName}
                                                        disabled={updating}
                                                        className="px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                                                    >
                                                        {updating ? 'Saving...' : 'Save'}
                                                    </button>
                                                </div>
                                                {nameError && (
                                                    <div className="text-sm text-red-600 mt-1">
                                                        {nameError}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                                                <Hash className="h-5 w-5 text-gray-400" />
                                                <span className="text-gray-900 font-medium">{channel.name}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Channel Type */}
                                    <div className="mb-6">
                                        <div className="flex items-center justify-between mb-3">
                                            <label className="text-sm font-medium text-gray-700">Channel Type</label>
                                            {!editingType ? (
                                                <button 
                                                    onClick={() => setEditingType(true)}
                                                    className="text-sm text-indigo-600 hover:text-indigo-700 transition-colors font-medium"
                                                >
                                                    Edit
                                                </button>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={handleCancelTypeEdit}
                                                        disabled={updating}
                                                        className="text-sm text-gray-600 hover:text-gray-700 transition-colors disabled:opacity-50"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={handleUpdateChannelType}
                                                        disabled={updating}
                                                        className="text-sm text-indigo-600 hover:text-indigo-700 transition-colors disabled:opacity-50 font-medium"
                                                    >
                                                        {updating ? 'Saving...' : 'Save'}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        {!editingType ? (
                                            <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                                                {React.createElement(getCurrentChannelType().icon, { className: "h-5 w-5 text-indigo-600" })}
                                                <div>
                                                    <span className="text-gray-900 font-medium">{getCurrentChannelType().name}</span>
                                                    <p className="text-sm text-gray-500">{getCurrentChannelType().description}</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="relative">
                                                <button
                                                    type="button"
                                                    onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                                                    disabled={updating}
                                                    className="w-full flex items-center justify-between px-4 py-3 text-left border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white disabled:opacity-50 hover:border-gray-400 transition-colors"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        {channelTypes.find(t => t.id === selectedType)?.icon && 
                                                            React.createElement(channelTypes.find(t => t.id === selectedType).icon, { className: "h-5 w-5 text-indigo-600" })
                                                        }
                                                        <span className="text-gray-900 font-medium">
                                                            {channelTypes.find(t => t.id === selectedType)?.name || 'Select type'}
                                                        </span>
                                                    </div>
                                                    <ChevronDown className="h-4 w-4 text-gray-400" />
                                                </button>
                                                
                                                {showTypeDropdown && (
                                                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                                        {channelTypes.map((type) => (
                                                            <button
                                                                key={type.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    setSelectedType(type.id);
                                                                    setShowTypeDropdown(false);
                                                                }}
                                                                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg transition-colors"
                                                            >
                                                                {React.createElement(type.icon, { className: "h-5 w-5 text-indigo-600" })}
                                                                <div>
                                                                    <span className="text-gray-900 font-medium">{type.name}</span>
                                                                    <p className="text-sm text-gray-500">{type.description}</p>
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Topic */}
                                    <div className="mb-6">
                                        <div className="flex items-center justify-between mb-3">
                                            <label className="text-sm font-medium text-gray-700">Topic</label>
                                            <button 
                                                onClick={() => setEditingTopic(!editingTopic)}
                                                className="text-sm text-indigo-600 hover:text-indigo-700 transition-colors font-medium"
                                            >
                                                {editingTopic ? 'Cancel' : 'Edit'}
                                            </button>
                                        </div>
                                        {editingTopic ? (
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={tempTopic}
                                                    onChange={(e) => setTempTopic(e.target.value)}
                                                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                                    placeholder="Add a topic for this channel"
                                                />
                                                <button 
                                                    onClick={handleUpdateChannelTopic}
                                                    disabled={updating}
                                                    className="px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                                                >
                                                    {updating ? 'Saving...' : 'Save'}
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                                                <p className="text-gray-500 text-sm">
                                                    {channel.topic || 'Add a topic to help others understand what this channel is for'}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <label className="text-sm font-medium text-gray-700">Description</label>
                                            <button 
                                                onClick={() => setEditingDescription(!editingDescription)}
                                                className="text-sm text-indigo-600 hover:text-indigo-700 transition-colors font-medium"
                                            >
                                                {editingDescription ? 'Cancel' : 'Edit'}
                                            </button>
                                        </div>
                                        {editingDescription ? (
                                            <div className="space-y-2">
                                                <textarea
                                                    value={tempDescription}
                                                    onChange={(e) => setTempDescription(e.target.value)}
                                                    rows={3}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                                                    placeholder="Add a description for this channel"
                                                />
                                                <div className="flex justify-end">
                                                    <button 
                                                        onClick={handleUpdateChannelDescription}
                                                        disabled={updating}
                                                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm disabled:opacity-50"
                                                    >
                                                        {updating ? 'Saving...' : 'Save'}
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                                                <p className="text-gray-500 text-sm">
                                                    {channel.description || 'Add a description to provide more context about this channel'}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Channel Metadata Card */}
                                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Channel Details</h3>
                                    
                                    {/* Created by */}
                                    <div className="mb-6">
                                        <label className="text-sm font-medium text-gray-700 mb-3 block">Created by</label>
                                        <div className="flex items-center bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                                            <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-semibold mr-4">
                                                {channel.createdBy?.charAt(0) || 'U'}
                                            </div>
                                            <div>
                                                <span className="text-gray-900 font-medium">Bien Ng</span>
                                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                                    <Calendar className="h-4 w-4" />
                                                    <span>Created on {formatCreatedDate(channel.createdAt)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Channel Privacy */}
                                    <div className="mb-6">
                                        <label className="text-sm font-medium text-gray-700 mb-3 block">Privacy</label>
                                        <div className="flex items-center bg-gray-50 rounded-lg p-4">
                                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-4">
                                                {channel.private ? <Lock className="h-5 w-5 text-green-600" /> : <Globe className="h-5 w-5 text-green-600" />}
                                            </div>
                                            <div>
                                                <span className="text-gray-900 font-medium">
                                                    {channel.private ? 'Private Channel' : 'Public Channel'}
                                                </span>
                                                <p className="text-sm text-gray-500">
                                                    {channel.private 
                                                        ? 'Only invited members can see and join this channel'
                                                        : 'Anyone in the workspace can see and join this channel'
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Channel ID */}
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 mb-3 block">Channel ID</label>
                                        <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-4">
                                            <code className="flex-1 text-sm text-gray-600 font-mono">{channel.id}</code>
                                            <button 
                                                onClick={handleCopyChannelId}
                                                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors"
                                                title="Copy channel ID"
                                            >
                                                {copiedChannelId ? (
                                                    <>
                                                        <Check className="h-4 w-4 text-green-600" />
                                                        <span className="text-green-600">Copied!</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy className="h-4 w-4" />
                                                        <span>Copy</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions Card */}
                                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
                                    
                                    {/* Leave Channel */}
                                    <button className="w-full flex items-center justify-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 text-sm font-medium py-3 rounded-lg transition-colors border border-red-200 hover:border-red-300 mb-4">
                                        <X className="h-4 w-4" />
                                        Leave channel
                                    </button>

                                    {/* Delete Channel - Only for creators/admins */}
                                    {canDeleteChannel() && (
                                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                            <div className="flex items-start gap-3 mb-3">
                                                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                                                <div>
                                                    <h4 className="text-sm font-semibold text-red-900">Danger Zone</h4>
                                                    <p className="text-sm text-red-700 mt-1">
                                                        Permanently delete this channel and all its messages. This action cannot be undone.
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setShowDeleteModal(true)}
                                                disabled={loading}
                                                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 text-sm font-medium shadow-sm"
                                            >
                                                {loading ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="h-4 w-4" />
                                                )}
                                                Delete Channel
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        {activeTab === 'members' && renderMembersTab()}
                        {activeTab === 'tabs' && renderTabsTab()}
                    </div>
                </div>
            </div>

            {/* Delete Channel Modal */}
            <DeleteChannelModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                channel={channel}
                onConfirm={handleDeleteChannel}
                loading={loading}
            />
        </div>
    );
};

export default ChannelAboutModal; 