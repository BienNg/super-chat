import { supabase } from './supabaseClient';

// Student services
export const studentServices = {
  // Get all students
  getStudents: async () => {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching students:', error);
      throw error;
    }
    
    return data;
  },

  // Get student by ID
  getStudentById: async (studentId) => {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single();
    
    if (error) {
      console.error('Error fetching student by ID:', error);
      throw error;
    }
    
    if (!data) {
      throw new Error('Student not found');
    }
    
    return data;
  },

  // Add a new student
  addStudent: async (studentData) => {
    const now = new Date().toISOString();
    const newStudentData = {
      ...studentData,
      created_at: now,
      updated_at: now
    };
    
    const { data, error } = await supabase
      .from('students')
      .insert([newStudentData])
      .select();
    
    if (error) {
      console.error('Error adding student:', error);
      throw error;
    }
    
    return data[0].id;
  },

  // Update a student
  updateStudent: async (studentId, updates) => {
    const now = new Date().toISOString();
    const updatedData = {
      ...updates,
      updated_at: now
    };
    
    const { error } = await supabase
      .from('students')
      .update(updatedData)
      .eq('id', studentId);
    
    if (error) {
      console.error('Error updating student:', error);
      throw error;
    }
    
    return true;
  },

  // Delete a student
  deleteStudent: async (studentId) => {
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', studentId);
    
    if (error) {
      console.error('Error deleting student:', error);
      throw error;
    }
    
    return true;
  }
};

// Generic collection services
export const collectionServices = {
  // Get all items from a collection
  getCollection: async (tableName, orderByField = 'created_at') => {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .order(orderByField, { ascending: false });
    
    if (error) {
      console.error(`Error fetching collection ${tableName}:`, error);
      throw error;
    }
    
    return data;
  },

  // Add item to collection
  addToCollection: async (tableName, itemData) => {
    const now = new Date().toISOString();
    const newItemData = {
      ...itemData,
      created_at: now
    };
    
    const { data, error } = await supabase
      .from(tableName)
      .insert([newItemData])
      .select();
    
    if (error) {
      console.error(`Error adding to collection ${tableName}:`, error);
      throw error;
    }
    
    return data[0].id;
  },

  // Update item in collection
  updateInCollection: async (tableName, itemId, updates) => {
    const now = new Date().toISOString();
    const updatedData = {
      ...updates,
      updated_at: now
    };
    
    const { error } = await supabase
      .from(tableName)
      .update(updatedData)
      .eq('id', itemId);
    
    if (error) {
      console.error(`Error updating in collection ${tableName}:`, error);
      throw error;
    }
    
    return true;
  },

  // Delete item from collection
  deleteFromCollection: async (tableName, itemId) => {
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', itemId);
    
    if (error) {
      console.error(`Error deleting from collection ${tableName}:`, error);
      throw error;
    }
    
    return true;
  }
}; 