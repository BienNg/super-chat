import React, { useState, useEffect } from 'react';
import { Calendar, Users, Globe, FileText, ExternalLink } from 'lucide-react';
import { useClasses } from '../../../hooks/useClasses';

const ClassView = ({ channelId, channelName }) => {
    const { classes, loading, error, getClassByChannelId } = useClasses(channelId);
    const [classData, setClassData] = useState(null);

    useEffect(() => {
        const loadClassData = async () => {
            if (channelId) {
                const classInfo = await getClassByChannelId(channelId);
                setClassData(classInfo);
                
                // Removed automatic modal opening - let user decide when to create class
            }
        };
        
        loadClassData();
    }, [channelId, getClassByChannelId]);

    const formatDays = (days) => {
        if (!days || days.length === 0) return 'No schedule set';
        return days.join(', ');
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Not set';
        return new Date(dateString).toLocaleDateString();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700">Error loading class information: {error}</p>
            </div>
        );
    }

    if (!classData) {
        return (
            <div className="text-center py-12">
                <div className="mx-auto h-12 w-12 text-gray-400">
                    <Users className="h-12 w-12" />
                </div>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No class information</h3>
                <p className="mt-1 text-sm text-gray-500">
                    This channel is set as a class type but no class details have been configured yet.
                </p>
            </div>
        );
    }

    return (
        <>
            <div className="bg-white">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{classData.className}</h1>
                        <p className="text-sm text-gray-500 mt-1">Class Information</p>
                    </div>
                </div>

                {/* Class Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic Information */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="text-sm font-medium text-gray-500">Class Type</label>
                                <p className="text-sm text-gray-900">{classData.classType || 'Not specified'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Level</label>
                                <p className="text-sm text-gray-900">{classData.level || 'Not specified'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Format</label>
                                <div className="flex items-center mt-1">
                                    <Globe className="h-4 w-4 mr-2 text-gray-400" />
                                    <span className="text-sm text-gray-900">{classData.format}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Schedule Information */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Schedule</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="text-sm font-medium text-gray-500">Days</label>
                                <div className="flex items-center mt-1">
                                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                                    <span className="text-sm text-gray-900">{formatDays(classData.days)}</span>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Start Date</label>
                                <p className="text-sm text-gray-900">{formatDate(classData.beginDate)}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">End Date</label>
                                <p className="text-sm text-gray-900">{formatDate(classData.endDate)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Teachers */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Teachers</h3>
                        {classData.teachers && classData.teachers.length > 0 ? (
                            <div className="space-y-2">
                                {classData.teachers.map((teacher, index) => (
                                    <div key={index} className="flex items-center">
                                        <Users className="h-4 w-4 mr-2 text-gray-400" />
                                        <span className="text-sm text-gray-900">{teacher}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500">No teachers assigned</p>
                        )}
                    </div>

                    {/* Google Drive */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Resources</h3>
                        {classData.googleDriveUrl ? (
                            <a
                                href={classData.googleDriveUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-500"
                            >
                                <FileText className="h-4 w-4 mr-2" />
                                Google Drive
                                <ExternalLink className="h-3 w-3 ml-1" />
                            </a>
                        ) : (
                            <p className="text-sm text-gray-500">No Google Drive link set</p>
                        )}
                    </div>
                </div>

                {/* Status */}
                <div className="mt-6 flex items-center">
                    <span className="text-sm font-medium text-gray-500 mr-2">Status:</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        classData.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : classData.status === 'archived'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-yellow-100 text-yellow-800'
                    }`}>
                        {classData.status || 'active'}
                    </span>
                </div>
            </div>
        </>
    );
};

export default ClassView; 