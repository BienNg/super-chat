// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { seedAccounts } from '../utils/seedAccounts';
import { seedDiscounts } from '../utils/seedDiscounts';
import { logFirebaseRead, logFirebaseWrite } from '../utils/comprehensiveFirebaseTracker';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const googleProvider = new GoogleAuthProvider();

    const signInWithEmail = (email, password) => {
        return signInWithEmailAndPassword(auth, email, password);
    };

    const signUpWithEmail = (email, password) => {
        return createUserWithEmailAndPassword(auth, email, password);
    };

    const signInWithGoogle = () => {
        return signInWithPopup(auth, googleProvider);
    };

    const logout = () => {
        return signOut(auth);
    };

    const createUserProfile = async (user, additionalData = {}) => {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        // Log the Firebase read operation
        logFirebaseRead('users', userSnap.exists() ? 1 : 0, `Check if user profile exists for ${user.uid}`);

        if (!userSnap.exists()) {
            const { displayName, email } = user;
            const createdAt = new Date();

            await setDoc(userRef, {
                displayName: displayName || email.split('@')[0],
                email,
                roles: [],
                isOnboardingComplete: false,
                createdAt,
                ...additionalData
            });

            // Log the Firebase write operation
            logFirebaseWrite('users', `Created user profile for ${user.uid}`);
        }

        return userRef;
    };

    const fetchUserProfile = async (userId) => {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        
        // Log the Firebase read operation
        logFirebaseRead('users', userSnap.exists() ? 1 : 0, `Fetch user profile for ${userId}`);
        
        return userSnap.exists() ? userSnap.data() : null;
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setCurrentUser(user);
                await createUserProfile(user);
                const profile = await fetchUserProfile(user.uid);
                setUserProfile(profile);
                
                // Seed accounts collection if needed
                try {
                    await seedAccounts();
                    await seedDiscounts();
                } catch (error) {
                    console.error('Error seeding collections:', error);
                }
            } else {
                setCurrentUser(null);
                setUserProfile(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        userProfile,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        logout,
        createUserProfile,
        fetchUserProfile
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};