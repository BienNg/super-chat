import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../utils/supabaseClient';

export function useStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (fetchError) {
        throw fetchError;
      }
      
      setStudents(data);
    } catch (err) {
      console.error('Error fetching students:', err);
      setError('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const addStudent = async (studentData) => {
    try {
      setError(null);
      
      // Check for duplicate email if provided
      if (studentData.email) {
        const existingStudent = students.find(
          student => student.email?.toLowerCase() === studentData.email.toLowerCase()
        );
        if (existingStudent) {
          // Don't set global error state for validation errors
          const validationError = new Error('A student with this email already exists');
          validationError.isValidationError = true;
          throw validationError;
        }
      }
      
      // Prepare student data with timestamps
      const now = new Date().toISOString();
      const newStudentData = {
        ...studentData,
        created_at: now,
        updated_at: now
      };
      
      const { data, error: insertError } = await supabase
        .from('students')
        .insert([newStudentData])
        .select();
      
      if (insertError) {
        throw insertError;
      }
      
      // Add the new student to local state immediately for better UX
      const newStudent = data[0];
      setStudents(prev => [newStudent, ...prev]);
      
      return newStudent.id;
    } catch (err) {
      // Only set global error state for non-validation errors
      if (!err.isValidationError) {
        console.error('Error adding student:', err);
        setError(err.message || 'Failed to add student');
      }
      throw err;
    }
  };

  const updateStudent = async (studentId, updates) => {
    try {
      setError(null);
      
      const now = new Date().toISOString();
      const updatedData = {
        ...updates,
        updated_at: now
      };
      
      const { error: updateError } = await supabase
        .from('students')
        .update(updatedData)
        .eq('id', studentId);
      
      if (updateError) {
        throw updateError;
      }
      
      // Update local state
      setStudents(prev => prev.map(student => 
        student.id === studentId 
          ? { ...student, ...updates, updated_at: now }
          : student
      ));
    } catch (err) {
      console.error('Error updating student:', err);
      setError('Failed to update student');
      throw err;
    }
  };

  const deleteStudent = async (studentId) => {
    try {
      setError(null);
      
      const { error: deleteError } = await supabase
        .from('students')
        .delete()
        .eq('id', studentId);
      
      if (deleteError) {
        throw deleteError;
      }
      
      // Remove from local state
      setStudents(prev => prev.filter(student => student.id !== studentId));
    } catch (err) {
      console.error('Error deleting student:', err);
      setError('Failed to delete student');
      throw err;
    }
  };

  // Get student by ID
  const getStudentById = useCallback(async (studentId) => {
    try {
      // First check if student is in local state
      const localStudent = students.find(student => student.id === studentId);
      if (localStudent) {
        return localStudent;
      }

      // If not in local state, fetch from database
      const { data, error: fetchError } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single();
      
      if (fetchError) {
        throw fetchError;
      }
      
      if (!data) {
        throw new Error('Student not found');
      }
      
      return data;
    } catch (err) {
      console.error('Error getting student by ID:', err);
      throw err;
    }
  }, [students]);

  return {
    students,
    loading,
    error,
    addStudent,
    updateStudent,
    deleteStudent,
    getStudentById,
    refetch: fetchStudents
  };
} 