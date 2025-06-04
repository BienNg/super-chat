// src/components/Login.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { MessageSquare, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    
    const { signInWithEmail, signUpWithEmail, signInWithGoogle, currentUser } = useAuth();
    const navigate = useNavigate();
    
    // Redirect if user becomes authenticated
    useEffect(() => {
        if (currentUser) {
            console.log("User authenticated, redirecting to home");
            navigate('/');
        }
    }, [currentUser, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        setError('');
        setSuccessMessage('');
        setLoading(true);
        
        try {
            if (isSignUp) {
                const { data, error: signUpError } = await signUpWithEmail(email, password);
                
                if (signUpError) {
                    throw signUpError;
                }
                
                console.log("Sign up response:", data);
                
                // Handle email confirmation flow
                if (data.user && !data.session) {
                    setSuccessMessage("Please check your email for a confirmation link to complete your signup.");
                }
            } else {
                const { data, error: signInError } = await signInWithEmail(email, password);
                
                if (signInError) {
                    throw signInError;
                }
                
                console.log("Sign in successful:", data);
                // The redirect will happen automatically in the useEffect
            }
        } catch (error) {
            console.error("Auth error:", error);
            
            // Provide user-friendly error messages
            if (error.message.includes("Email not confirmed")) {
                setError("Please check your email to confirm your account before signing in.");
            } else if (error.message.includes("Invalid login credentials")) {
                setError("Invalid email or password. Please try again.");
            } else {
                setError(error.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setError('');
        setSuccessMessage('');
        setLoading(true);
        
        try {
            const { error: googleError } = await signInWithGoogle();
            
            if (googleError) {
                throw googleError;
            }
            
            // For Google signin, the redirect happens automatically
        } catch (error) {
            console.error("Google auth error:", error);
            setError("Google sign-in failed: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
            <div className="w-96 bg-white p-10 rounded-2xl shadow-sm">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mb-4">
                        <MessageSquare className="text-white h-6 w-6" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Welcome to Chatter</h2>
                    <p className="text-gray-500 mt-2 text-center">Your team's central communication hub</p>
                </div>
                
                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        {error}
                    </div>
                )}
                
                {successMessage && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                        {successMessage}
                    </div>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input 
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition" 
                            placeholder="name@company.com"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition" 
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition duration-200 flex items-center justify-center disabled:opacity-50"
                    >
                        {loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
                        <ArrowRight className="ml-2 h-5 w-5" />
                    </button>
                </form>
                
                <div className="mt-4">
                    <button 
                        onClick={handleGoogleSignIn}
                        disabled={loading}
                        className="w-full bg-white border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition duration-200"
                    >
                        Continue with Google
                    </button>
                </div>
                
                <div className="mt-6 text-center">
                    <button 
                        onClick={() => {
                            setIsSignUp(!isSignUp);
                            setError('');
                            setSuccessMessage('');
                        }}
                        className="text-sm text-indigo-600 hover:text-indigo-500"
                    >
                        {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;