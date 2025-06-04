import { 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  addDoc, 
  query, 
  collection,
  onSnapshot
} from 'firebase/firestore';

// Global reference to logger function - DISABLED for new comprehensive tracker
let loggerRef = null;

export const setFirebaseLogger = (loggerFunctions) => {
  // Disabled - using comprehensive tracker instead
  console.log('Old Firebase logger disabled - using comprehensive tracker');
  loggerRef = null;
};

// Store original Firebase functions
const originalFirebaseFunctions = {
  getDoc: getDoc,
  getDocs: getDocs,
  setDoc: setDoc,
  updateDoc: updateDoc,
  deleteDoc: deleteDoc,
  addDoc: addDoc,
  onSnapshot: onSnapshot
};

// Helper to extract collection name from various reference types
const getCollectionName = (ref) => {
  if (ref?.path) {
    // For document references, extract collection name
    const pathParts = ref.path.split('/');
    return pathParts[0];
  }
  if (ref?._query?.path?.segments) {
    // For query references
    return ref._query.path.segments[0];
  }
  if (ref?._path?.segments) {
    // For collection references
    return ref._path.segments[0];
  }
  return 'unknown';
};

// Helper to extract document ID
const getDocumentId = (ref) => {
  if (ref?.path) {
    const pathParts = ref.path.split('/');
    return pathParts[1] || null;
  }
  return null;
};

// DISABLED - Monkey patch Firebase functions to include logging
export const enableFirebaseLogging = () => {
  console.log('Old Firebase logging disabled - using comprehensive tracker instead');
  // All the monkey patching code is disabled
  return;
};

// DISABLED - Restore original Firebase functions
export const disableFirebaseLogging = () => {
  console.log('Old Firebase logging already disabled');
  return;
};

// DISABLED - All logging wrapper functions
export const getDocWithLogging = async (docRef) => {
  return originalFirebaseFunctions.getDoc(docRef);
};

export const getDocsWithLogging = async (queryRef) => {
  return originalFirebaseFunctions.getDocs(queryRef);
};

export const setDocWithLogging = async (docRef, data, options) => {
  return originalFirebaseFunctions.setDoc(docRef, data, options);
};

export const updateDocWithLogging = async (docRef, data) => {
  return originalFirebaseFunctions.updateDoc(docRef, data);
};

export const deleteDocWithLogging = async (docRef) => {
  return originalFirebaseFunctions.deleteDoc(docRef);
};

export const addDocWithLogging = async (collectionRef, data) => {
  return originalFirebaseFunctions.addDoc(collectionRef, data);
};

export const onSnapshotWithLogging = (queryRef, callback, errorCallback) => {
  return originalFirebaseFunctions.onSnapshot(queryRef, callback, errorCallback);
};

// DISABLED - Hook wrapper
export const wrapFirebaseHook = (hookFunction) => {
  return hookFunction;
}; 