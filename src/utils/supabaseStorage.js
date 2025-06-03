import { supabase } from './supabaseClient';

export const supabaseStorage = {
  // Upload a file to storage
  uploadFile: async (bucket, filePath, file, options = {}) => {
    const { data, error } = await supabase
      .storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        ...options
      });
    
    if (error) throw error;
    
    // Return the public URL
    const { data: urlData } = supabase
      .storage
      .from(bucket)
      .getPublicUrl(filePath);
    
    return urlData.publicUrl;
  },
  
  // Get a file from storage
  getFileUrl: (bucket, filePath) => {
    const { data } = supabase
      .storage
      .from(bucket)
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  },
  
  // Delete a file from storage
  deleteFile: async (bucket, filePath) => {
    const { error } = await supabase
      .storage
      .from(bucket)
      .remove([filePath]);
    
    if (error) throw error;
    return true;
  },
  
  // List all files in a directory
  listFiles: async (bucket, directory) => {
    const { data, error } = await supabase
      .storage
      .from(bucket)
      .list(directory);
    
    if (error) throw error;
    return data;
  }
}; 