/**
 * Firebase to Supabase CRM Migration Utility
 * 
 * This script migrates the CRM data from Firebase to Supabase.
 * It handles the following collections:
 * - countries
 * - cities
 * - platforms
 * - categories
 * - students
 * - courses
 * - classes
 * - enrollments
 * - payments
 */

// Firebase
const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  getDocs,
  query,
  orderBy
} = require('firebase/firestore');

// Supabase
const { createClient } = require('@supabase/supabase-js');

// Firebase config - update with your Firebase config
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

// Supabase config - update with your Supabase config
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const firestore = getFirestore(firebaseApp);

// Initialize Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

// Helper function to convert Firebase timestamps to ISO strings
const convertTimestamps = (obj) => {
  const newObj = { ...obj };
  
  for (const key in newObj) {
    if (newObj[key] && typeof newObj[key] === 'object' && newObj[key].toDate instanceof Function) {
      newObj[key] = newObj[key].toDate().toISOString();
    } else if (newObj[key] && typeof newObj[key] === 'object') {
      newObj[key] = convertTimestamps(newObj[key]);
    }
  }
  
  return newObj;
};

// Helper function to map Firebase field names to Supabase field names
const mapFields = (obj, fieldMappings) => {
  const newObj = {};
  
  for (const key in obj) {
    const newKey = fieldMappings[key] || key;
    newObj[newKey] = obj[key];
  }
  
  return newObj;
};

// Migrate a simple collection (countries, cities, platforms, categories)
const migrateSimpleCollection = async (collectionName, supabaseTable = null) => {
  const tableName = supabaseTable || collectionName;
  console.log(`Migrating ${collectionName} to ${tableName}...`);
  
  try {
    // Get data from Firebase
    const q = query(collection(firestore, collectionName), orderBy('createdAt', 'asc'));
    const snapshot = await getDocs(q);
    
    // Prepare data for Supabase
    const records = snapshot.docs.map(doc => {
      const data = convertTimestamps(doc.data());
      
      return {
        ...data,
        created_at: data.createdAt || new Date().toISOString()
      };
    });
    
    // Skip if no records
    if (records.length === 0) {
      console.log(`No records found for ${collectionName}. Skipping.`);
      return;
    }
    
    // Insert into Supabase
    const { data, error } = await supabase
      .from(tableName)
      .insert(records);
    
    if (error) {
      throw error;
    }
    
    console.log(`Migrated ${records.length} ${collectionName} records.`);
  } catch (error) {
    console.error(`Error migrating ${collectionName}:`, error);
  }
};

// Migrate students
const migrateStudents = async () => {
  console.log('Migrating students...');
  
  try {
    // Field mappings from Firebase to Supabase
    const fieldMappings = {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      dateOfBirth: 'date_of_birth',
      enrollmentDate: 'enrollment_date',
      emergencyContact: 'emergency_contact',
      avatarColor: 'avatar_color',
      createdBy: 'created_by'
    };
    
    // Get data from Firebase
    const q = query(collection(firestore, 'students'), orderBy('createdAt', 'asc'));
    const snapshot = await getDocs(q);
    
    // Prepare data for Supabase
    const records = snapshot.docs.map(doc => {
      const data = convertTimestamps(doc.data());
      const mappedData = mapFields(data, fieldMappings);
      
      return {
        ...mappedData,
        id: doc.id, // Preserve the Firebase ID
        created_at: mappedData.created_at || new Date().toISOString(),
        updated_at: mappedData.updated_at || new Date().toISOString()
      };
    });
    
    // Skip if no records
    if (records.length === 0) {
      console.log('No students found. Skipping.');
      return;
    }
    
    // Insert into Supabase
    for (const record of records) {
      const { data, error } = await supabase
        .from('students')
        .insert([record]);
      
      if (error) {
        console.error(`Error inserting student ${record.id}:`, error);
      }
    }
    
    console.log(`Migrated ${records.length} students.`);
  } catch (error) {
    console.error('Error migrating students:', error);
  }
};

// Migrate courses
const migrateCourses = async () => {
  console.log('Migrating courses...');
  
  try {
    // Field mappings from Firebase to Supabase
    const fieldMappings = {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      createdBy: 'created_by'
    };
    
    // Get data from Firebase
    const q = query(collection(firestore, 'courses'), orderBy('createdAt', 'asc'));
    const snapshot = await getDocs(q);
    
    // Prepare data for Supabase
    const records = snapshot.docs.map(doc => {
      const data = convertTimestamps(doc.data());
      const mappedData = mapFields(data, fieldMappings);
      
      return {
        ...mappedData,
        id: doc.id, // Preserve the Firebase ID
        created_at: mappedData.created_at || new Date().toISOString(),
        updated_at: mappedData.updated_at || new Date().toISOString()
      };
    });
    
    // Skip if no records
    if (records.length === 0) {
      console.log('No courses found. Skipping.');
      return;
    }
    
    // Insert into Supabase
    for (const record of records) {
      const { data, error } = await supabase
        .from('courses')
        .insert([record]);
      
      if (error) {
        console.error(`Error inserting course ${record.id}:`, error);
      }
    }
    
    console.log(`Migrated ${records.length} courses.`);
  } catch (error) {
    console.error('Error migrating courses:', error);
  }
};

// Migrate classes
const migrateClasses = async () => {
  console.log('Migrating classes...');
  
  try {
    // Field mappings from Firebase to Supabase
    const fieldMappings = {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      startDate: 'start_date',
      endDate: 'end_date',
      courseId: 'course_id',
      createdBy: 'created_by'
    };
    
    // Get data from Firebase
    const q = query(collection(firestore, 'classes'), orderBy('createdAt', 'asc'));
    const snapshot = await getDocs(q);
    
    // Prepare data for Supabase
    const records = snapshot.docs.map(doc => {
      const data = convertTimestamps(doc.data());
      const mappedData = mapFields(data, fieldMappings);
      
      return {
        ...mappedData,
        id: doc.id, // Preserve the Firebase ID
        created_at: mappedData.created_at || new Date().toISOString(),
        updated_at: mappedData.updated_at || new Date().toISOString()
      };
    });
    
    // Skip if no records
    if (records.length === 0) {
      console.log('No classes found. Skipping.');
      return;
    }
    
    // Insert into Supabase
    for (const record of records) {
      const { data, error } = await supabase
        .from('classes')
        .insert([record]);
      
      if (error) {
        console.error(`Error inserting class ${record.id}:`, error);
      }
    }
    
    console.log(`Migrated ${records.length} classes.`);
  } catch (error) {
    console.error('Error migrating classes:', error);
  }
};

// Migrate enrollments
const migrateEnrollments = async () => {
  console.log('Migrating enrollments...');
  
  try {
    // Field mappings from Firebase to Supabase
    const fieldMappings = {
      studentId: 'student_id',
      courseId: 'course_id',
      classId: 'class_id',
      studentName: 'student_name',
      studentEmail: 'student_email',
      courseName: 'course_name',
      courseLevel: 'course_level',
      className: 'class_name',
      paymentStatus: 'payment_status',
      paymentId: 'payment_id',
      enrollmentDate: 'enrollment_date',
      startDate: 'start_date',
      endDate: 'end_date',
      completionDate: 'completion_date',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      createdBy: 'created_by'
    };
    
    // Get data from Firebase
    const q = query(collection(firestore, 'enrollments'), orderBy('createdAt', 'asc'));
    const snapshot = await getDocs(q);
    
    // Prepare data for Supabase
    const records = snapshot.docs.map(doc => {
      const data = convertTimestamps(doc.data());
      const mappedData = mapFields(data, fieldMappings);
      
      return {
        ...mappedData,
        id: doc.id, // Preserve the Firebase ID
        created_at: mappedData.created_at || new Date().toISOString(),
        updated_at: mappedData.updated_at || new Date().toISOString()
      };
    });
    
    // Skip if no records
    if (records.length === 0) {
      console.log('No enrollments found. Skipping.');
      return;
    }
    
    // Insert into Supabase
    for (const record of records) {
      const { data, error } = await supabase
        .from('enrollments')
        .insert([record]);
      
      if (error) {
        console.error(`Error inserting enrollment ${record.id}:`, error);
      }
    }
    
    console.log(`Migrated ${records.length} enrollments.`);
  } catch (error) {
    console.error('Error migrating enrollments:', error);
  }
};

// Migrate payments
const migratePayments = async () => {
  console.log('Migrating payments...');
  
  try {
    // Field mappings from Firebase to Supabase
    const fieldMappings = {
      studentId: 'student_id',
      courseId: 'course_id',
      enrollmentId: 'enrollment_id',
      paymentDate: 'payment_date',
      transactionId: 'transaction_id',
      paymentMethod: 'payment_method',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      createdBy: 'created_by'
    };
    
    // Get data from Firebase
    const q = query(collection(firestore, 'payments'), orderBy('createdAt', 'asc'));
    const snapshot = await getDocs(q);
    
    // Prepare data for Supabase
    const records = snapshot.docs.map(doc => {
      const data = convertTimestamps(doc.data());
      const mappedData = mapFields(data, fieldMappings);
      
      return {
        ...mappedData,
        id: doc.id, // Preserve the Firebase ID
        created_at: mappedData.created_at || new Date().toISOString(),
        updated_at: mappedData.updated_at || new Date().toISOString()
      };
    });
    
    // Skip if no records
    if (records.length === 0) {
      console.log('No payments found. Skipping.');
      return;
    }
    
    // Insert into Supabase
    for (const record of records) {
      const { data, error } = await supabase
        .from('payments')
        .insert([record]);
      
      if (error) {
        console.error(`Error inserting payment ${record.id}:`, error);
      }
    }
    
    console.log(`Migrated ${records.length} payments.`);
  } catch (error) {
    console.error('Error migrating payments:', error);
  }
};

// Run migration
const runMigration = async () => {
  console.log('Starting migration from Firebase to Supabase...');
  
  try {
    // Migrate simple collections
    await migrateSimpleCollection('countries');
    await migrateSimpleCollection('cities');
    await migrateSimpleCollection('platforms');
    await migrateSimpleCollection('categories');
    
    // Migrate complex collections
    await migrateStudents();
    await migrateCourses();
    await migrateClasses();
    await migrateEnrollments();
    await migratePayments();
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
};

// Run the migration if this script is executed directly
if (require.main === module) {
  runMigration();
}

module.exports = {
  runMigration
}; 