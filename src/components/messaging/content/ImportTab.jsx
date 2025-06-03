import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Plus, 
  Edit, 
  Phone, 
  Calendar,
  MapPin,
  Target,
  DollarSign,
  Clock,
  User,
  ChevronRight,
  Zap,
  Brain,
  CheckSquare,
  AlertCircle,
  Star,
  TrendingUp,
  MessageSquare,
  FileText,
  Send,
  Timer,
  Users,
  Mail,
  CreditCard,
  BookOpen,
  Award,
  Eye,
  MoreHorizontal
} from 'lucide-react';

/**
 * ImportTab - Revolutionary Student Onboarding Experience
 * Features: Progressive disclosure, contextual intelligence, and spatial workflows
 */
export const ImportTab = ({ channelId }) => {
  const [activeStage, setActiveStage] = useState(0);
  const [expandedSection, setExpandedSection] = useState('checklist');
  const [selectedStudentId, setSelectedStudentId] = useState('jane-doe');
  const [viewMode, setViewMode] = useState('timeline'); // timeline, kanban, details

  // Enhanced student data with workflow context
  const [studentData] = useState({
    id: 'jane-doe',
    name: 'Jane Doe',
    email: 'jane.doe@example.com',
    phone: '+1 (555) 123-4567',
    age: 26,
    currentLevel: 'Intermediate (B1)',
    targetLevel: 'Advanced (C1)',
    startDate: 'June 15, 2025',
    status: 'In Progress',
    avatar: 'JD',
    priority: 'high',
    source: 'Website Inquiry',
    lastInteraction: '2 hours ago',
    engagementScore: 85,
    riskFactors: ['Payment delay risk', 'Needs quick response'],
    suggestedActions: ['Send payment reminder', 'Schedule welcome call'],
    payments: {
      total: 1200.00,
      paid: 400.00,
      due: 800.00,
      currency: 'USD',
      nextDue: 'Jul 1, 2025',
      history: [
        { date: 'Jun 1, 2025', amount: 400.00, status: 'Paid', method: 'Card' },
        { date: 'Jul 1, 2025', amount: 400.00, status: 'Pending', method: 'Bank Transfer' },
        { date: 'Aug 1, 2025', amount: 400.00, status: 'Scheduled', method: 'Auto-pay' }
      ]
    },
    timeline: [
      { date: 'Jun 1, 10:23 AM', event: 'Assessment completed', type: 'milestone' },
      { date: 'Jun 1, 2:15 PM', event: 'Payment received', type: 'payment' },
      { date: 'Jun 2, 9:30 AM', event: 'Welcome email sent', type: 'communication' }
    ],
    notes: [
      {
        id: 1,
        author: 'Sarah Johnson',
        date: 'Jun 1, 2025 • 10:23 AM',
        type: 'assessment',
        priority: 'high',
        content: 'Initial assessment complete. Student shows strong reading comprehension but needs work on speaking fluency. Recommended intermediate course with extra conversation practice.',
        tags: ['assessment', 'speaking', 'recommendation']
      }
    ]
  });

  // Revolutionary workflow stages with contextual intelligence
  const [workflowStages] = useState([
    {
      id: 'discover',
      title: 'Discovery & First Contact',
      description: 'Build rapport and understand student goals',
      color: 'bg-blue-500',
      icon: Users,
      progress: 100,
      estimatedTime: '15 min',
      tasks: [
        { id: 'initial-contact', title: 'Initial Contact', completed: true, automated: false },
        { id: 'needs-assessment', title: 'Needs Assessment', completed: true, automated: false }
      ]
    },
    {
      id: 'assess',
      title: 'Skill Assessment & Placement',
      description: 'Evaluate current level and learning objectives',
      color: 'bg-indigo-500',
      icon: Brain,
      progress: 75,
      estimatedTime: '30 min',
      tasks: [
        { id: 'placement-test', title: 'Placement Test', completed: true, automated: true },
        { id: 'level-assessment', title: 'Level Assessment', completed: true, automated: false },
        { id: 'learning-goals', title: 'Learning Goals Discussion', completed: false, automated: false }
      ]
    },
    {
      id: 'recommend',
      title: 'Course Recommendation & Planning',
      description: 'Suggest optimal learning path and schedule',
      color: 'bg-purple-500',
      icon: Target,
      progress: 25,
      estimatedTime: '20 min',
      tasks: [
        { id: 'course-recommendation', title: 'Course Recommendation', completed: false, automated: true },
        { id: 'schedule-planning', title: 'Schedule Planning', completed: false, automated: false },
        { id: 'material-selection', title: 'Material Selection', completed: false, automated: true }
      ]
    },
    {
      id: 'enroll',
      title: 'Enrollment & Payment',
      description: 'Complete registration and payment setup',
      color: 'bg-green-500',
      icon: CreditCard,
      progress: 0,
      estimatedTime: '25 min',
      tasks: [
        { id: 'registration-form', title: 'Registration Form', completed: false, automated: false },
        { id: 'payment-setup', title: 'Payment Setup', completed: false, automated: true },
        { id: 'enrollment-confirmation', title: 'Enrollment Confirmation', completed: false, automated: true }
      ]
    },
    {
      id: 'onboard',
      title: 'Welcome & Onboarding',
      description: 'Introduce student to learning environment',
      color: 'bg-emerald-500',
      icon: Star,
      progress: 0,
      estimatedTime: '15 min',
      tasks: [
        { id: 'welcome-package', title: 'Welcome Package', completed: false, automated: true },
        { id: 'platform-tour', title: 'Platform Tour', completed: false, automated: false },
        { id: 'first-session-booking', title: 'First Session Booking', completed: false, automated: false }
      ]
    }
  ]);

  // Smart progress calculation
  const overallProgress = workflowStages.reduce((acc, stage) => acc + stage.progress, 0) / workflowStages.length;
  const completedTasks = workflowStages.flatMap(s => s.tasks).filter(t => t.completed).length;
  const totalTasks = workflowStages.flatMap(s => s.tasks).length;

  const getCurrentStage = () => {
    return workflowStages.find(stage => stage.progress > 0 && stage.progress < 100) || workflowStages[0];
  };

  const getStageStatusIcon = (stage) => {
    if (stage.progress === 100) return CheckCircle2;
    if (stage.progress > 0) return Timer;
    return Circle;
  };

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50">
      {/* Revolutionary Header with Context Switching */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-semibold text-sm">
                {studentData.avatar}
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">{studentData.name}</h1>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <span>{studentData.source}</span>
                  <span>•</span>
                  <span>Last seen {studentData.lastInteraction}</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {studentData.engagementScore}% engaged
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              {['timeline', 'kanban', 'details'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    viewMode === mode
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>

            {/* Smart Actions */}
            <button className="inline-flex items-center px-3 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
              <Zap className="w-4 h-4 mr-2" />
              Smart Actions
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Workflow Area */}
        <div className="flex-1 flex flex-col">
          {/* Revolutionary Timeline View */}
          {viewMode === 'timeline' && (
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="max-w-4xl mx-auto pb-16">
                <div className="relative min-h-full">
                  {/* Timeline Line */}
                  <div className="absolute left-8 top-0 w-0.5 bg-gradient-to-b from-indigo-500 via-purple-500 to-emerald-500" style={{ height: 'calc(100% - 2rem)' }}></div>
                  
                  {workflowStages.map((stage, index) => {
                    const StageIcon = stage.icon;
                    const StatusIcon = getStageStatusIcon(stage);
                    
                    return (
                      <div key={stage.id} className="relative mb-8">
                        {/* Stage Node */}
                        <div className="absolute left-6 w-4 h-4 rounded-full bg-white border-2 border-current flex items-center justify-center"
                             style={{ borderColor: stage.color.replace('bg-', '#') }}>
                          <div className={`w-2 h-2 rounded-full ${stage.color}`}></div>
                        </div>
                        
                        {/* Stage Content */}
                        <div className="ml-16 bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div className={`w-10 h-10 ${stage.color} rounded-lg flex items-center justify-center text-white`}>
                                <StageIcon className="w-5 h-5" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
                                  {stage.title}
                                  <StatusIcon className={`w-4 h-4 ${stage.progress === 100 ? 'text-green-500' : stage.progress > 0 ? 'text-yellow-500' : 'text-gray-400'}`} />
                                </h3>
                              </div>
                            </div>
                          </div>

                          {/* Tasks */}
                          <div className="space-y-2">
                            {stage.tasks.map((task) => (
                              <div
                                key={task.id}
                                className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                                  task.completed 
                                    ? 'bg-green-50 border border-green-200' 
                                    : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                                }`}
                              >
                                <div className="flex items-center space-x-3">
                                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                                    task.completed ? 'bg-green-500 text-white' : 'bg-gray-300'
                                  }`}>
                                    {task.completed ? <CheckSquare className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
                                  </div>
                                  <span className={`font-medium ${task.completed ? 'text-green-800 line-through' : 'text-gray-900'}`}>
                                    {task.title}
                                  </span>
                                  {task.automated && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                      <Zap className="w-3 h-3 mr-1" />
                                      Auto
                                    </span>
                                  )}
                                </div>
                                
                                {!task.completed && (
                                  <button className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                                    Start
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Contextual Information Panel */}
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
          {/* Panel Tabs */}
          <div className="border-b border-gray-200 p-4">
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
              {['profile', 'payments', 'timeline'].map((section) => (
                <button
                  key={section}
                  onClick={() => setExpandedSection(section)}
                  className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    expandedSection === section
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {section.charAt(0).toUpperCase() + section.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Panel Content */}
          <div className="flex-1 overflow-y-auto">
            {expandedSection === 'profile' && (
              <div className="p-4 space-y-4">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg mx-auto mb-3">
                    {studentData.avatar}
                  </div>
                  <h3 className="font-semibold text-gray-900">{studentData.name}</h3>
                  <p className="text-sm text-gray-600">{studentData.email}</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-600">Priority</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      studentData.priority === 'high' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {studentData.priority}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-600">Current Level</span>
                    <span className="text-sm font-medium text-gray-900">{studentData.currentLevel}</span>
                  </div>
                  
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-600">Target Level</span>
                    <span className="text-sm font-medium text-gray-900">{studentData.targetLevel}</span>
                  </div>
                </div>

                {/* Risk Factors */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <h4 className="font-medium text-yellow-800 mb-2 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Risk Factors
                  </h4>
                  <ul className="space-y-1">
                    {studentData.riskFactors.map((risk, index) => (
                      <li key={index} className="text-sm text-yellow-700">• {risk}</li>
                    ))}
                  </ul>
                </div>

                {/* Suggested Actions */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <h4 className="font-medium text-green-800 mb-2 flex items-center">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Suggested Actions
                  </h4>
                  <ul className="space-y-2">
                    {studentData.suggestedActions.map((action, index) => (
                      <li key={index} className="flex items-center justify-between text-sm">
                        <span className="text-green-700">{action}</span>
                        <button className="text-green-600 hover:text-green-700">
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {expandedSection === 'payments' && (
              <div className="p-4 space-y-4">
                <div className="text-center bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    {formatCurrency(studentData.payments.paid)}
                  </div>
                  <div className="text-sm text-green-600">of {formatCurrency(studentData.payments.total)} paid</div>
                  <div className="text-xs text-gray-500 mt-1">Next: {studentData.payments.nextDue}</div>
                </div>

                <div className="space-y-3">
                  {studentData.payments.history.map((payment, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(payment.amount)}
                        </div>
                        <div className="text-xs text-gray-500">{payment.date} • {payment.method}</div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        payment.status === 'Paid' ? 'bg-green-100 text-green-800' :
                        payment.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {payment.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {expandedSection === 'timeline' && (
              <div className="p-4 space-y-4">
                <h4 className="font-medium text-gray-900">Recent Activity</h4>
                <div className="space-y-3">
                  {studentData.timeline.map((event, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs ${
                        event.type === 'milestone' ? 'bg-indigo-500' :
                        event.type === 'payment' ? 'bg-green-500' :
                        'bg-blue-500'
                      }`}>
                        {event.type === 'milestone' ? <Award className="w-4 h-4" /> :
                         event.type === 'payment' ? <CreditCard className="w-4 h-4" /> :
                         <Mail className="w-4 h-4" />}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{event.event}</div>
                        <div className="text-xs text-gray-500">{event.date}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 