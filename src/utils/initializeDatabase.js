import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';

// Default data for all collections
const defaultData = {
  categories: [
    'Lead',
    'Contacted', 
    'Interested',
    'Paid',
    'Enrolled'
  ],
  courseInterests: [
    'A1.1 Online',
    'A1.2 Offline',
    'A2.1 Online',
    'A2.1 Offline',
    'B1.1 Online',
    'B1.1 Offline',
    'B2.1 Online',
    'B2.1 Offline',
    'C1.1 Online',
    'C1.1 Offline'
  ],
  platforms: [
    'Facebook',
    'Instagram',
    'WhatsApp',
    'Zalo',
    'Website',
    'Referral',
    'LinkedIn',
    'TikTok'
  ],
  countries: [
    'Vietnam',
    'Germany',
    'United States',
    'Canada',
    'Australia',
    'United Kingdom',
    'France',
    'Japan',
    'South Korea',
    'Singapore',
    'Thailand',
    'Malaysia'
  ],
  cities: [
    'Ho Chi Minh City',
    'Hanoi',
    'Da Nang',
    'Can Tho',
    'Hai Phong',
    'Berlin',
    'Munich',
    'Hamburg',
    'Frankfurt',
    'Cologne',
    'New York',
    'Los Angeles',
    'Chicago',
    'Houston',
    'Toronto',
    'Vancouver',
    'Montreal',
    'Sydney',
    'Melbourne',
    'Brisbane',
    'London',
    'Manchester',
    'Birmingham',
    'Paris',
    'Lyon',
    'Marseille',
    'Tokyo',
    'Osaka',
    'Kyoto',
    'Seoul',
    'Busan',
    'Singapore',
    'Bangkok',
    'Kuala Lumpur'
  ]
};

// Sample students data
const sampleStudents = [
  {
    name: 'Nguyen Thi Mai',
    email: 'mai.nguyen@email.com',
    phone: '+84 901 234 567',
    location: 'Vietnam',
    city: 'Ho Chi Minh City',
    category: 'ENROLLED',
    interest: 'A1.1 Online, Conversation Practice',
    platform: 'Facebook, WhatsApp',
    courses: [],
    notes: 'Very motivated student, prefers evening classes',
    avatar: 'NT',
    avatarColor: '#3B82F6'
  },
  {
    name: 'Le Van Duc',
    email: 'duc.le@email.com',
    phone: '+84 912 345 678',
    location: 'Vietnam',
    city: 'Hanoi',
    category: 'INTERESTED',
    interest: 'A2.1 Offline',
    platform: 'Zalo',
    courses: [],
    notes: 'Interested in business German courses',
    avatar: 'LV',
    avatarColor: '#10B981'
  },
  {
    name: 'Pham Hoang An',
    email: 'an.pham@email.com',
    phone: '+84 923 456 789',
    location: 'Vietnam',
    city: 'Da Nang',
    category: 'PAID',
    interest: 'B1.1 Online, Business German',
    platform: 'WhatsApp, Website',
    courses: [],
    notes: 'Planning to move to Germany next year',
    avatar: 'PH',
    avatarColor: '#8B5CF6'
  },
  {
    name: 'Tran Linh Chi',
    email: 'chi.tran@email.com',
    phone: '+84 934 567 890',
    location: 'Germany',
    city: 'Berlin',
    category: 'CONTACTED',
    interest: 'A1.1 Online',
    platform: 'Instagram',
    courses: [],
    notes: 'Currently living in Berlin, needs basic German',
    avatar: 'TL',
    avatarColor: '#EC4899'
  },
  {
    name: 'Vo Thanh Minh',
    email: 'minh.vo@email.com',
    phone: '+84 945 678 901',
    location: 'Vietnam',
    city: 'Ho Chi Minh City',
    category: 'LEAD',
    interest: 'A1.2 Offline',
    platform: 'Facebook',
    courses: [],
    notes: 'Prefers weekend classes',
    avatar: 'VT',
    avatarColor: '#F59E0B'
  }
];

// Helper function to check if data already exists
const checkIfDataExists = async (collectionName) => {
  const snapshot = await getDocs(collection(db, collectionName));
  return !snapshot.empty;
};

// Helper function to add data to a collection
const addDataToCollection = async (collectionName, data) => {
  console.log(`Adding data to ${collectionName}...`);
  
  for (const item of data) {
    try {
      if (typeof item === 'string') {
        // For simple string values (options)
        await addDoc(collection(db, collectionName), { value: item });
      } else {
        // For complex objects (students)
        await addDoc(collection(db, collectionName), {
          ...item,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    } catch (error) {
      console.error(`Error adding ${item} to ${collectionName}:`, error);
    }
  }
  
  console.log(`✅ ${collectionName} data added successfully`);
};

// Main initialization function
export const initializeDatabase = async () => {
  console.log('🚀 Starting database initialization...');
  
  try {
    // Initialize option collections
    for (const [collectionName, data] of Object.entries(defaultData)) {
      const exists = await checkIfDataExists(collectionName);
      
      if (!exists) {
        await addDataToCollection(collectionName, data);
      } else {
        console.log(`⏭️  ${collectionName} already has data, skipping...`);
      }
    }
    
    // Initialize students collection with sample data
    const studentsExist = await checkIfDataExists('students');
    
    if (!studentsExist) {
      await addDataToCollection('students', sampleStudents);
    } else {
      console.log('⏭️  Students collection already has data, skipping...');
    }
    
    console.log('✅ Database initialization completed successfully!');
    
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
};

// Function to reset all data (use with caution!)
export const resetDatabase = async () => {
  console.log('⚠️  Resetting database...');
  
  const collections = ['categories', 'courseInterests', 'platforms', 'countries', 'cities', 'students'];
  
  for (const collectionName of collections) {
    try {
      const snapshot = await getDocs(collection(db, collectionName));
      const deletePromises = snapshot.docs.map(doc => doc.ref.delete());
      await Promise.all(deletePromises);
      console.log(`🗑️  ${collectionName} collection cleared`);
    } catch (error) {
      console.error(`Error clearing ${collectionName}:`, error);
    }
  }
  
  // Re-initialize with fresh data
  await initializeDatabase();
}; 