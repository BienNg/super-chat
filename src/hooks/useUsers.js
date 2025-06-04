import { useState, useEffect, useCallback } from 'react';
import { 
    collection, 
    query, 
    orderBy, 
    onSnapshot,
    where,
    getDocs,
    limit
} from 'firebase/firestore';
import { db } from '../firebase';
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
        if (!currentUser?.uid) {
            setUsers([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            
            // Query all users except current user
            const usersQuery = query(
                collection(db, 'users'),
                orderBy('displayName', 'asc'),
                limit(100) // Limit to prevent excessive reads
            );
            
            const snapshot = await getDocs(usersQuery);
            const usersData = snapshot.docs
                .map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }))
                .filter(user => user.id !== currentUser.uid); // Exclude current user
            
            setUsers(usersData);
        } catch (err) {
            console.error('Error fetching users:', err);
            setError('Failed to fetch users');
        } finally {
            setLoading(false);
        }
    }, [currentUser?.uid]);

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
            user.displayName?.toLowerCase().includes(term) ||
            user.fullName?.toLowerCase().includes(term) ||
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