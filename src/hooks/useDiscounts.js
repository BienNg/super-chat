import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';
import { db } from '../firebase';

export const useDiscounts = () => {
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const discountsRef = collection(db, 'discounts');
    const q = query(discountsRef, orderBy('name', 'asc'));

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const discountsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setDiscounts(discountsData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching discounts:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const addDiscount = async (discountData) => {
    try {
      const docRef = await addDoc(collection(db, 'discounts'), {
        ...discountData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      // Return the new discount with its ID
      return {
        id: docRef.id,
        ...discountData
      };
    } catch (err) {
      console.error('Error adding discount:', err);
      throw err;
    }
  };

  const updateDiscount = async (discountId, updates) => {
    try {
      const discountRef = doc(db, 'discounts', discountId);
      await updateDoc(discountRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error('Error updating discount:', err);
      throw err;
    }
  };

  const deleteDiscount = async (discountId) => {
    try {
      await deleteDoc(doc(db, 'discounts', discountId));
    } catch (err) {
      console.error('Error deleting discount:', err);
      throw err;
    }
  };

  return {
    discounts,
    loading,
    error,
    addDiscount,
    updateDiscount,
    deleteDiscount
  };
}; 