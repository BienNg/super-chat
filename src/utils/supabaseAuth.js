import { supabase } from './supabaseClient';

export const supabaseAuth = {
  // User Management
  getCurrentUser: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },
  
  signInWithEmail: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    return { data, error };
  },
  
  signUpWithEmail: async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // For auto-confirmation, you can set this to true if you don't want email verification
        emailRedirectTo: window.location.origin,
        data: {
          // You can add custom metadata to the user here
          email_confirmed: false
        }
      }
    });
    
    // For successful signups, try to auto-create a profile
    if (!error && data?.user) {
      try {
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: data.user.id,
            display_name: email.split('@')[0],
            email: email,
            roles: [],
            is_onboarding_complete: false,
            created_at: new Date().toISOString()
          });
          
        if (profileError) {
          console.error("Error creating profile during signup:", profileError);
        }
      } catch (profileError) {
        console.error("Exception creating profile during signup:", profileError);
      }
    }
    
    return { data, error };
  },
  
  signInWithGoogle: async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    
    return { data, error };
  },
  
  logout: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },
  
  // Auth state change listener (for use with onAuthStateChanged equivalent)
  onAuthStateChange: (callback) => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state change:", event, session?.user?.id);
      callback(session?.user || null);
    });
    
    // Return unsubscribe function
    return data.subscription.unsubscribe;
  }
}; 