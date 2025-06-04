// This file exists for compatibility with old code that imports from firebase.js
// All firebase functionality has been migrated to Supabase

import { supabase } from './utils/supabaseClient';

// Mock db object that will be used by legacy code
export const db = {
  // This is a compatibility layer that will log warnings
  // and redirect operations to Supabase
  
  // Add any methods needed for backward compatibility here
  collection: (collectionName) => {
    console.warn(`Legacy Firebase code is trying to access collection: ${collectionName}`);
    console.warn('Please update this code to use supabaseDb from "./utils/supabaseDb" instead');
    return {
      // Add methods needed for compatibility
    };
  }
};

// Log a warning when this file is imported
console.warn('Using deprecated Firebase import. Please update to use Supabase.'); 