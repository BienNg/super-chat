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
import { supabase } from '../../../supabaseClient';
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
            
            const { error: updateError } = await supabase
                .from('channels')
                .update({ 
                    type: selectedType,
                    updated_at: new Date().toISOString() 
                })
                .eq('id', channel.id);

            if (updateError) throw updateError;
            
            await handleChannelTypeChange(channel.id, selectedType, oldType, channel.name);
            
            setEditingType(false);
            onUpdate?.();
        } catch (error) {
            console.error('Failed to update channel type:', error);
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
            await loadUsers();
            onUpdate?.();
        } catch (error) {
            console.error('Failed to add member:', error);
        }
    };

    const handleRemoveMember = async (userId) => {
        try {
            await removeMemberFromChannel(channel.id, userId, channel.name);
            await loadUsers();
            onUpdate?.();
        } catch (error) {
            console.error('Failed to remove member:', error);
        }
    };

    const handleBulkAddMembers = async () => {
        if (selectedUsersToAdd.length === 0) return;
        
        try {
            for (const userId of selectedUsersToAdd) {
                await addMemberToChannel(channel.id, userId, channel.name);
            }
            
            setSelectedUsersToAdd([]);
            setShowAddMemberModal(false);
            await loadUsers();
            onUpdate?.();
        } catch (error) {
            console.error('Failed to add members:', error);
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
        const colors = ['bg-green-500', 'bg-yellow-500', 'bg-gray-400'];
        return colors[userId.length % 3];
    };

    const getLastSeen = (userId) => {
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
        return true;
    };

    const handleDeleteChannel = async () => {
        try {
            await deleteChannel(channel.id, channel.name);
            setShowDeleteModal(false);
            onClose();
            onChannelDeleted?.(channel.id);
        } catch (error) {
            console.error('Failed to delete channel:', error);
        }
    };

    const canDeleteThisChannel = () => {
        return canDeleteChannelUtil(channel, userProfile);
    };

    const getCurrentChannelType = () => {
        return channelTypes.find(t => t.id === selectedType) || channelTypes[0];
    };

    const formatCreatedDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const renderClassMeta = () => {
        if (selectedType !== 'class' || !classInfo) return null;
        return (
            <div className="mt-4 p-3 bg-gray-50 rounded-md">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Class Details</h4>
                <p className="text-xs text-gray-600">Level: {classInfo.level || 'N/A'}</p>
                <p className="text-xs text-gray-600">Teachers: {classInfo.teachers?.join(', ') || 'N/A'}</p>
            </div>
        );
    };

    const checkChannelNameExists = async (channelName) => {
        if (!channelName) return false;
        try {
            const { data, error } = await supabase
                .from('channels')
                .select('id')
                .eq('name', channelName.trim())
                .neq('id', channel.id)
                .maybeSingle();

            if (error && error.code !== 'PGRST116') {
                console.error('Error checking channel name:', error);
                return false;
            }
            return !!data;
        } catch (error) {
            console.error('Error checking channel name existence:', error);
            return false;
        }
    };

    const handleUpdateChannelName = async () => {
        const newName = tempChannelName.trim();
        if (!newName) {
            setNameError('Channel name cannot be empty.');
            return;
        }
        if (newName === channel.name) {
            setEditingName(false);
            setNameError('');
            return;
        }
        const exists = await checkChannelNameExists(newName);
        if (exists) {
            setNameError('A channel with this name already exists.');
            return;
        }
        try {
            setUpdating(true);
            const { error } = await supabase
                .from('channels')
                .update({ name: newName, updated_at: new Date().toISOString() })
                .eq('id', channel.id);
            if (error) throw error;
            setEditingName(false);
            setNameError('');
            onUpdate?.();
        } catch (error) {
            console.error('Failed to update channel name:', error);
            setNameError('Failed to update channel name.');
        } finally {
            setUpdating(false);
        }
    };

    const handleUpdateChannelTopic = async () => {
        const newTopic = tempTopic.trim();
        if (newTopic === (channel.topic || '')) {
            setEditingTopic(false);
            return;
        }
        try {
            setUpdating(true);
            const { error } = await supabase
                .from('channels')
                .update({ topic: newTopic, updated_at: new Date().toISOString() })
                .eq('id', channel.id);
            if (error) throw error;
            setEditingTopic(false);
            onUpdate?.();
        } catch (error) {
            console.error('Failed to update channel topic:', error);
        } finally {
            setUpdating(false);
        }
    };

    const handleUpdateChannelDescription = async () => {
        const newDescription = tempDescription.trim();
        if (newDescription === (channel.description || '')) {
            setEditingDescription(false);
            return;
        }
        try {
            setUpdating(true);
            const { error } = await supabase
                .from('channels')
                .update({ description: newDescription, updated_at: new Date().toISOString() })
                .eq('id', channel.id);
            if (error) throw error;
            setEditingDescription(false);
            onUpdate?.();
        } catch (error) {
            console.error('Failed to update channel description:', error);
        } finally {
            setUpdating(false);
        }
    };

    const renderMembersTab = () => (
        <div className="space-y-6">
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
        <div className={`fixed inset-0 z-50 overflow-y-auto ${isOpen ? 'block' : 'hidden'}`}>
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                    <div className="absolute inset-0 bg-gray-800 opacity-75"></div>
                </div>
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 flex items-center justify-between border-b border-gray-200">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                            About #{channel?.name || 'Channel'}
                        </h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
                            <button 
                                onClick={() => setActiveTab('about')} 
                                className={`${activeTab === 'about' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                            >
                                About
                            </button>
                            <button 
                                onClick={() => setActiveTab('members')} 
                                className={`${activeTab === 'members' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                            >
                                Members ({channelMembers.length})
                            </button>
                        </nav>
                    </div>
                    
                    <div className="px-4 py-5 sm:p-6">
                        {activeTab === 'about' && (
                            <div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700">Channel Name</label>
                                    {editingName ? (
                                        <div className="mt-1 flex rounded-md shadow-sm">
                                            <input 
                                                type="text" 
                                                value={tempChannelName} 
                                                onChange={(e) => { setTempChannelName(e.target.value); setNameError(''); }}
                                                className={`flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-l-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300 ${nameError ? 'border-red-500' : ''}`}
                                            />
                                            <button onClick={handleUpdateChannelName} disabled={updating} className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-500 hover:bg-gray-100 text-sm disabled:opacity-50">
                                                {updating ? <Loader2 className="animate-spin h-4 w-4"/> : <Check size={16}/>}
                                            </button>
                                            <button onClick={() => { setEditingName(false); setTempChannelName(channel?.name || ''); setNameError('');}} className="ml-2 inline-flex items-center px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 text-sm">
                                                <X size={16}/>
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="mt-1 flex items-center">
                                            <p className="text-gray-900 text-lg">{channel?.name || 'Not set'}</p>
                                            <button onClick={() => setEditingName(true)} className="ml-2 text-indigo-600 hover:text-indigo-800">
                                                <Edit3 size={16}/>
                                            </button>
                                        </div>
                                    )}
                                    {nameError && <p className="mt-1 text-xs text-red-500">{nameError}</p>}
                                </div>
                                <p className="text-sm text-gray-500 mt-2">Channel ID: <span className="font-mono bg-gray-100 px-1 rounded">{channel.id}</span> <button onClick={handleCopyChannelId} className="ml-1 text-indigo-600 hover:text-indigo-500 text-xs">{copiedChannelId ? 'Copied!' : 'Copy'}</button></p>
                            </div>
                        )}
                        {activeTab === 'members' && renderMembersTab()}
                    </div>

                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                        >
                            Close
                        </button>
                        {canDeleteThisChannel() && (
                             <button 
                                type="button" 
                                onClick={() => setShowDeleteModal(true)} 
                                className="mt-3 w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                            >
                                Delete Channel
                            </button>
                        )}
                    </div>
                </div>
            </div>
            {showDeleteModal && (
                <DeleteChannelModal 
                    isOpen={showDeleteModal} 
                    onClose={() => setShowDeleteModal(false)} 
                    channelName={channel.name} 
                    onConfirmDelete={handleDeleteChannel}
                />
            )}
        </div>
    );
};

export default ChannelAboutModal; 