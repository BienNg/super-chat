// src/App.js
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/SupabaseAuthContext';
import { AdvancedFirebaseMonitorProvider } from './contexts/AdvancedFirebaseMonitorContext';
import { ThreadProvider } from './contexts/ThreadContext';
import { Login, OnboardingFlow } from './components/auth';
import { MessagingInterface } from './components/messaging';
import { CRMInterface } from './components/crm';
import { BookkeepingInterface } from './components/bookkeeping';
import AdminToggle from './components/shared/AdminToggle';
import PermissionTestComponent from './components/shared/PermissionTestComponent';

// Wrapper for OnboardingFlow with navigation
const OnboardingFlowWithNavigation = () => {
    const navigate = useNavigate();
    
    const handleOnboardingComplete = () => {
        console.log("Onboarding complete, navigating to home");
        navigate('/', { replace: true });
    };
    
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
};

// Protected Route wrapper component
const ProtectedRoute = ({ children }) => {
    const { currentUser, userProfile } = useAuth();
    
    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    if (userProfile && !userProfile.is_onboarding_complete) {
        return <Navigate to="/onboarding" replace />;
    }

    return children;
};

// Public Route wrapper component (redirects if already authenticated)
const PublicRoute = ({ children }) => {
    const { currentUser, userProfile } = useAuth();
    
    if (currentUser) {
        if (userProfile && !userProfile.is_onboarding_complete) {
            return <Navigate to="/onboarding" replace />;
        }
        return <Navigate to="/" replace />;
    }

    return children;
};

// Onboarding Route wrapper component
const OnboardingRoute = ({ children }) => {
    const { currentUser, userProfile } = useAuth();
    
    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    if (userProfile && userProfile.is_onboarding_complete) {
        return <Navigate to="/" replace />;
    }

    return children;
};

function App() {
    return (
        <AuthProvider>
            <AdvancedFirebaseMonitorProvider>
                <BrowserRouter>
                    <div className="App">
                        <AdminToggle />
                        <Routes>
                            {/* Public Routes */}
                            <Route 
                                path="/login" 
                                element={
                                    <PublicRoute>
                                        <Login />
                                    </PublicRoute>
                                } 
                            />

                            {/* Onboarding Route */}
                            <Route 
                                path="/onboarding" 
                                element={
                                    <OnboardingRoute>
                                        <OnboardingFlowWithNavigation />
                                    </OnboardingRoute>
                                } 
                            />

                            {/* Permission Test Route (Development Only) */}
                            {process.env.NODE_ENV === 'development' && (
                                <Route
                                    path="/permission-test"
                                    element={
                                        <ProtectedRoute>
                                            <PermissionTestComponent />
                                        </ProtectedRoute>
                                    }
                                />
                            )}

                            {/* Protected Routes */}
                            <Route
                                path="/"
                                element={
                                    <ProtectedRoute>
                                        <ThreadProvider>
                                            <MessagingInterface />
                                        </ThreadProvider>
                                    </ProtectedRoute>
                                }
                            >
                                {/* Default redirect to channels */}
                                <Route index element={<Navigate to="/channels" replace />} />
                                
                                {/* Channel routes with nested tab routing */}
                                <Route path="channels" element={<MessagingInterface />}>
                                    {/* Default to first channel when no channel selected */}
                                    <Route index element={<MessagingInterface />} />
                                    
                                    {/* Channel with tab routes */}
                                    <Route path=":channelId" element={<MessagingInterface />}>
                                        {/* Default to messages tab */}
                                        <Route index element={<Navigate to="messages" replace />} />
                                        
                                        {/* Messages tab with optional thread */}
                                        <Route path="messages" element={<MessagingInterface />} />
                                        <Route path="messages/thread/:messageId" element={<MessagingInterface />} />
                                        
                                        {/* Tasks tab with optional task detail */}
                                        <Route path="tasks" element={<MessagingInterface />} />
                                        <Route path="tasks/:taskId" element={<MessagingInterface />} />
                                        
                                        {/* Classes tab with optional sub-tabs */}
                                        <Route path="classes" element={<MessagingInterface />}>
                                            <Route index element={<Navigate to="courses" replace />} />
                                            <Route path="courses" element={<MessagingInterface />} />
                                            <Route path="info" element={<MessagingInterface />} />
                                        </Route>
                                        
                                        {/* Import tab */}
                                        <Route path="import" element={<MessagingInterface />} />
                                        
                                        {/* Wiki tab */}
                                        <Route path="wiki" element={<MessagingInterface />} />
                                        <Route path="wiki/:pageId" element={<MessagingInterface />} />
                                    </Route>
                                </Route>
                            </Route>

                            {/* CRM System Routes */}
                            <Route
                                path="/crm"
                                element={
                                    <ProtectedRoute>
                                        <CRMInterface />
                                    </ProtectedRoute>
                                }
                            >
                                {/* Default CRM overview */}
                                <Route index element={<CRMInterface />} />
                                
                                {/* Student details route */}
                                <Route path="students/:studentId" element={<CRMInterface />} />
                            </Route>

                            {/* Bookkeeping System Routes */}
                            <Route
                                path="/bookkeeping"
                                element={
                                    <ProtectedRoute>
                                        <BookkeepingInterface />
                                    </ProtectedRoute>
                                }
                            >
                                {/* Default bookkeeping overview */}
                                <Route index element={<BookkeepingInterface />} />
                                
                                {/* Payment details route */}
                                <Route path="payment/:paymentId" element={<BookkeepingInterface />} />
                            </Route>

                            {/* Catch all route */}
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </div>
                </BrowserRouter>
            </AdvancedFirebaseMonitorProvider>
        </AuthProvider>
    );
}

export default App;