import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { supabaseAuth } from '../utils/supabaseAuth';
import { supabaseDb } from '../utils/supabaseDb';
import { seedDatabase } from '../utils/seedSupabase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const signInWithEmail = (email, password) => {
        return supabaseAuth.signInWithEmail(email, password);
    };

    const signUpWithEmail = (email, password) => {
        return supabaseAuth.signUpWithEmail(email, password);
    };

    const signInWithGoogle = () => {
        return supabaseAuth.signInWithGoogle();
    };

    const logout = async () => {
        console.log('Logout function in AuthContext called');
        try {
            const { error } = await supabaseAuth.logout();
            if (error) {
                console.error('Error logging out:', error);
            } else {
                navigate('/login', { replace: true });
            }
        } catch (error) {
            console.error('Exception during logout:', error);
        }
    };

    const createUserProfile = async (user, additionalData = {}) => {
        if (!user) return null;
        
        try {
            // Check if user profile exists
            const { data: existingProfiles, error: checkError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();
            
            if (checkError && checkError.code !== 'PGRST116') {
                console.error("Error checking for existing profile:", checkError);
                throw checkError;
            }
            
            // If profile exists, return it
            if (existingProfiles) {
                console.log("Found existing profile for user:", user.id);
                return existingProfiles;
            }
            
            // Create new profile if it doesn't exist
            console.log("Creating new profile for user:", user.id);
            const { data, error } = await supabase
                .from('profiles')
                .insert({
                    id: user.id,
                    display_name: user.user_metadata?.full_name || user.email.split('@')[0],
                    email: user.email,
                    roles: [],
                    is_onboarding_complete: false,
                    created_at: new Date().toISOString(),
                    ...additionalData
                })
                .select();
            
            if (error) {
                console.error("Error creating user profile:", error);
                throw error;
            }
            
            return data[0];
        } catch (error) {
            console.error("Exception in createUserProfile:", error);
            return null;
        }
    };

    const fetchUserProfile = async (userId) => {
        if (!userId) return null;
        
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();
            
            if (error && error.code !== 'PGRST116') {
                console.error("Error fetching user profile:", error);
                throw error;
            }
            
            return data;
        } catch (error) {
            console.error("Exception in fetchUserProfile:", error);
            return null;
        }
    };

    // Update user profile
    const updateUserProfile = async (userId, updates) => {
        if (!userId) return null;
        
        try {
            console.log("Updating user profile with data:", updates);
            
            // First check if we can get the current profile to see what fields exist
            const { data: currentProfile, error: fetchError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();
            
            if (fetchError) {
                console.error("Error fetching current profile:", fetchError);
                // Continue anyway, we'll try the update
            }
            
            // If we have the current profile, filter updates to include only existing fields
            let safeUpdates = { ...updates };
            if (currentProfile) {
                const validFields = Object.keys(currentProfile);
                safeUpdates = Object.keys(updates)
                    .filter(key => validFields.includes(key))
                    .reduce((obj, key) => {
                        obj[key] = updates[key];
                        return obj;
                    }, {});
                
                // Always include updated_at
                safeUpdates.updated_at = new Date().toISOString();
                console.log("Filtered updates to include only valid fields:", safeUpdates);
            }
            
            // Perform the update
            const { data, error } = await supabase
                .from('profiles')
                .update(safeUpdates)
                .eq('id', userId)
                .select();
            
            if (error) {
                console.error("Error updating user profile:", error);
                throw error;
            }
            
            // Update local state
            setUserProfile(data[0]);
            return data[0];
        } catch (error) {
            console.error("Exception in updateUserProfile:", error);
            
            // Try one more time with minimal data if we had an error
            try {
                console.log("Retrying with minimal data...");
                const minimalUpdate = {
                    is_onboarding_complete: updates.is_onboarding_complete === true,
                    updated_at: new Date().toISOString()
                };
                
                const { data, error } = await supabase
                    .from('profiles')
                    .update(minimalUpdate)
                    .eq('id', userId)
                    .select();
                
                if (error) {
                    console.error("Error in minimal update:", error);
                    return null;
                }
                
                setUserProfile(data[0]);
                return data[0];
            } catch (retryError) {
                console.error("Exception in minimal update retry:", retryError);
                return null;
            }
        }
    };

    useEffect(() => {
        // Get the current session on initial load
        const initializeAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                
                if (session?.user) {
                    console.log("Found existing session for user:", session.user.id);
                    setCurrentUser(session.user);
                    
                    // Fetch or create user profile
                    const profile = await fetchUserProfile(session.user.id);
                    
                    if (profile) {
                        setUserProfile(profile);
                    } else {
                        const newProfile = await createUserProfile(session.user);
                        setUserProfile(newProfile);
                    }
                    
                    // Try to seed database, but don't block auth if it fails
                    try {
                        await seedDatabase();
                    } catch (error) {
                        console.error("Error seeding database but continuing:", error);
                    }
                } else {
                    console.log("No active session found");
                }
            } catch (error) {
                console.error("Error during auth initialization:", error);
            } finally {
                setLoading(false);
            }
        };
        
        initializeAuth();
        
        // Set up auth state change listener
        const unsubscribe = supabaseAuth.onAuthStateChange(async (user) => {
            console.log("Auth state changed. User:", user?.id);
            setCurrentUser(user);
            
            if (user) {
                try {
                    // Fetch or create user profile when auth state changes
                    const profile = await fetchUserProfile(user.id);
                    
                    if (profile) {
                        setUserProfile(profile);
                    } else {
                        const newProfile = await createUserProfile(user);
                        setUserProfile(newProfile);
                    }
                } catch (error) {
                    console.error("Error handling auth state change:", error);
                    // Set loading to false even if there's an error to prevent UI from getting stuck
                    setLoading(false);
                }
            } else {
                setUserProfile(null);
            }
        });
        
        return () => {
            unsubscribe();
        };
    }, []);

    const value = {
        currentUser,
        userProfile,
        loading,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        logout,
        createUserProfile,
        fetchUserProfile,
        updateUserProfile
    };

    return <AuthContext.Provider value={value}>
        {!loading && children}
    </AuthContext.Provider>; 
} 