import { supabase } from './supabaseClient';

// Function to seed initial accounts data
export const seedAccounts = async () => {
  try {
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
  } catch (error) {
    console.error('Exception in seedAccounts:', error);
  }
};

// Function to seed initial discounts data
export const seedDiscounts = async () => {
  try {
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
  } catch (error) {
    console.error('Exception in seedDiscounts:', error);
  }
};

// Function to seed course options
export const seedCourseOptions = async () => {
  try {
    // Seed funnel steps
    const funnelSteps = [
      { value: 'Lead' },
      { value: 'Contacted' },
      { value: 'Interested' },
      { value: 'Paid' },
      { value: 'Enrolled' }
    ];
    
    try {
      const { error: funnelError } = await supabase
        .from('funnel_steps')
        .upsert(funnelSteps);
      
      if (funnelError) {
        console.error('Error seeding funnel steps:', funnelError);
      }
    } catch (error) {
      console.log('Could not seed funnel steps, table may not exist yet');
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
    
    try {
      const { error: interestsError } = await supabase
        .from('course_interests')
        .upsert(courseInterests);
      
      if (interestsError) {
        console.error('Error seeding course interests:', interestsError);
      }
    } catch (error) {
      console.log('Could not seed course interests, table may not exist yet');
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
    
    try {
      const { error: platformsError } = await supabase
        .from('platforms')
        .upsert(platforms);
      
      if (platformsError) {
        console.error('Error seeding platforms:', platformsError);
      }
    } catch (error) {
      console.log('Could not seed platforms, table may not exist yet');
    }
  } catch (error) {
    console.error('Exception in seedCourseOptions:', error);
    // Continue anyway, these aren't critical for onboarding
  }
};

// Function to create the categories table if it doesn't exist
export const seedCategories = async () => {
  try {
    // Check if the categories table exists by trying to query it
    const { error: checkError } = await supabase
      .from('categories')
      .select('id')
      .limit(1);
    
    // If we get a specific error about the table not existing, create it
    if (checkError && checkError.code === '42P01') {
      console.log('Categories table does not exist. Attempting to create it...');
      
      // Execute SQL to create the categories table
      // Note: This requires create table permissions which might not be available
      // in the current Supabase project settings
      const { error: createError } = await supabase.rpc('create_categories_table');
      
      if (createError) {
        console.error('Could not create categories table:', createError);
        return false;
      }
      
      console.log('Categories table created successfully!');
      
      // Seed with initial categories
      const initialCategories = [
        { value: 'General' },
        { value: 'Academic' },
        { value: 'Visa' },
        { value: 'Admin' },
        { value: 'Financial' }
      ];
      
      const { error: insertError } = await supabase
        .from('categories')
        .insert(initialCategories);
      
      if (insertError) {
        console.error('Error seeding initial categories:', insertError);
      } else {
        console.log('Initial categories seeded successfully!');
      }
      
      return true;
    }
    
    // If table exists or we got a different error, don't try to create it
    return false;
  } catch (error) {
    console.error('Exception in seedCategories:', error);
    return false;
  }
};

// Function to create the channels table if it doesn't exist
export const seedChannels = async () => {
  try {
    // Check if the channels table exists by trying to query it
    const { error: checkError } = await supabase
      .from('channels')
      .select('id')
      .limit(1);
    
    // If we get a specific error about the table not existing, create it
    if (checkError && checkError.code === '42P01') {
      console.log('Channels table does not exist. Attempting to create it...');
      
      // Execute SQL to create the channels table
      // Note: This requires create table permissions which might not be available
      // in the current Supabase project settings
      const { error: createError } = await supabase.rpc('create_channels_table');
      
      if (createError) {
        console.error('Could not create channels table:', createError);
        return false;
      }
      
      console.log('Channels table created successfully!');
      
      // Seed with initial general channel
      const { error: insertError } = await supabase
        .from('channels')
        .insert({
          name: 'general',
          type: 'general',
          settings: {
            allowMemberInvites: true,
            isPrivate: false,
            notifications: true
          }
        });
      
      if (insertError) {
        console.error('Error seeding initial general channel:', insertError);
      } else {
        console.log('Initial general channel seeded successfully!');
      }
      
      return true;
    }
    
    // If table exists or we got a different error, don't try to create it
    return false;
  } catch (error) {
    console.error('Exception in seedChannels:', error);
    return false;
  }
};

// Main seed function to call all seed functions
export const seedDatabase = async () => {
  try {
    // Try to seed each type of data but don't let failures prevent onboarding
    try {
      await seedAccounts();
    } catch (error) {
      console.error('Failed to seed accounts:', error);
    }
    
    try {
      await seedDiscounts();
    } catch (error) {
      console.error('Failed to seed discounts:', error);
    }
    
    try {
      await seedCourseOptions();
    } catch (error) {
      console.error('Failed to seed course options:', error);
    }
    
    try {
      await seedCategories();
    } catch (error) {
      console.error('Failed to seed categories:', error);
    }
    
    try {
      await seedChannels();
    } catch (error) {
      console.error('Failed to seed channels:', error);
    }
    
    console.log('Database seeding completed');
    return true;
  } catch (error) {
    console.error('Database seeding failed but continuing with onboarding:', error);
    return true; // Return true anyway to allow onboarding to continue
  }
}; 