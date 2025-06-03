import { supabase } from './supabaseClient';

// Function to seed initial accounts data
export const seedAccounts = async () => {
  // Check if accounts already exist
  const { data: existingAccounts, error: checkError } = await supabase
    .from('accounts')
    .select('id')
    .limit(1);
  
  if (checkError) {
    console.error('Error checking accounts:', checkError);
    return;
  }
  
  // If accounts exist, don't seed
  if (existingAccounts && existingAccounts.length > 0) {
    return;
  }
  
  console.log('Seeding accounts...');
  
  // Sample accounts data
  const accountsData = [
    {
      name: 'Cash',
      type: 'asset',
      currency: 'USD',
      is_default: true,
      balance: 0
    },
    {
      name: 'Bank Account',
      type: 'asset',
      currency: 'USD',
      is_default: false,
      balance: 0
    }
  ];
  
  // Insert accounts data
  const { error: insertError } = await supabase
    .from('accounts')
    .insert(accountsData);
  
  if (insertError) {
    console.error('Error seeding accounts:', insertError);
  } else {
    console.log('Accounts seeded successfully!');
  }
};

// Function to seed initial discounts data
export const seedDiscounts = async () => {
  // Check if discounts already exist
  const { data: existingDiscounts, error: checkError } = await supabase
    .from('discounts')
    .select('id')
    .limit(1);
  
  if (checkError) {
    console.error('Error checking discounts:', checkError);
    return;
  }
  
  // If discounts exist, don't seed
  if (existingDiscounts && existingDiscounts.length > 0) {
    return;
  }
  
  console.log('Seeding discounts...');
  
  // Sample discounts data
  const discountsData = [
    {
      name: 'Early Bird',
      type: 'percentage',
      value: 10,
      is_active: true
    },
    {
      name: 'Student',
      type: 'percentage',
      value: 15,
      is_active: true
    },
    {
      name: 'Referral',
      type: 'fixed',
      value: 50,
      is_active: true
    }
  ];
  
  // Insert discounts data
  const { error: insertError } = await supabase
    .from('discounts')
    .insert(discountsData);
  
  if (insertError) {
    console.error('Error seeding discounts:', insertError);
  } else {
    console.log('Discounts seeded successfully!');
  }
};

// Function to seed course options
export const seedCourseOptions = async () => {
  // Seed funnel steps
  const funnelSteps = [
    { value: 'Lead' },
    { value: 'Contacted' },
    { value: 'Interested' },
    { value: 'Paid' },
    { value: 'Enrolled' }
  ];
  
  const { error: funnelError } = await supabase
    .from('funnel_steps')
    .upsert(funnelSteps, { onConflict: ['value'] });
  
  if (funnelError) {
    console.error('Error seeding funnel steps:', funnelError);
  }
  
  // Seed course interests
  const courseInterests = [
    { value: 'A1.1 Online' },
    { value: 'A1.2 Online' },
    { value: 'A2.1 Online' },
    { value: 'A2.2 Online' },
    { value: 'B1.1 Online' },
    { value: 'B1.2 Online' },
    { value: 'B2.1 Online' },
    { value: 'B2.2 Online' },
    { value: 'C1.1 Online' },
    { value: 'A1.1 Offline' },
    { value: 'A1.2 Offline' },
    { value: 'A2.1 Offline' },
    { value: 'A2.2 Offline' },
    { value: 'B1.1 Offline' },
    { value: 'B1.2 Offline' },
    { value: 'B2.1 Offline' },
    { value: 'B2.2 Offline' },
    { value: 'C1.1 Offline' }
  ];
  
  const { error: interestsError } = await supabase
    .from('course_interests')
    .upsert(courseInterests, { onConflict: ['value'] });
  
  if (interestsError) {
    console.error('Error seeding course interests:', interestsError);
  }
  
  // Seed platforms
  const platforms = [
    { value: 'Facebook' },
    { value: 'Instagram' },
    { value: 'WhatsApp' },
    { value: 'Zalo' },
    { value: 'Website' },
    { value: 'Referral' },
    { value: 'LinkedIn' },
    { value: 'TikTok' }
  ];
  
  const { error: platformsError } = await supabase
    .from('platforms')
    .upsert(platforms, { onConflict: ['value'] });
  
  if (platformsError) {
    console.error('Error seeding platforms:', platformsError);
  }
};

// Main seed function to call all seed functions
export const seedDatabase = async () => {
  await seedAccounts();
  await seedDiscounts();
  await seedCourseOptions();
}; 