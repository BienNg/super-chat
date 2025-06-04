// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient'; // Import Supabase client

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null); // This will be Supabase user object
    const [userProfile, setUserProfile] = useState(null); // From your 'profiles' table
    const [loading, setLoading] = useState(true);

    // Sign in with email and password
    const signInWithEmail = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) throw error;
        return data;
    };

    // Sign up with email and password
    const signUpWithEmail = async (email, password, additionalData = {}) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { // This data is for the auth.users table, not profiles table initially
                    display_name: additionalData.displayName || email.split('@')[0],
                    ...additionalData.authData, // e.g., for custom claims if set up
                }
            }
        });
        if (error) throw error;
        // User profile creation will be handled by onAuthStateChange or a trigger
        return data;
    };

    // Sign in with Google (or other OAuth providers)
    const signInWithGoogle = async () => {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            // options: { redirectTo: window.location.origin } // Optional redirect URL
        });
        if (error) throw error;
        return data;
    };

    // Logout
    const logout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        setCurrentUser(null);
        setUserProfile(null);
    };

    // Fetch user profile from 'profiles' table
    const fetchUserProfile = async (userId) => {
        if (!userId) return null;
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();
                
            if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found, which is acceptable
                throw error;
            }
            
            return data;
        } catch (error) {
            console.error("Error fetching user profile:", error);
            return null;
        }
    };
    
    // Create user profile in 'profiles' table (usually called after sign up, often via a trigger)
    // This is a simplified version. Production apps often use DB triggers for this.
    const createUserProfile = async (user, additionalData = {}) => {
        if (!user || !user.id) {
            console.error("User object or user ID is missing for profile creation.");
            return null;
        }
        try {
            const existingProfile = await fetchUserProfile(user.id);
            if (existingProfile) {
                // console.log("Profile already exists for:", user.id);
                return existingProfile;
            }

            const profileData = {
                id: user.id, // Link to auth.users table
                email: user.email,
                display_name: additionalData.displayName || user.user_metadata?.display_name || user.email?.split('@')[0],
                // roles: [], // Default roles or handle elsewhere
                is_onboarding_complete: false,
                created_at: new Date().toISOString(),
                ...additionalData.profileData // Any other fields for 'profiles' table
            };

            const { data, error } = await supabase
                .from('profiles')
                .insert(profileData)
                .select()
                .single();

            if (error) throw error;
            // console.log("User profile created:", data);
            return data;

        } catch (error) {
            console.error("Error creating user profile:", error);
            // Don't re-throw here usually, as auth flow should continue
            return null;
        }
    };


    // Update user profile in 'profiles' table
    const updateUserProfile = async (userId, data) => {
        if (!userId) {
            console.error("User ID is undefined. Cannot update profile.");
            return;
        }
        try {
            const { data: updatedProfile, error } = await supabase
                .from('profiles')
                .update({
                ...data,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', userId)
                .select()
                .single();
            
            if (error) throw error;
            
            setUserProfile(updatedProfile); // Refresh local state
            // console.log("User profile updated and local state refreshed:", updatedProfile);
            return updatedProfile;
        } catch (error) {
            console.error("Error updating user profile:", error);
            throw error; 
        }
    };

    // Listen to auth state changes
    useEffect(() => {
        setLoading(true);
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            const user = session?.user || null;
            setCurrentUser(user);

            if (user) {
                let profile = await fetchUserProfile(user.id);
                if (!profile && event === 'SIGNED_IN') { // Create profile if it doesn't exist on new sign-in/sign-up
                    // console.log(\'Attempting to create profile for new user:\', user.id);
                    // Pass initial data if available from OAuth or sign-up options
                    profile = await createUserProfile(user, {
                         displayName: user.user_metadata?.full_name || user.user_metadata?.name, // Example from Google
                         // profileData: { avatar_url: user.user_metadata?.avatar_url } // if you want to sync avatar
                    });
                }
                setUserProfile(profile);
            } else {
                setUserProfile(null);
            }
            setLoading(false);
        });

        // Check initial session
        // supabase.auth.getSession().then(({ data: { session } }) => {
        //     const user = session?.user || null;
        //     setCurrentUser(user);
        //     if (user) {
        //         fetchUserProfile(user.id).then(profile => {
        //             setUserProfile(profile);
        //             setLoading(false);
        //         });
        //     } else {
        //         setLoading(false);
        //     }
        // });

        return () => {
            if (authListener && authListener.subscription) {
                authListener.subscription.unsubscribe();
            }
        };
    }, []);

    const value = {
        currentUser,
        userProfile,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        logout,
        fetchUserProfile, // Expose fetchUserProfile
        updateUserProfile, // Expose updateUserProfile
        // createUserProfile is more of an internal helper or for specific scenarios
        loading, // Expose loading state
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};