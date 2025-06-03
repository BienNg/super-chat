// src/components/CreateChannel.jsx
import React, { useState } from 'react';
import { X, Hash, Lock } from 'lucide-react';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useAuth } from '../../../contexts/AuthContext';
import { useChannelClassSync } from '../../../hooks/useChannelClassSync';
import { CHANNEL_TYPE_OPTIONS } from '../../../utils/channelTypes';

const CreateChannel = ({ isOpen, onClose, onChannelCreated }) => {
    const [channelData, setChannelData] = useState({
        name: '',
        type: 'general',
        isPrivate: false,
        showTypeDropdown: false
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { currentUser } = useAuth();
    const { handleChannelTypeChange } = useChannelClassSync();

    // Function to check if channel name already exists
    const checkChannelNameExists = async (channelName) => {
        try {
            const channelsRef = collection(db, 'channels');
            const q = query(channelsRef, where('name', '==', channelName.trim()));
            const snapshot = await getDocs(q);
            return !snapshot.empty;
        } catch (error) {
            console.error('Error checking channel name:', error);
            throw new Error('Unable to verify channel name availability');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!channelData.name.trim()) {
            setError('Please enter a channel name to continue.');
            return;
        }

        try {
            setError('');
            setLoading(true);

            // Check if channel name already exists
            const nameExists = await checkChannelNameExists(channelData.name);
            if (nameExists) {
                setError(`A channel named "${channelData.name}" already exists in this workspace. Please try a different name like "${channelData.name}-2" or "${channelData.name}-new".`);
                return;
            }

            const timestamp = serverTimestamp();
            const channelRef = await addDoc(collection(db, 'channels'), {
                name: channelData.name.trim(),
                type: channelData.type,
                members: [currentUser.uid], // Creator is automatically a member
                admins: [currentUser.uid], // Creator is automatically an admin
                createdBy: currentUser.uid,
                createdAt: timestamp,
                updatedAt: timestamp,
                settings: {
                    allowMemberInvites: false,
                    isPrivate: channelData.isPrivate,
                    notifications: true
                }
            });

            // If channel type is 'class', automatically create a class object
            if (channelData.type === 'class') {
                try {
                    await handleChannelTypeChange(channelRef.id, 'class', 'general', channelData.name.trim());
                    console.log(`Auto-created class for new channel: ${channelData.name.trim()}`);
                } catch (classError) {
                    console.error('Error creating class for new channel:', classError);
                    // Don't fail the channel creation if class creation fails
                }
            }

            // Close the modal immediately
            onClose();

            // Call the onChannelCreated callback with the new channel ID
            if (onChannelCreated) {
                onChannelCreated(channelRef.id);
            }
            
            // Reset form
            setChannelData({
                name: '',
                type: 'general',
                isPrivate: false,
                showTypeDropdown: false
            });
        } catch (error) {
            console.error('Error creating channel:', error);
            if (error.message.includes('Unable to verify channel name availability')) {
                setError('Unable to check if this channel name is available. Please check your internet connection and try again.');
            } else {
                setError('Something went wrong while creating your channel. Please try again in a moment.');
            }
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-md p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Create New Channel</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Channel Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Hash className="h-4 w-4 inline mr-1" />
                            Channel Name *
                        </label>
                        <input
                            type="text"
                            value={channelData.name}
                            onChange={(e) => {
                                // Convert to lowercase, replace whitespace with dashes, and allow only letters, numbers, and hyphens
                                const value = e.target.value
                                    .toLowerCase()
                                    .replace(/\s+/g, '-')
                                    .replace(/[^a-z0-9-]/g, '');
                                setChannelData((prev) => ({ ...prev, name: value }));
                            }}
                            placeholder="e.g., Project Alpha, Marketing Team"
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            required
                            autoFocus
                        />
                        <p className="text-xs text-gray-500 mt-1">Spaces and uppercase letters will be automatically converted to lowercase with dashes</p>
                    </div>

                    {/* Channel Type */}
                    <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Channel Type</label>
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setChannelData(prev => ({ ...prev, showTypeDropdown: !prev.showTypeDropdown }))}
                                className="w-full px-4 py-2 text-left border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                            >
                                <span className="text-sm text-gray-900">
                                    {CHANNEL_TYPE_OPTIONS.find(t => t.id === channelData.type)?.name || 'Select type'}
                                </span>
                            </button>
                            
                            {channelData.showTypeDropdown && (
                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                                    {CHANNEL_TYPE_OPTIONS.map((type) => (
                                        <button
                                            key={type.id}
                                            type="button"
                                            onClick={() => {
                                                setChannelData(prev => ({ 
                                                    ...prev, 
                                                    type: type.id,
                                                    showTypeDropdown: false 
                                                }));
                                            }}
                                            className="w-full px-4 py-2 text-left hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                                        >
                                            <span className="text-sm text-gray-900">{type.name}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Privacy Setting */}
                    <div className="flex items-start p-4 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                            <div className="flex items-center">
                                <Lock className="h-5 w-5 text-gray-500 mr-3" />
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Private Channel</p>
                                    <p className="text-xs text-gray-500">Only invited members can access</p>
                                </div>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={channelData.isPrivate}
                                onChange={(e) => setChannelData((prev) => ({ ...prev, isPrivate: e.target.checked }))}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !channelData.name.trim()}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Creating...' : 'Create Channel'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateChannel;