import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { logFirebaseRead, logFirebaseWrite } from './comprehensiveFirebaseTracker';

const defaultAccounts = [
  {
    name: 'Bank Transfer',
    type: 'bank_transfer',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    name: 'Cash',
    type: 'cash',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    name: 'Credit Card',
    type: 'credit_card',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    name: 'PayPal',
    type: 'paypal',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    name: 'Stripe',
    type: 'payment_method',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const seedAccounts = async () => {
  try {
    // Check if accounts already exist
    const accountsRef = collection(db, 'accounts');
    const snapshot = await getDocs(accountsRef);
    
    // Log the Firebase read operation
    logFirebaseRead('accounts', snapshot.size, 'Check if accounts collection needs seeding');
    
    if (snapshot.empty) {
      console.log('Seeding accounts collection...');
      
      for (const account of defaultAccounts) {
        await addDoc(accountsRef, account);
        
        // Log the Firebase write operation
        logFirebaseWrite('accounts', `Seeded account: ${account.name}`);
        
        console.log(`Added account: ${account.name}`);
      }
      
      console.log('Accounts seeded successfully!');
    } else {
      console.log('Accounts collection already has data, skipping seed.');
    }
  } catch (error) {
    console.error('Error seeding accounts:', error);
  }
};

// Run the seed function if this file is executed directly
if (typeof window !== 'undefined') {
  // Only run in browser environment
  window.seedAccounts = seedAccounts;
} 