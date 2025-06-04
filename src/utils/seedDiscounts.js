import { supabase } from './supabaseClient';

const defaultDiscounts = [
  {
    name: 'Student Discount',
    type: 'percentage',
    value: 10,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    name: 'Early Bird',
    type: 'percentage',
    value: 15,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    name: 'Loyalty Discount',
    type: 'percentage',
    value: 20,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    name: 'Group Discount',
    type: 'percentage',
    value: 25,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    name: 'Seasonal Promotion',
    type: 'fixed_amount',
    value: 50,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export const seedDiscounts = async () => {
  try {
    // Check if discounts already exist
    const { data, error, count } = await supabase
      .from('discounts')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('Error checking discounts table:', error);
      return;
    }
    
    console.log(`Checking discounts table, found ${count} records`);
    
    if (count === 0) {
      console.log('Seeding discounts table...');
      
      const { error: insertError } = await supabase
        .from('discounts')
        .insert(defaultDiscounts);
      
      if (insertError) {
        console.error('Error seeding discounts:', insertError);
        return;
      }
      
      console.log('Discounts seeded successfully!');
    } else {
      console.log('Discounts table already has data, skipping seed.');
    }
  } catch (error) {
    console.error('Error seeding discounts:', error);
  }
};

// Run the seed function if this file is executed directly
if (typeof window !== 'undefined') {
  // Only run in browser environment
  window.seedDiscounts = seedDiscounts;
} 