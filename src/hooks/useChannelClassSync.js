import { useEffect } from 'react';
import { useClasses } from './useClasses';

/**
 * Hook to automatically sync channel type changes with class creation/archiving
 * This hook should be used in components that handle channel type updates
 */
export const useChannelClassSync = () => {
    const { createClass, archiveClass, getClassByChannelId } = useClasses();

    /**
     * Handle channel type change - create or archive class as needed
     * @param {string} channelId - The channel ID
     * @param {string} newType - The new channel type
     * @param {string} oldType - The previous channel type
     * @param {string} channelName - The channel name (for class creation)
     */
    const handleChannelTypeChange = async (channelId, newType, oldType, channelName) => {
        try {
            // If changing TO 'class' type
            if (newType === 'class' && oldType !== 'class') {
                // Check if class already exists for this channel
                const existingClass = await getClassByChannelId(channelId);
                
                if (!existingClass) {
                    // Create a new class with minimal default values
                    const defaultClassData = {
                        className: channelName ? channelName.toUpperCase() : 'NEW CLASS',
                        type: '', // Will need to be filled in later
                        sheetUrl: ''
                    };
                    
                    await createClass(defaultClassData, channelId);
                    console.log(`Created class for channel: ${channelName}`);
                }
            }
            
            // If changing AWAY FROM 'class' type
            if (oldType === 'class' && newType !== 'class') {
                await archiveClass(channelId);
                console.log(`Archived class for channel: ${channelName}`);
            }
        } catch (error) {
            console.error('Error syncing channel type with class:', error);
            throw error;
        }
    };

    /**
     * Check if a channel should have a class and create one if missing
     * Useful for existing channels that were set to 'class' type before this system
     * @param {string} channelId - The channel ID
     * @param {string} channelType - The channel type
     * @param {string} channelName - The channel name
     */
    const ensureClassExists = async (channelId, channelType, channelName) => {
        if (channelType === 'class') {
            const existingClass = await getClassByChannelId(channelId);
            
            if (!existingClass) {
                const defaultClassData = {
                    className: channelName ? channelName.toUpperCase() : 'NEW CLASS',
                    type: '',
                    sheetUrl: ''
                };
                
                await createClass(defaultClassData, channelId);
                console.log(`Ensured class exists for channel: ${channelName}`);
            }
        }
    };

    return {
        handleChannelTypeChange,
        ensureClassExists
    };
}; 