import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient'; // Import Supabase client
import { useAuth } from '../contexts/AuthContext';

// Helper to convert potential Supabase timestamp strings to Date objects
const toDateSafe = (timestamp) => {
  if (!timestamp) return new Date();
  if (timestamp instanceof Date) return timestamp;
  const parsedDate = new Date(timestamp);
  return isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
};

export const useClasses = (channelIdForFilter = null) => { // Renamed to avoid conflict
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const { currentUser } = useAuth(); // Assuming Supabase user with user.id

    const fetchClasses = useCallback(async () => {
        if (!currentUser?.id) {
            setClasses([]);
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            setError(null);
            let query = supabase.from('classes').select('*');
            if (channelIdForFilter) {
                query = query.eq('channel_id', channelIdForFilter);
            } else {
                query = query.order('created_at', { ascending: false });
            }
            
            const { data, error: fetchError } = await query;
            if (fetchError) throw fetchError;

            const classesData = (data || []).map(cls => ({
                ...cls,
                created_at: toDateSafe(cls.created_at),
                updated_at: toDateSafe(cls.updated_at),
                begin_date: cls.begin_date ? toDateSafe(cls.begin_date) : null,
                end_date: cls.end_date ? toDateSafe(cls.end_date) : null,
            }));
            setClasses(classesData);
        } catch (err) {
            console.error('Error fetching classes:', err);
            setError('Failed to fetch classes: ' + err.message);
        } finally {
            setLoading(false);
        }
    }, [currentUser?.id, channelIdForFilter]);

    useEffect(() => {
        fetchClasses();
        if (!currentUser?.id) return;

        const classSubscription = supabase
            .channel('public:classes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'classes' },
                () => fetchClasses()
            )
            .subscribe();
        return () => {
            supabase.removeChannel(classSubscription);
        };
    }, [fetchClasses, currentUser?.id]);

    const createClass = async (classData, channel_id) => {
        if (!currentUser?.id || !channel_id) {
            setError('User not authenticated or channel ID missing');
            throw new Error('User not authenticated or channel ID missing');
        }
        try {
            setError(null);
            const { data: existingClass, error: checkError } = await supabase
                .from('classes')
                .select('id')
                .eq('channel_id', channel_id)
                .maybeSingle();

            if (checkError && checkError.code !== 'PGRST116') throw checkError; // PGRST116: 0 rows, which is fine here
            if (existingClass) {
                throw new Error('This channel already has a class linked to it');
            }
            
            const now = new Date().toISOString();
            const newClassPayload = {
                channel_id,
                class_name: classData.className,
                class_type: classData.type, // Assuming classData.type maps to class_type
                created_at: now,
                updated_at: now,
                created_by: currentUser.id,
                // Optional fields, ensure snake_case
                format: classData.format, 
                google_drive_url: classData.sheetUrl, 
                teachers: classData.teachers,
                level: classData.level,
                begin_date: classData.beginDate,
                end_date: classData.endDate,
                days: classData.days,
                status: classData.status || 'active' // Default to active
            };

            // Remove undefined fields to avoid inserting them as null if not intended
            Object.keys(newClassPayload).forEach(key => newClassPayload[key] === undefined && delete newClassPayload[key]);

            const { data: createdClass, error: insertError } = await supabase
                .from('classes')
                .insert(newClassPayload)
                .select()
                .single();
            
            if (insertError) throw insertError;
            return createdClass;
        } catch (err) {
            console.error('Error creating class:', err);
            setError('Failed to create class: ' + err.message);
            throw err;
        }
    };

    const updateClass = async (classId, updates) => {
        if (!currentUser?.id) {
            setError('User not authenticated');
            throw new Error('User not authenticated');
        }
        try {
            setError(null);
            const updatesForSupabase = { ...updates };
            // Manual camelCase to snake_case conversion for known fields
            if (updates.className) { updatesForSupabase.class_name = updates.className; delete updatesForSupabase.className; }
            if (updates.classType) { updatesForSupabase.class_type = updates.classType; delete updatesForSupabase.classType; }
            if (updates.sheetUrl) { updatesForSupabase.google_drive_url = updates.sheetUrl; delete updatesForSupabase.sheetUrl; }
            if (updates.beginDate) { updatesForSupabase.begin_date = updates.beginDate; delete updatesForSupabase.beginDate; }
            if (updates.endDate) { updatesForSupabase.end_date = updates.endDate; delete updatesForSupabase.endDate; }
            
            const { data: updatedClass, error: updateError } = await supabase
                .from('classes')
                .update({ ...updatesForSupabase, updated_at: new Date().toISOString() })
                .eq('id', classId)
                .select()
                .single();
            
            if (updateError) throw updateError;
            return updatedClass;
        } catch (err) {
            console.error('Error updating class:', err);
            setError('Failed to update class: ' + err.message);
            throw err;
        }
    };

    const archiveClass = async (targetChannelId) => {
        if (!currentUser?.id) {
            setError('User not authenticated');
            throw new Error('User not authenticated');
        }
        try {
            setError(null);
            const { data: classToArchive, error: fetchError } = await supabase
                .from('classes')
                .select('id')
                .eq('channel_id', targetChannelId)
                .maybeSingle();

            if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

            if (classToArchive) {
                const { error: updateError } = await supabase
                    .from('classes')
                    .update({ status: 'archived', updated_at: new Date().toISOString() })
                    .eq('id', classToArchive.id);
                if (updateError) throw updateError;
            }
            // If no class found, do nothing or log a warning
        } catch (err) {
            console.error('Error archiving class:', err);
            setError('Failed to archive class: ' + err.message);
            throw err;
        }
    };

    const getClassByChannelId = useCallback(async (targetChannelId) => {
        if (!targetChannelId || !currentUser?.id) return null;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('classes')
                .select('*')
                .eq('channel_id', targetChannelId)
                .maybeSingle(); // Expect 0 or 1 row
            if (error && error.code !== 'PGRST116') throw error;
            return data ? { ...data, created_at: toDateSafe(data.created_at), updated_at: toDateSafe(data.updated_at) } : null;
        } catch (err) {
            console.error('Error fetching class by channelId:', err);
            setError('Failed to fetch class details: ' + err.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, [currentUser?.id]);

    const queryClasses = useCallback(async (filters = {}) => {
        if (!currentUser?.id) return [];
        setLoading(true);
        try {
            let query = supabase.from('classes').select('*');
            if (filters.teacher) {
                // Assuming teachers is an array of teacher names/IDs
                query = query.contains('teachers', [filters.teacher]); 
            }
            if (filters.level) {
                query = query.eq('level', filters.level);
            }
            if (filters.classType) {
                query = query.eq('class_type', filters.classType);
            }
            if (filters.status) {
                query = query.eq('status', filters.status);
            }
            query = query.order('created_at', { ascending: false });

            const { data, error } = await query;
            if (error) throw error;
            return (data || []).map(cls => ({ 
                ...cls, 
                created_at: toDateSafe(cls.created_at), 
                updated_at: toDateSafe(cls.updated_at) 
            }));
        } catch (err) {
            console.error('Error querying classes:', err);
            setError('Failed to query classes: ' + err.message);
            return [];
        } finally {
            setLoading(false);
        }
    }, [currentUser?.id]);

    return {
        classes,
        loading,
        error,
        createClass,
        updateClass,
        archiveClass,
        fetchClasses, // Expose for manual refresh
        getClassByChannelId,
        queryClasses
    };
}; 