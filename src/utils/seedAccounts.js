import { supabase } from './supabaseClient';

const defaultAccounts = [
  {
    name: 'Bank Transfer',
    type: 'bank_transfer',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    name: 'Cash',
    type: 'cash',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    name: 'Credit Card',
    type: 'credit_card',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    name: 'PayPal',
    type: 'paypal',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    name: 'Stripe',
    type: 'payment_method',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export const seedAccounts = async () => {
  try {
    // Check if accounts already exist
    const { data, error, count } = await supabase
      .from('accounts')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('Error checking accounts table:', error);
      return;
    }
    
    console.log(`Checking accounts table, found ${count} records`);
    
    if (count === 0) {
      console.log('Seeding accounts table...');
      
      const { error: insertError } = await supabase
        .from('accounts')
        .insert(defaultAccounts);
      
      if (insertError) {
        console.error('Error seeding accounts:', insertError);
        return;
      }
      
      console.log('Accounts seeded successfully!');
    } else {
      console.log('Accounts table already has data, skipping seed.');
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