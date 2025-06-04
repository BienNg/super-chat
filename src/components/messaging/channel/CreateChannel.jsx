// src/components/CreateChannel.jsx
import React, { useState } from 'react';
import { X, Hash, Lock } from 'lucide-react';
import { supabase } from '../../../supabaseClient';
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

    const checkChannelNameExists = async (channelName) => {
        try {
            const { data, error: checkError } = await supabase
                    .from('channels')
                    .select('id')
                .eq('name', channelName.trim())
                .maybeSingle();
                
            if (checkError && checkError.code !== 'PGRST116') {
                console.error('Error checking channel name in Supabase:', checkError);
                    throw new Error('Unable to verify channel name availability');
                }
            return !!data;
        } catch (err) {
            console.error('Error checking channel name:', err);
            throw err;
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

            const nameExists = await checkChannelNameExists(channelData.name);
            if (nameExists) {
                setError(`A channel named "${channelData.name}" already exists. Please try a different name.`);
                setLoading(false);
                return;
            }

            const userId = currentUser?.id;
            if (!userId) {
                throw new Error('User is not authenticated');
            }

                const timestamp = new Date().toISOString();
            const { data: newChannel, error: insertError } = await supabase
                    .from('channels')
                    .insert({
                        name: channelData.name.trim(),
                        type: channelData.type,
                        members: [userId], 
                        admins: [userId], 
                        created_by: userId,
                        created_at: timestamp,
                        updated_at: timestamp,
                        settings: {
                            allowMemberInvites: false,
                            isPrivate: channelData.isPrivate,
                            notifications: true
                    },
                    is_private: channelData.isPrivate
                    })
                    .select()
                    .single();
                
            if (insertError) {
                throw insertError;
            }
            
            const channelId = newChannel.id;

            if (channelData.type === 'class') {
                try {
                    await handleChannelTypeChange(channelId, 'class', 'general', channelData.name.trim());
                    console.log(`Auto-created class for new channel: ${channelData.name.trim()}`);
                } catch (classError) {
                    console.error('Error creating class for new channel:', classError);
                }
            }

            onClose();
            if (onChannelCreated) {
                onChannelCreated(channelId, newChannel);
            }
            
            setChannelData({
                name: '',
                type: 'general',
                isPrivate: false,
                showTypeDropdown: false
            });

        } catch (error) {
            console.error('Error creating channel:', error);
            if (error.message.includes('Unable to verify channel name availability')) {
                setError('Unable to check if this channel name is available. Please try again.');
            } else if (error.message.includes('duplicate key value violates unique constraint')) {
                setError(`A channel named "${channelData.name}" already exists. Please try a different name.`);
            } else {
                setError('Something went wrong while creating your channel. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-md p-6">
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
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Hash className="h-4 w-4 inline mr-1" />
                            Channel Name *
                        </label>
                        <input
                            type="text"
                            value={channelData.name}
                            onChange={(e) => {
                                const value = e.target.value
                                    .toLowerCase()
                                    .replace(/\s+/g, '-')
                                    .replace(/[^a-z0-9-]/g, '');
                                setChannelData((prev) => ({ ...prev, name: value }));
                                setError('');
                            }}
                            placeholder="e.g., project-alpha, marketing-team"
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            required
                            autoFocus
                        />
                        <p className="text-xs text-gray-500 mt-1">Use lowercase letters, numbers, and hyphens.</p>
                    </div>

                    <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Channel Type</label>
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setChannelData(prev => ({ ...prev, showTypeDropdown: !prev.showTypeDropdown }))}
                                className="w-full px-4 py-2 text-left border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white flex justify-between items-center"
                            >
                                <span className="text-sm text-gray-900">
                                    {CHANNEL_TYPE_OPTIONS.find(t => t.id === channelData.type)?.name || 'Select type'}
                                </span>
                                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${channelData.showTypeDropdown ? 'transform rotate-180' : ''}`} />
                            </button>
                            
                            {channelData.showTypeDropdown && (
                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
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
                                            className="w-full px-4 py-3 text-left hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg text-sm text-gray-700 flex items-center gap-2"
                                        >
                                            {type.icon && React.createElement(type.icon, { className: "h-4 w-4 text-indigo-500" })}
                                            {type.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                                <div>
                        <label htmlFor="isPrivateToggle" className="flex items-center cursor-pointer">
                            <div className="relative">
                                <input 
                                    type="checkbox" 
                                    id="isPrivateToggle" 
                                    className="sr-only" 
                                    checked={channelData.isPrivate}
                                    onChange={() => setChannelData(prev => ({ ...prev, isPrivate: !prev.isPrivate }))}
                                />
                                <div className={`block w-10 h-6 rounded-full transition ${channelData.isPrivate ? 'bg-indigo-600' : 'bg-gray-200'}`}></div>
                                <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${channelData.isPrivate ? 'transform translate-x-full' : ''}`}></div>
                            </div>
                            <div className="ml-3 text-sm text-gray-700">
                                {channelData.isPrivate ? (
                                    <><Lock className="h-4 w-4 inline mr-1 text-indigo-600" /> Private Channel</>
                                ) : (
                                    'Public Channel'
                                )}
                        </div>
                        </label>
                        <p className="text-xs text-gray-500 mt-1">
                            {channelData.isPrivate 
                                ? 'Only invited members can view and join.' 
                                : 'Anyone in your workspace can view and join.'}
                        </p>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 mr-2"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Creating...
                                </> 
                            ) : 'Create Channel'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateChannel;