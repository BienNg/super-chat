import { supabase } from './supabaseClient';

// Function to seed initial accounts data
export const seedAccounts = async () => {
  try {
    // Check if accounts table exists and is empty
    const { error: checkError, count } = await supabase
      .from('accounts')
      .select('id', { count: 'exact', head: true });

    if (checkError) {
      if (checkError.code === '42P01') {
        console.log('Accounts table does not exist. It should be created via migration scripts. Skipping seeding.');
        return;
      } else {
        console.error('Error checking accounts table:', checkError);
        return;
      }
    }

    if (count === 0) {
      console.log('Accounts table exists and is empty. Seeding accounts...');
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
    } else if (count > 0) {
      console.log('Accounts table exists and has data. Skipping seeding.');
    } else {
      console.log('Could not determine account count or table is empty but count is not 0.');
    }
  } catch (error) {
    console.error('Exception in seedAccounts:', error);
  }
};

// Function to seed initial discounts data
export const seedDiscounts = async () => {
  try {
    // Check if discounts table exists and is empty
    const { error: checkError, count } = await supabase
      .from('discounts')
      .select('id', { count: 'exact', head: true });

    if (checkError) {
      if (checkError.code === '42P01') {
        console.log('Discounts table does not exist. It should be created via migration scripts. Skipping seeding.');
        return;
      } else {
        console.error('Error checking discounts table:', checkError);
        return;
      }
    }

    if (count === 0) {
      console.log('Discounts table exists and is empty. Seeding discounts...');
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
    } else if (count > 0) {
      console.log('Discounts table exists and has data. Skipping seeding.');
    } else {
      console.log('Could not determine discount count or table is empty but count is not 0.');
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
    const { data: existingData, error: checkError } = await supabase
      .from('categories')
      .select('id', { count: 'exact', head: true }); // Use head:true for a count

    if (checkError) {
      if (checkError.code === '42P01') {
        console.log('Categories table does not exist. It should be created via migration scripts. Skipping seeding.');
        return false; // Table doesn't exist, migrations should handle it.
      } else {
        // Another error occurred (e.g., RLS, network)
        console.error('Error checking categories table:', checkError);
        return false;
      }
    }

    // Table exists, check if it's empty
    // existingData is null with head:true, but we can check the count from the response
    const { count } = await supabase
      .from('categories')
      .select('id', { count: 'exact', head: true });

    if (count === 0) {
      console.log('Categories table exists and is empty. Seeding initial categories...');
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
    } else if (count > 0) {
      console.log('Categories table exists and has data. Skipping seeding.');
      return false;
    } else {
      // This case should ideally not be reached if count is null or 0
      console.log('Could not determine category count or table is empty but count is not 0.');
      return false;
    }

  } catch (error) {
    console.error('Exception in seedCategories:', error);
    return false;
  }
};

// Function to create the channels table if it doesn't exist
export const seedChannels = async () => {
  try {
    // Check if channels table exists and is empty
    const { error: checkError, count } = await supabase
      .from('channels')
      .select('id', { count: 'exact', head: true });

    if (checkError) {
      if (checkError.code === '42P01') {
        console.log('Channels table does not exist. It should be created via migration scripts. Skipping seeding.');
        return false;
      } else {
        console.error('Error checking channels table:', checkError);
        return false;
      }
    }

    if (count === 0) {
      console.log('Channels table exists and is empty. Seeding initial general channel...');
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
    } else if (count > 0) {
      console.log('Channels table exists and has data. Skipping seeding general channel.');
      return false;
    } else {
      console.log('Could not determine channel count or table is empty but count is not 0.');
      return false;
    }
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