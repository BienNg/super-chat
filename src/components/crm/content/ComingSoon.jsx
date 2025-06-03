import React from 'react';
import { Users, Calendar, TrendingUp, Mail, Phone, Building } from 'lucide-react';

/**
 * ComingSoon - Coming soon page for CRM system
 * Displays a professional coming soon message with feature preview
 */
export const ComingSoon = () => {
  const features = [
    {
      icon: Users,
      title: 'Contact Management',
      description: 'Organize and manage all your student and parent contacts in one place'
    },
    {
      icon: Calendar,
      title: 'Enrollment Tracking',
      description: 'Track student enrollment status and manage the admission pipeline'
    },
    {
      icon: TrendingUp,
      title: 'Analytics & Reports',
      description: 'Get insights into enrollment trends and student engagement metrics'
    },
    {
      icon: Mail,
      title: 'Communication Hub',
      description: 'Streamlined communication with automated follow-ups and reminders'
    },
    {
      icon: Phone,
      title: 'Call Management',
      description: 'Track calls, schedule follow-ups, and maintain communication history'
    },
    {
      icon: Building,
      title: 'Institution Management',
      description: 'Manage multiple campuses, departments, and administrative workflows'
    }
  ];

  return (
    <div className="flex-1 bg-gray-50 flex items-center justify-center p-8">
      <div className="max-w-4xl w-full">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Users className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-semibold text-gray-900 mb-4">
            CRM System Coming Soon
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            We're building a comprehensive Customer Relationship Management system 
            designed specifically for educational institutions. Stay tuned for powerful 
            tools to manage student relationships and streamline your enrollment process.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div 
                key={index}
                className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-md transition-shadow duration-200"
              >
                <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center mb-4">
                  <IconComponent className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Status Section */}
        <div className="bg-white rounded-xl p-8 border border-gray-200 text-center">
          <div className="inline-flex items-center px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium mb-4">
            <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2 animate-pulse"></div>
            In Development
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Development in Progress
          </h3>
          <p className="text-gray-600 mb-6">
            Our team is actively working on bringing you these powerful CRM features. 
            We'll notify you as soon as the system is ready for use.
          </p>
          <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
            <span>Expected Launch: Q2 2024</span>
            <span>•</span>
            <span>Beta Testing Available Soon</span>
          </div>
        </div>
      </div>
    </div>
  );
}; 