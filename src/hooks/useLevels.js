import { useEffect, useState, useCallback } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

export function useLevels() {
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLevels = useCallback(async () => {
    setLoading(true);
    const snapshot = await getDocs(collection(db, 'classLevels'));
    setLevels(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    setLoading(false);
  }, []);

  useEffect(() => { fetchLevels(); }, [fetchLevels]);

  const addLevel = async (level) => {
    // Check for duplicates (case-insensitive)
    const trimmedLevel = level.trim();
    const exists = levels.some(existingLevel => 
      existingLevel.value.toLowerCase() === trimmedLevel.toLowerCase()
    );
    
    if (exists) {
      throw new Error(`Level "${trimmedLevel}" already exists`);
    }
    
    await addDoc(collection(db, 'classLevels'), { value: trimmedLevel });
    fetchLevels();
  };

  const deleteLevel = async (id) => {
    await deleteDoc(doc(db, 'classLevels', id));
    fetchLevels();
  };

  return { levels, loading, addLevel, deleteLevel };
} 