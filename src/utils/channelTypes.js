import { 
  Hash,
  Users,
  Settings,
  MessageSquare,
  User,
  DollarSign,
  Globe,
  BookOpen,
  HeadphonesIcon
} from 'lucide-react';

/**
 * Centralized channel type definitions
 * This ensures consistency across all components
 */
export const CHANNEL_TYPES = {
  GENERAL: 'general',
  CLASS: 'class',
  IMPORT: 'import',
  SOCIAL_MEDIA: 'social-media',
  MANAGEMENT: 'management',
  CUSTOMER_SUPPORT: 'customer-support',
  BOOKKEEPING: 'bookkeeping',
  // Legacy types for backward compatibility
  TEAM: 'team',
  PROJECT: 'project',
  SOCIAL: 'social',
  SUPPORT: 'support',
  SALES: 'sales'
};

/**
 * Channel type metadata with icons, labels, and descriptions
 */
export const CHANNEL_TYPE_METADATA = {
  [CHANNEL_TYPES.GENERAL]: {
    icon: Hash,
    label: 'General Channels',
    name: 'General',
    description: 'General discussion and announcements'
  },
  [CHANNEL_TYPES.CLASS]: {
    icon: BookOpen,
    label: 'Class Channels',
    name: 'Class',
    description: 'Educational content and class management'
  },
  [CHANNEL_TYPES.IMPORT]: {
    icon: User,
    label: 'Student Import Channels',
    name: 'Import',
    description: 'Student data imports and enrollment management'
  },
  [CHANNEL_TYPES.SOCIAL_MEDIA]: {
    icon: Globe,
    label: 'Social Media Channels',
    name: 'Social Media',
    description: 'Social media management and content'
  },
  [CHANNEL_TYPES.MANAGEMENT]: {
    icon: Settings,
    label: 'Management Channels',
    name: 'Management',
    description: 'Administrative and management tasks'
  },
  [CHANNEL_TYPES.CUSTOMER_SUPPORT]: {
    icon: HeadphonesIcon,
    label: 'Customer Support Channels',
    name: 'Customer Support',
    description: 'Customer service and support'
  },
  [CHANNEL_TYPES.BOOKKEEPING]: {
    icon: DollarSign,
    label: 'Bookkeeping Channels',
    name: 'Bookkeeping',
    description: 'Financial records and accounting'
  },
  // Legacy types for backward compatibility
  [CHANNEL_TYPES.TEAM]: {
    icon: Users,
    label: 'Team Channels',
    name: 'Team',
    description: 'Team collaboration and meetings'
  },
  [CHANNEL_TYPES.PROJECT]: {
    icon: Settings,
    label: 'Project Channels',
    name: 'Project',
    description: 'Project-specific discussions'
  },
  [CHANNEL_TYPES.SOCIAL]: {
    icon: MessageSquare,
    label: 'Social Channels',
    name: 'Social',
    description: 'Casual conversations and social topics'
  },
  [CHANNEL_TYPES.SUPPORT]: {
    icon: User,
    label: 'Support Channels',
    name: 'Support',
    description: 'Help and support discussions'
  },
  [CHANNEL_TYPES.SALES]: {
    icon: DollarSign,
    label: 'Sales Channels',
    name: 'Sales',
    description: 'Sales and business discussions'
  }
};

/**
 * Array of channel types for dropdowns and selection
 */
export const CHANNEL_TYPE_OPTIONS = [
  { id: CHANNEL_TYPES.GENERAL, ...CHANNEL_TYPE_METADATA[CHANNEL_TYPES.GENERAL] },
  { id: CHANNEL_TYPES.CLASS, ...CHANNEL_TYPE_METADATA[CHANNEL_TYPES.CLASS] },
  { id: CHANNEL_TYPES.IMPORT, ...CHANNEL_TYPE_METADATA[CHANNEL_TYPES.IMPORT] },
  { id: CHANNEL_TYPES.SOCIAL_MEDIA, ...CHANNEL_TYPE_METADATA[CHANNEL_TYPES.SOCIAL_MEDIA] },
  { id: CHANNEL_TYPES.MANAGEMENT, ...CHANNEL_TYPE_METADATA[CHANNEL_TYPES.MANAGEMENT] },
  { id: CHANNEL_TYPES.CUSTOMER_SUPPORT, ...CHANNEL_TYPE_METADATA[CHANNEL_TYPES.CUSTOMER_SUPPORT] },
  { id: CHANNEL_TYPES.BOOKKEEPING, ...CHANNEL_TYPE_METADATA[CHANNEL_TYPES.BOOKKEEPING] }
];

/**
 * Priority ordering for channel type groups
 */
export const CHANNEL_TYPE_PRIORITY = {
  [CHANNEL_TYPES.GENERAL]: 0,
  [CHANNEL_TYPES.CLASS]: 1,
  [CHANNEL_TYPES.MANAGEMENT]: 2,
  [CHANNEL_TYPES.SOCIAL_MEDIA]: 3,
  [CHANNEL_TYPES.CUSTOMER_SUPPORT]: 4,
  [CHANNEL_TYPES.BOOKKEEPING]: 5,
  [CHANNEL_TYPES.IMPORT]: 6,
  // Legacy types
  [CHANNEL_TYPES.TEAM]: 7,
  [CHANNEL_TYPES.PROJECT]: 8,
  [CHANNEL_TYPES.SOCIAL]: 9,
  [CHANNEL_TYPES.SUPPORT]: 10,
  [CHANNEL_TYPES.SALES]: 11
};

/**
 * Get channel type metadata with fallback to general
 */
export const getChannelTypeMetadata = (type) => {
  return CHANNEL_TYPE_METADATA[type] || CHANNEL_TYPE_METADATA[CHANNEL_TYPES.GENERAL];
};

/**
 * Get channel type priority with fallback
 */
export const getChannelTypePriority = (type) => {
  return CHANNEL_TYPE_PRIORITY[type] ?? 999;
}; 