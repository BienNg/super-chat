import { useEffect, useState, useCallback } from 'react';
import { 
  collection, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy
} from 'firebase/firestore';
import { db } from '../firebase';

/**
 * A reusable hook for managing data from any Firebase collection
 * 
 * @param {string} collectionName - The name of the Firebase collection
 * @param {Object} options - Configuration options
 * @param {string} options.orderByField - Field to order results by (default: 'value')
 * @param {string} options.orderDirection - Direction to order results ('asc' or 'desc', default: 'asc')
 * @param {boolean} options.loadOnMount - Whether to load data on mount (default: true)
 * @returns {Object} Collection data and functions
 */
export function useCollectionData(collectionName, options = {}) {
  const {
    orderByField = 'value',
    orderDirection = 'asc',
    loadOnMount = true
  } = options;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchItems = useCallback(async () => {
    if (!collectionName) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const q = query(
        collection(db, collectionName), 
        orderBy(orderByField, orderDirection)
      );
      
      const snapshot = await getDocs(q);
      const itemsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setItems(itemsData);
    } catch (error) {
      console.error(`Error fetching ${collectionName}:`, error);
      setError(`Failed to fetch ${collectionName}`);
    } finally {
      setLoading(false);
    }
  }, [collectionName, orderByField, orderDirection]);

  useEffect(() => {
    if (loadOnMount) {
      fetchItems();
    }
  }, [fetchItems, loadOnMount]);

  const addItem = async (value) => {
    if (!collectionName) return null;
    
    try {
      const trimmedValue = typeof value === 'string' ? value.trim() : value;
      
      // For string values, check if it already exists
      if (typeof trimmedValue === 'string') {
        const exists = items.some(existingItem => 
          existingItem.value && existingItem.value.toLowerCase() === trimmedValue.toLowerCase()
        );
        
        if (exists) {
          throw new Error(`"${trimmedValue}" already exists in ${collectionName}`);
        }
      }
      
      // For string values, use simple { value: string } structure
      // For object values, use the object directly
      const docData = typeof trimmedValue === 'string' 
        ? { value: trimmedValue } 
        : trimmedValue;
      
      const docRef = await addDoc(collection(db, collectionName), docData);
      
      // Add to local state immediately
      const newItem = { id: docRef.id, ...docData };
      setItems(prev => [...prev, newItem]);
      
      return newItem;
    } catch (error) {
      console.error(`Error adding to ${collectionName}:`, error);
      throw error;
    }
  };

  const deleteItem = async (id) => {
    if (!collectionName || !id) return;
    
    try {
      await deleteDoc(doc(db, collectionName, id));
      setItems(prev => prev.filter(item => item.id !== id));
      return { success: true, id };
    } catch (error) {
      console.error(`Error deleting from ${collectionName}:`, error);
      throw error;
    }
  };

  const getItemValues = useCallback(() => {
    // If items have a 'value' property, return just the values
    if (items.length > 0 && 'value' in items[0]) {
      return items.map(item => item.value);
    }
    // Otherwise return the full items
    return items;
  }, [items]);
  
  return {
    [collectionName]: items,  // Return the raw items with full data
    [`${collectionName}Values`]: getItemValues(),  // Return just the values if applicable
    loading,
    error,
    [`add${collectionName.charAt(0).toUpperCase() + collectionName.slice(1, -1)}`]: addItem,  // e.g. "addCountry" for "countries"
    [`delete${collectionName.charAt(0).toUpperCase() + collectionName.slice(1, -1)}`]: deleteItem,  // e.g. "deleteCountry"
    refetch: fetchItems
  };
}

export default useCollectionData; 