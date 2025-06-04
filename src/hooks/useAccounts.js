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

export const useAccounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const accountsRef = collection(db, 'accounts');
    const q = query(accountsRef, orderBy('name', 'asc'));

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const accountsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setAccounts(accountsData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching accounts:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const addAccount = async (accountData) => {
    try {
      const docRef = await addDoc(collection(db, 'accounts'), {
        ...accountData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      // Return the new account with its ID
      return {
        id: docRef.id,
        ...accountData
      };
    } catch (err) {
      console.error('Error adding account:', err);
      throw err;
    }
  };

  const updateAccount = async (accountId, updates) => {
    try {
      const accountRef = doc(db, 'accounts', accountId);
      await updateDoc(accountRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error('Error updating account:', err);
      throw err;
    }
  };

  const deleteAccount = async (accountId) => {
    try {
      await deleteDoc(doc(db, 'accounts', accountId));
    } catch (err) {
      console.error('Error deleting account:', err);
      throw err;
    }
  };

  return {
    accounts,
    loading,
    error,
    addAccount,
    updateAccount,
    deleteAccount
  };
}; 