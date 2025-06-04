// src/components/OnboardingFlow.jsx
import React, { useState, useEffect } from 'react';
import { Check, Upload, User, Users, DollarSign, MessageSquare, Headphones, Camera, Plus } from 'lucide-react';
import { useAuth } from '../../contexts/SupabaseAuthContext';

const OnboardingFlow = ({ onComplete }) => {
    const [currentScreen, setCurrentScreen] = useState(1);
    const [selectedRoles, setSelectedRoles] = useState([]);
    const [customRole, setCustomRole] = useState('');
    const [profileData, setProfileData] = useState({
        fullName: '',
        department: '',
        bio: '',
        photo: null
    });
    const [loading, setLoading] = useState(false);

    const { currentUser, userProfile, updateUserProfile } = useAuth();
    
    console.log("OnboardingFlow rendered with currentUser:", currentUser, "userProfile:", userProfile);
    
    useEffect(() => {
        console.log("Auth state in OnboardingFlow changed - currentUser:", currentUser, "userProfile:", userProfile);
    }, [currentUser, userProfile]);

    const roles = [
        { id: 'teacher', name: 'Teacher', description: 'Manage classes and student progress', icon: Users },
        { id: 'accountant', name: 'Accountant', description: 'Handle financial transactions', icon: DollarSign },
        { id: 'support', name: 'Customer Support', description: 'Assist students and handle inquiries', icon: Headphones },
        { id: 'manager', name: 'Manager', description: 'Oversee operations and staff', icon: User },
        { id: 'visa', name: 'Visa Support', description: 'Handle visa applications and documentation', icon: MessageSquare },
        { id: 'social', name: 'Social Media', description: 'Manage social media and marketing', icon: Camera },
        { id: 'custom', name: 'Custom', description: 'Define your own role', icon: Plus }
    ];

    const departments = [
        'Teaching', 'Administration', 'Finance', 'Customer Support', 'Marketing', 'Operations', 'Other'
    ];

    const toggleRole = (roleId) => {
        setSelectedRoles((prev) => 
            prev.includes(roleId) 
                ? prev.filter((id) => id !== roleId)
                : [...prev, roleId]
        );
    };

    const handleCompleteSetup = async () => {
        try {
            setLoading(true);
            console.log("Starting onboarding completion process with Supabase Auth");
            
            if (!currentUser) {
                console.error("Error: currentUser is undefined in handleCompleteSetup");
                setLoading(false);
                throw new Error("User not authenticated");
            }
            
            console.log("Current user for Supabase update:", currentUser.id);
            
            // Determine primary role
            let primaryRole = '';
            if (selectedRoles.includes('custom') && customRole) {
                primaryRole = customRole;
            } else if (selectedRoles.length > 0) {
                const firstSelectedRole = roles.find(r => r.id === selectedRoles[0]);
                primaryRole = firstSelectedRole ? firstSelectedRole.name : selectedRoles[0];
            }

            // Convert to snake_case for Supabase
            const updateData = {
                display_name: profileData.fullName,
                role: primaryRole,
                department: profileData.department,
                bio: profileData.bio,
                roles: selectedRoles.map(roleId => {
                    if (roleId === 'custom') return customRole || 'Custom';
                    const roleObj = roles.find(r => r.id === roleId);
                    return roleObj ? roleObj.name : roleId;
                }),
                is_onboarding_complete: true,
                updated_at: new Date().toISOString()
            };
            
            console.log("About to update Supabase profile with data:", updateData);
            
            const updatedProfile = await updateUserProfile(currentUser.id, updateData);
            console.log("Supabase Profile update completed:", updatedProfile);

            console.log("Onboarding completion successful, calling onComplete callback");
            onComplete?.();
        } catch (error) {
            console.error('Error completing onboarding with Supabase:', error);
        } finally {
            setLoading(false);
        }
    };

    const RoleCard = ({ role, isSelected }) => {
        const IconComponent = role.icon;
        return (
            <div 
                className={`relative h-[200px] p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${
                    isSelected 
                        ? 'border-indigo-600 bg-indigo-50' 
                        : 'border-gray-200 bg-white hover:border-indigo-300'
                }`}
                onClick={() => toggleRole(role.id)}
            >
                {isSelected && (
                    <div className="absolute top-4 right-4 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                    </div>
                )}
                <div className="flex flex-col items-center text-center h-full">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${
                        isSelected ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'
                    }`}>
                        <IconComponent className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{role.name}</h3>
                    <p className="text-sm text-gray-500 flex-1">{role.description}</p>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            {/* Screen 1: Role Selection */}
            {currentScreen === 1 && (
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6">
                        <h1 className="text-2xl font-bold text-white mb-2">Welcome! Let's set up your account</h1>
                        <div className="flex items-center text-indigo-100">
                            <div className="flex items-center">
                                <div className="w-6 h-6 bg-white text-indigo-600 rounded-full flex items-center justify-center text-sm font-medium mr-2">1</div>
                                <span className="text-sm">Role Selection</span>
                            </div>
                            <div className="w-8 h-px bg-indigo-300 mx-4"></div>
                            <div className="flex items-center">
                                <div className="w-6 h-6 bg-indigo-400 text-white rounded-full flex items-center justify-center text-sm font-medium mr-2">2</div>
                                <span className="text-sm">Profile Setup</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-8">
                        <div className="mb-8">
                            <h2 className="text-xl font-semibold text-gray-900 mb-2">Select all roles that apply to you</h2>
                            <p className="text-gray-600">Minimum 1 required • {selectedRoles.length} roles selected</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            {roles.map((role) => (
                                <RoleCard 
                                    key={role.id} 
                                    role={role} 
                                    isSelected={selectedRoles.includes(role.id)} 
                                />
                            ))}
                        </div>

                        {selectedRoles.includes('custom') && (
                            <div className="mb-8 p-6 bg-gray-50 rounded-xl">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Enter your custom role
                                </label>
                                <input
                                    type="text"
                                    value={customRole}
                                    onChange={(e) => setCustomRole(e.target.value)}
                                    placeholder="Enter your custom role"
                                    maxLength={50}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                        )}

                        <div className="flex justify-end">
                            <button
                                onClick={() => setCurrentScreen(2)}
                                disabled={selectedRoles.length === 0}
                                className={`px-8 py-3 rounded-lg font-medium transition-all duration-200 ${
                                    selectedRoles.length > 0
                                        ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg hover:shadow-xl'
                                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                }`}
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Screen 2: Profile Setup */}
            {currentScreen === 2 && (
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6">
                        <h1 className="text-2xl font-bold text-white mb-2">Complete your profile</h1>
                        <div className="flex items-center text-indigo-100">
                            <div className="flex items-center">
                                <div className="w-6 h-6 bg-indigo-400 text-white rounded-full flex items-center justify-center text-sm font-medium mr-2">
                                    <Check className="w-4 h-4" />
                                </div>
                                <span className="text-sm">Role Selection</span>
                            </div>
                            <div className="w-8 h-px bg-indigo-300 mx-4"></div>
                            <div className="flex items-center">
                                <div className="w-6 h-6 bg-white text-indigo-600 rounded-full flex items-center justify-center text-sm font-medium mr-2">2</div>
                                <span className="text-sm">Profile Setup</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Form Section */}
                            <div className="space-y-6">
                                {/* Full Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Full Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={profileData.fullName}
                                        onChange={(e) => setProfileData((prev) => ({ ...prev, fullName: e.target.value }))}
                                        placeholder="Enter your full name"
                                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        required
                                    />
                                </div>

                                {/* Department */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Department/Team
                                    </label>
                                    <select
                                        value={profileData.department}
                                        onChange={(e) => setProfileData((prev) => ({ ...prev, department: e.target.value }))}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        <option value="">Select department</option>
                                        {departments.map((dept) => (
                                            <option key={dept} value={dept}>{dept}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Bio */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Bio/Description
                                    </label>
                                    <textarea
                                        value={profileData.bio}
                                        onChange={(e) => setProfileData((prev) => ({ ...prev, bio: e.target.value }))}
                                        placeholder="Tell us about yourself..."
                                        maxLength={200}
                                        rows={4}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">{profileData.bio.length}/200 characters</p>
                                </div>
                            </div>

                            {/* Preview Section */}
                            <div className="bg-gray-50 rounded-xl p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Preview</h3>
                                <div className="bg-white rounded-lg p-4 shadow-sm">
                                    <div className="flex items-center mb-4">
                                        <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center text-white font-medium mr-3">
                                            {profileData.fullName ? profileData.fullName.split(' ').map((n) => n[0]).join('') : 'UN'}
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-gray-900">
                                                {profileData.fullName || 'Your Name'}
                                            </h4>
                                            <p className="text-sm text-gray-500">
                                                {profileData.department || 'Department'}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="mb-4">
                                        <h5 className="text-sm font-medium text-gray-700 mb-2">Roles:</h5>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedRoles.map((roleId) => {
                                                const role = roles.find((r) => r.id === roleId);
                                                return (
                                                    <span key={roleId} className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full">
                                                        {roleId === 'custom' ? customRole : role?.name}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {profileData.bio && (
                                        <div>
                                            <h5 className="text-sm font-medium text-gray-700 mb-2">Bio:</h5>
                                            <p className="text-sm text-gray-600">{profileData.bio}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between mt-8">
                            <button
                                onClick={() => setCurrentScreen(1)}
                                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleCompleteSetup}
                                disabled={!profileData.fullName || loading}
                                className={`px-8 py-3 rounded-lg font-medium transition-all duration-200 ${
                                    profileData.fullName && !loading
                                        ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg hover:shadow-xl'
                                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                }`}
                            >
                                {loading ? 'Setting up...' : 'Complete Setup'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OnboardingFlow;