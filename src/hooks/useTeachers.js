import { useEffect, useState, useCallback } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

export function useTeachers() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTeachers = useCallback(async () => {
    setLoading(true);
    const snapshot = await getDocs(collection(db, 'teachers'));
    setTeachers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    setLoading(false);
  }, []);

  useEffect(() => { fetchTeachers(); }, [fetchTeachers]);

  const addTeacher = async (teacher) => {
    // Check for duplicates (case-insensitive)
    const trimmedTeacher = teacher.trim();
    const exists = teachers.some(existingTeacher => 
      existingTeacher.value.toLowerCase() === trimmedTeacher.toLowerCase()
    );
    
    if (exists) {
      throw new Error(`Teacher "${trimmedTeacher}" already exists`);
    }
    
    await addDoc(collection(db, 'teachers'), { value: trimmedTeacher });
    fetchTeachers();
  };

  const deleteTeacher = async (id) => {
    await deleteDoc(doc(db, 'teachers', id));
    fetchTeachers();
  };

  return { teachers, loading, addTeacher, deleteTeacher };
} 