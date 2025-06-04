import { 
  collection, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  updateDoc, 
  doc, 
  query, 
  orderBy,
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { db } from '../firebase';

// Student services
export const studentServices = {
  // Get all students
  getStudents: async () => {
    const q = query(collection(db, 'students'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date()
    }));
  },

  // Get student by ID
  getStudentById: async (studentId) => {
    const docRef = doc(db, 'students', studentId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate?.() || new Date()
      };
    } else {
      throw new Error('Student not found');
    }
  },

  // Add a new student
  addStudent: async (studentData) => {
    const docRef = await addDoc(collection(db, 'students'), {
      ...studentData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  },

  // Update a student
  updateStudent: async (studentId, updates) => {
    await updateDoc(doc(db, 'students', studentId), {
      ...updates,
      updatedAt: serverTimestamp()
    });
    return true;
  },

  // Delete a student
  deleteStudent: async (studentId) => {
    await deleteDoc(doc(db, 'students', studentId));
    return true;
  }
};

// Generic collection services
export const collectionServices = {
  // Get all items from a collection
  getCollection: async (collectionName, orderByField = 'createdAt') => {
    const q = orderByField 
      ? query(collection(db, collectionName), orderBy(orderByField, 'desc')) 
      : collection(db, collectionName);
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  },

  // Add item to collection
  addToCollection: async (collectionName, data) => {
    const docRef = await addDoc(collection(db, collectionName), {
      ...data,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  },

  // Update item in collection
  updateInCollection: async (collectionName, itemId, updates) => {
    await updateDoc(doc(db, collectionName, itemId), {
      ...updates,
      updatedAt: serverTimestamp()
    });
    return true;
  },

  // Delete item from collection
  deleteFromCollection: async (collectionName, itemId) => {
    await deleteDoc(doc(db, collectionName, itemId));
    return true;
  }
}; 