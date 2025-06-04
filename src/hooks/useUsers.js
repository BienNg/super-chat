import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';

/**
 * useUsers - Custom hook for managing user data
 * Handles fetching users for direct messaging and user management
 */
export const useUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const { currentUser } = useAuth();

    // Fetch all users except current user
    const fetchUsers = useCallback(async () => {
        if (!currentUser?.id) {
            setUsers([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            
            // Query all users from profiles table
            const { data, error: fetchError } = await supabase
                .from('profiles')
                .select('*')
                .order('display_name', { ascending: true })
                .limit(100);
            
            if (fetchError) throw fetchError;
            
            // Filter out current user
            const filteredUsers = data.filter(user => user.id !== currentUser.id);
            setUsers(filteredUsers);
        } catch (err) {
            console.error('Error fetching users:', err);
            setError('Failed to fetch users: ' + err.message);
        } finally {
            setLoading(false);
        }
    }, [currentUser?.id]);

    // Load users on mount and when current user changes
    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // Get user by ID
    const getUserById = useCallback((userId) => {
        return users.find(user => user.id === userId);
    }, [users]);

    // Search users by name or email
    const searchUsers = useCallback((searchTerm) => {
        if (!searchTerm.trim()) return users;
        
        const term = searchTerm.toLowerCase();
        return users.filter(user => 
            user.display_name?.toLowerCase().includes(term) ||
            user.full_name?.toLowerCase().includes(term) ||
            user.email?.toLowerCase().includes(term)
        );
    }, [users]);

    return {
        users,
        loading,
        error,
        fetchUsers,
        getUserById,
        searchUsers
    };
}; 