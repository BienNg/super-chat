import { useEffect, useState, useCallback } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

export function useTypes() {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTypes = useCallback(async () => {
    setLoading(true);
    const snapshot = await getDocs(collection(db, 'classTypes'));
    setTypes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    setLoading(false);
  }, []);

  useEffect(() => { fetchTypes(); }, [fetchTypes]);

  const addType = async (type) => {
    // Check for duplicates (case-insensitive)
    const trimmedType = type.trim();
    const exists = types.some(existingType => 
      existingType.value.toLowerCase() === trimmedType.toLowerCase()
    );
    
    if (exists) {
      throw new Error(`Type "${trimmedType}" already exists`);
    }
    
    await addDoc(collection(db, 'classTypes'), { value: trimmedType });
    fetchTypes();
  };

  const deleteType = async (id) => {
    await deleteDoc(doc(db, 'classTypes', id));
    fetchTypes();
  };

  return { types, loading, addType, deleteType };
} 