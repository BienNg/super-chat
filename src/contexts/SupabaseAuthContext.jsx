import React, { createContext, useContext, useEffect, useState } from 'react';
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

    const signInWithEmail = (email, password) => {
        return supabaseAuth.signInWithEmail(email, password);
    };

    const signUpWithEmail = (email, password) => {
        return supabaseAuth.signUpWithEmail(email, password);
    };

    const signInWithGoogle = () => {
        return supabaseAuth.signInWithGoogle();
    };

    const logout = () => {
        return supabaseAuth.logout();
    };

    const createUserProfile = async (user, additionalData = {}) => {
        if (!user) return null;
        
        try {
            // Check if user profile exists
            const { data: existingProfiles, error: checkError } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', user.id)
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
                .from('user_profiles')
                .insert({
                    user_id: user.id,
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
                .from('user_profiles')
                .select('*')
                .eq('user_id', userId)
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
            const { data, error } = await supabase
                .from('user_profiles')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', userId)
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
            return null;
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
                    
                    // Seed database with initial data if needed
                    await seedDatabase();
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