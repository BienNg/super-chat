// Node.js script to migrate data from Firebase to Supabase
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin SDK (requires a service account key)
const serviceAccount = require('./service-account-key.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const firestore = admin.firestore();

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper function to convert Firestore timestamp to ISO string
const convertTimestamp = (timestamp) => {
  if (!timestamp) return null;
  if (timestamp.toDate) {
    return timestamp.toDate().toISOString();
  }
  return timestamp;
};

// Helper to create a log directory for the migration
const setupLogging = () => {
  const logDir = path.join(__dirname, 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
  }
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const logPath = path.join(logDir, `migration-${timestamp}.log`);
  const logStream = fs.createWriteStream(logPath, { flags: 'a' });
  
  return {
    log: (message) => {
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] ${message}\n`;
      console.log(message);
      logStream.write(logMessage);
    },
    close: () => {
      logStream.end();
    }
  };
};

const logger = setupLogging();

// Migrate users
const migrateUsers = async () => {
  logger.log('Starting user migration...');
  try {
    const usersSnapshot = await firestore.collection('users').get();
    
    for (const doc of usersSnapshot.docs) {
      const userData = doc.data();
      const userId = doc.id;
      
      // Check if user already exists in Supabase Auth
      // This is just a check - actual user auth migration would need to be handled separately
      // through Supabase's Auth API or manual import
      const { data: existingProfiles } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId);
      
      if (existingProfiles && existingProfiles.length > 0) {
        logger.log(`User profile for ${userId} already exists, skipping...`);
        continue;
      }
      
      // Prepare user profile data
      const profileData = {
        user_id: userId,
        display_name: userData.displayName || '',
        email: userData.email || '',
        roles: userData.roles || [],
        is_onboarding_complete: userData.isOnboardingComplete || false,
        created_at: convertTimestamp(userData.createdAt),
        updated_at: convertTimestamp(userData.updatedAt)
      };
      
      // Insert user profile
      const { data, error } = await supabase
        .from('user_profiles')
        .insert(profileData);
      
      if (error) {
        logger.log(`Error migrating user ${userId}: ${error.message}`);
      } else {
        logger.log(`Successfully migrated user ${userId}`);
      }
    }
    
    logger.log('User migration complete!');
  } catch (error) {
    logger.log(`Error during user migration: ${error.message}`);
  }
};

// Migrate channels
const migrateChannels = async () => {
  logger.log('Starting channel migration...');
  try {
    const channelsSnapshot = await firestore.collection('channels').get();
    
    for (const doc of channelsSnapshot.docs) {
      const channelData = doc.data();
      
      // Prepare channel data
      const channel = {
        id: doc.id, // Keep the same ID
        name: channelData.name || '',
        description: channelData.description || '',
        members: channelData.members || [],
        admins: channelData.admins || [],
        created_by: channelData.createdBy || null,
        created_at: convertTimestamp(channelData.createdAt),
        updated_at: convertTimestamp(channelData.updatedAt)
      };
      
      // Insert channel
      const { data, error } = await supabase
        .from('channels')
        .upsert(channel, { onConflict: 'id' });
      
      if (error) {
        logger.log(`Error migrating channel ${doc.id}: ${error.message}`);
      } else {
        logger.log(`Successfully migrated channel ${doc.id}`);
        
        // Now migrate messages for this channel
        await migrateMessagesForChannel(doc.id);
        
        // Migrate tasks for this channel
        await migrateTasksForChannel(doc.id);
      }
    }
    
    logger.log('Channel migration complete!');
  } catch (error) {
    logger.log(`Error during channel migration: ${error.message}`);
  }
};

// Migrate messages for a specific channel
const migrateMessagesForChannel = async (channelId) => {
  logger.log(`Migrating messages for channel ${channelId}...`);
  try {
    const messagesSnapshot = await firestore
      .collection('channels')
      .doc(channelId)
      .collection('messages')
      .get();
    
    for (const doc of messagesSnapshot.docs) {
      const messageData = doc.data();
      
      // Prepare message data
      const message = {
        id: doc.id, // Keep the same ID
        channel_id: channelId,
        user_id: messageData.userId || null,
        content: messageData.content || '',
        created_at: convertTimestamp(messageData.createdAt),
        updated_at: convertTimestamp(messageData.updatedAt)
      };
      
      // Insert message
      const { data, error } = await supabase
        .from('messages')
        .upsert(message, { onConflict: 'id' });
      
      if (error) {
        logger.log(`Error migrating message ${doc.id}: ${error.message}`);
      } else {
        logger.log(`Successfully migrated message ${doc.id}`);
        
        // Now migrate replies for this message
        await migrateRepliesForMessage(channelId, doc.id);
      }
    }
    
    // Now migrate reactions for this channel
    await migrateReactionsForChannel(channelId);
    
    logger.log(`Messages migration for channel ${channelId} complete!`);
  } catch (error) {
    logger.log(`Error during messages migration for channel ${channelId}: ${error.message}`);
  }
};

// Migrate replies for a specific message
const migrateRepliesForMessage = async (channelId, messageId) => {
  logger.log(`Migrating replies for message ${messageId}...`);
  try {
    const repliesSnapshot = await firestore
      .collection('channels')
      .doc(channelId)
      .collection('messages')
      .doc(messageId)
      .collection('replies')
      .get();
    
    for (const doc of repliesSnapshot.docs) {
      const replyData = doc.data();
      
      // Prepare reply data
      const reply = {
        id: doc.id, // Keep the same ID
        message_id: messageId,
        user_id: replyData.userId || null,
        content: replyData.content || '',
        created_at: convertTimestamp(replyData.createdAt),
        updated_at: convertTimestamp(replyData.updatedAt)
      };
      
      // Insert reply
      const { data, error } = await supabase
        .from('replies')
        .upsert(reply, { onConflict: 'id' });
      
      if (error) {
        logger.log(`Error migrating reply ${doc.id}: ${error.message}`);
      } else {
        logger.log(`Successfully migrated reply ${doc.id}`);
      }
    }
    
    logger.log(`Replies migration for message ${messageId} complete!`);
  } catch (error) {
    logger.log(`Error during replies migration for message ${messageId}: ${error.message}`);
  }
};

// Migrate reactions for a specific channel
const migrateReactionsForChannel = async (channelId) => {
  logger.log(`Migrating reactions for channel ${channelId}...`);
  try {
    const reactionsSnapshot = await firestore
      .collection('channels')
      .doc(channelId)
      .collection('reactions')
      .get();
    
    for (const doc of reactionsSnapshot.docs) {
      const reactionData = doc.data();
      
      // Prepare reaction data
      const reaction = {
        id: doc.id, // Keep the same ID
        message_id: reactionData.messageId || null,
        user_id: reactionData.userId || null,
        reaction_type: reactionData.type || '',
        created_at: convertTimestamp(reactionData.createdAt)
      };
      
      // Insert reaction
      const { data, error } = await supabase
        .from('reactions')
        .upsert(reaction, { onConflict: 'id' });
      
      if (error) {
        logger.log(`Error migrating reaction ${doc.id}: ${error.message}`);
      } else {
        logger.log(`Successfully migrated reaction ${doc.id}`);
      }
    }
    
    logger.log(`Reactions migration for channel ${channelId} complete!`);
  } catch (error) {
    logger.log(`Error during reactions migration for channel ${channelId}: ${error.message}`);
  }
};

// Migrate tasks for a specific channel
const migrateTasksForChannel = async (channelId) => {
  logger.log(`Migrating tasks for channel ${channelId}...`);
  try {
    const tasksSnapshot = await firestore
      .collection('channels')
      .doc(channelId)
      .collection('tasks')
      .get();
    
    for (const doc of tasksSnapshot.docs) {
      const taskData = doc.data();
      
      // Prepare task data
      const task = {
        id: doc.id, // Keep the same ID
        channel_id: channelId,
        user_id: taskData.userId || null,
        title: taskData.title || '',
        description: taskData.description || '',
        status: taskData.status || 'pending',
        assigned_to: taskData.assignedTo || [],
        due_date: convertTimestamp(taskData.dueDate),
        created_at: convertTimestamp(taskData.createdAt),
        updated_at: convertTimestamp(taskData.updatedAt)
      };
      
      // Insert task
      const { data, error } = await supabase
        .from('tasks')
        .upsert(task, { onConflict: 'id' });
      
      if (error) {
        logger.log(`Error migrating task ${doc.id}: ${error.message}`);
      } else {
        logger.log(`Successfully migrated task ${doc.id}`);
      }
    }
    
    logger.log(`Tasks migration for channel ${channelId} complete!`);
  } catch (error) {
    logger.log(`Error during tasks migration for channel ${channelId}: ${error.message}`);
  }
};

// Migrate notifications
const migrateNotifications = async () => {
  logger.log('Starting notification migration...');
  try {
    const notificationsSnapshot = await firestore.collection('notifications').get();
    
    for (const doc of notificationsSnapshot.docs) {
      const notificationData = doc.data();
      
      // Prepare notification data
      const notification = {
        id: doc.id, // Keep the same ID
        user_id: notificationData.userId || null,
        type: notificationData.type || '',
        content: notificationData.content || '',
        is_read: notificationData.isRead || false,
        related_id: notificationData.relatedId || null,
        created_at: convertTimestamp(notificationData.createdAt)
      };
      
      // Insert notification
      const { data, error } = await supabase
        .from('notifications')
        .upsert(notification, { onConflict: 'id' });
      
      if (error) {
        logger.log(`Error migrating notification ${doc.id}: ${error.message}`);
      } else {
        logger.log(`Successfully migrated notification ${doc.id}`);
      }
    }
    
    logger.log('Notification migration complete!');
  } catch (error) {
    logger.log(`Error during notification migration: ${error.message}`);
  }
};

// Migrate students
const migrateStudents = async () => {
  logger.log('Starting student migration...');
  try {
    const studentsSnapshot = await firestore.collection('students').get();
    
    for (const doc of studentsSnapshot.docs) {
      const studentData = doc.data();
      
      // Prepare student data
      const student = {
        id: doc.id, // Keep the same ID
        name: studentData.name || '',
        email: studentData.email || '',
        phone: studentData.phone || '',
        location: studentData.location || '',
        city: studentData.city || '',
        funnel_step: studentData.funnelStep || '',
        interest: studentData.interest || '',
        platform: studentData.platform || '',
        courses: studentData.courses || [],
        notes: studentData.notes || '',
        avatar: studentData.avatar || '',
        avatar_color: studentData.avatarColor || '',
        created_at: convertTimestamp(studentData.createdAt),
        updated_at: convertTimestamp(studentData.updatedAt),
        created_by: studentData.createdBy || null
      };
      
      // Insert student
      const { data, error } = await supabase
        .from('students')
        .upsert(student, { onConflict: 'id' });
      
      if (error) {
        logger.log(`Error migrating student ${doc.id}: ${error.message}`);
      } else {
        logger.log(`Successfully migrated student ${doc.id}`);
      }
    }
    
    logger.log('Student migration complete!');
  } catch (error) {
    logger.log(`Error during student migration: ${error.message}`);
  }
};

// Migrate option collections (funnel steps, course interests, platforms, countries, cities)
const migrateOptionCollections = async () => {
  logger.log('Starting option collections migration...');
  
  // Migrate funnel steps
  try {
    const funnelStepsSnapshot = await firestore.collection('funnelSteps').get();
    for (const doc of funnelStepsSnapshot.docs) {
      const { value } = doc.data();
      const { error } = await supabase
        .from('funnel_steps')
        .upsert({ id: doc.id, value }, { onConflict: 'id' });
      
      if (error) {
        logger.log(`Error migrating funnel step ${doc.id}: ${error.message}`);
      } else {
        logger.log(`Successfully migrated funnel step ${doc.id}`);
      }
    }
  } catch (error) {
    logger.log(`Error during funnel steps migration: ${error.message}`);
  }
  
  // Migrate course interests
  try {
    const courseInterestsSnapshot = await firestore.collection('courseInterests').get();
    for (const doc of courseInterestsSnapshot.docs) {
      const { value } = doc.data();
      const { error } = await supabase
        .from('course_interests')
        .upsert({ id: doc.id, value }, { onConflict: 'id' });
      
      if (error) {
        logger.log(`Error migrating course interest ${doc.id}: ${error.message}`);
      } else {
        logger.log(`Successfully migrated course interest ${doc.id}`);
      }
    }
  } catch (error) {
    logger.log(`Error during course interests migration: ${error.message}`);
  }
  
  // Migrate platforms
  try {
    const platformsSnapshot = await firestore.collection('platforms').get();
    for (const doc of platformsSnapshot.docs) {
      const { value } = doc.data();
      const { error } = await supabase
        .from('platforms')
        .upsert({ id: doc.id, value }, { onConflict: 'id' });
      
      if (error) {
        logger.log(`Error migrating platform ${doc.id}: ${error.message}`);
      } else {
        logger.log(`Successfully migrated platform ${doc.id}`);
      }
    }
  } catch (error) {
    logger.log(`Error during platforms migration: ${error.message}`);
  }
  
  // Migrate countries
  try {
    const countriesSnapshot = await firestore.collection('countries').get();
    for (const doc of countriesSnapshot.docs) {
      const { value } = doc.data();
      const { error } = await supabase
        .from('countries')
        .upsert({ id: doc.id, value }, { onConflict: 'id' });
      
      if (error) {
        logger.log(`Error migrating country ${doc.id}: ${error.message}`);
      } else {
        logger.log(`Successfully migrated country ${doc.id}`);
      }
    }
  } catch (error) {
    logger.log(`Error during countries migration: ${error.message}`);
  }
  
  // Migrate cities
  try {
    const citiesSnapshot = await firestore.collection('cities').get();
    for (const doc of citiesSnapshot.docs) {
      const cityData = doc.data();
      const { error } = await supabase
        .from('cities')
        .upsert({ 
          id: doc.id, 
          value: cityData.value,
          country_id: cityData.countryId || null
        }, { onConflict: 'id' });
      
      if (error) {
        logger.log(`Error migrating city ${doc.id}: ${error.message}`);
      } else {
        logger.log(`Successfully migrated city ${doc.id}`);
      }
    }
  } catch (error) {
    logger.log(`Error during cities migration: ${error.message}`);
  }
  
  logger.log('Option collections migration complete!');
};

// Migrate classes and courses
const migrateClassesAndCourses = async () => {
  logger.log('Starting classes and courses migration...');
  
  // Migrate classes
  try {
    const classesSnapshot = await firestore.collection('classes').get();
    
    for (const doc of classesSnapshot.docs) {
      const classData = doc.data();
      
      // Prepare class data
      const classRecord = {
        id: doc.id, // Keep the same ID
        name: classData.name || '',
        description: classData.description || '',
        level: classData.level || '',
        class_type: classData.classType || '',
        teachers: classData.teachers || [],
        status: classData.status || 'active',
        channel_id: classData.channelId || null,
        created_at: convertTimestamp(classData.createdAt),
        updated_at: convertTimestamp(classData.updatedAt),
        created_by: classData.createdBy || null
      };
      
      // Insert class
      const { data, error } = await supabase
        .from('classes')
        .upsert(classRecord, { onConflict: 'id' });
      
      if (error) {
        logger.log(`Error migrating class ${doc.id}: ${error.message}`);
      } else {
        logger.log(`Successfully migrated class ${doc.id}`);
      }
    }
  } catch (error) {
    logger.log(`Error during classes migration: ${error.message}`);
  }
  
  // Migrate courses
  try {
    const coursesSnapshot = await firestore.collection('courses').get();
    
    for (const doc of coursesSnapshot.docs) {
      const courseData = doc.data();
      
      // Prepare course data
      const course = {
        id: doc.id, // Keep the same ID
        name: courseData.name || '',
        description: courseData.description || '',
        level: courseData.level || '',
        course_type: courseData.courseType || '',
        teachers: courseData.teachers || [],
        status: courseData.status || 'active',
        class_id: courseData.classId || null,
        channel_id: courseData.channelId || null,
        created_at: convertTimestamp(courseData.createdAt),
        updated_at: convertTimestamp(courseData.updatedAt),
        created_by: courseData.createdBy || null
      };
      
      // Insert course
      const { data, error } = await supabase
        .from('courses')
        .upsert(course, { onConflict: 'id' });
      
      if (error) {
        logger.log(`Error migrating course ${doc.id}: ${error.message}`);
      } else {
        logger.log(`Successfully migrated course ${doc.id}`);
      }
    }
  } catch (error) {
    logger.log(`Error during courses migration: ${error.message}`);
  }
  
  logger.log('Classes and courses migration complete!');
};

// Migrate enrollments
const migrateEnrollments = async () => {
  logger.log('Starting enrollments migration...');
  try {
    const enrollmentsSnapshot = await firestore.collection('enrollments').get();
    
    for (const doc of enrollmentsSnapshot.docs) {
      const enrollmentData = doc.data();
      
      // Prepare enrollment data
      const enrollment = {
        id: doc.id, // Keep the same ID
        student_id: enrollmentData.studentId || null,
        course_id: enrollmentData.courseId || null,
        class_id: enrollmentData.classId || null,
        status: enrollmentData.status || 'active',
        payment_status: enrollmentData.paymentStatus || 'pending',
        enrollment_date: convertTimestamp(enrollmentData.enrollmentDate) || convertTimestamp(enrollmentData.createdAt),
        created_at: convertTimestamp(enrollmentData.createdAt),
        updated_at: convertTimestamp(enrollmentData.updatedAt),
        created_by: enrollmentData.createdBy || null
      };
      
      // Insert enrollment
      const { data, error } = await supabase
        .from('enrollments')
        .upsert(enrollment, { onConflict: 'id' });
      
      if (error) {
        logger.log(`Error migrating enrollment ${doc.id}: ${error.message}`);
      } else {
        logger.log(`Successfully migrated enrollment ${doc.id}`);
      }
    }
    
    logger.log('Enrollments migration complete!');
  } catch (error) {
    logger.log(`Error during enrollments migration: ${error.message}`);
  }
};

// Main migration function
const runMigration = async () => {
  logger.log('Starting Firebase to Supabase migration...');
  
  try {
    // Migrate users first (they are referenced by other collections)
    await migrateUsers();
    
    // Migrate option collections
    await migrateOptionCollections();
    
    // Migrate channels and related data
    await migrateChannels();
    
    // Migrate student-related data
    await migrateStudents();
    await migrateClassesAndCourses();
    await migrateEnrollments();
    
    // Migrate notifications
    await migrateNotifications();
    
    logger.log('Migration completed successfully!');
  } catch (error) {
    logger.log(`Error during migration: ${error.message}`);
  } finally {
    logger.close();
  }
};

// Run the migration
runMigration(); 