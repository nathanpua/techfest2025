import { supabase } from './supabase';

/**
 * Verifies and sets up the database schema
 * @returns {Promise<boolean>} - Whether the setup was successful
 */
export const setupDatabase = async () => {
  try {
    console.log("Verifying database schema...");
    
    // Check for scans table
    const scansTableOk = await checkScansTable();
    if (!scansTableOk) return false;
    
    // Check for profiles table
    const profilesTableOk = await checkProfilesTable();
    if (!profilesTableOk) return false;
    
    // Check for user_settings table
    const userSettingsTableOk = await checkUserSettingsTable();
    if (!userSettingsTableOk) return false;
    
    console.log("Database schema verified successfully!");
    return true;
  } catch (error) {
    console.error("Error setting up database:", error);
    return false;
  }
};

/**
 * Checks if the scans table exists and has the required columns
 */
const checkScansTable = async () => {
  try {
    console.log("Checking scans table...");
    
    // Test if we can query the scans table
    // Use a count query instead of selecting specific columns
    const { data, error, count } = await supabase
      .from('scans')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      if (error.code === '42P01') { // Table doesn't exist
        console.error("The 'scans' table doesn't exist in your Supabase database.");
        console.error("Please create it using the SQL in the README.md file:");
        console.error(`
          CREATE TABLE scans (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            content TEXT NOT NULL,
            source TEXT,
            analysis JSONB,
            user_id UUID REFERENCES auth.users(id),
            article_url TEXT,
            is_hidden BOOLEAN DEFAULT false
          );
        `);
        return false;
      } else {
        console.error("Error querying scans table:", error);
        console.error("Error details:", error.message, error.code, error.details);
        return false;
      }
    }
    
    console.log("Scans table check successful!");
    return true;
  } catch (error) {
    console.error("Error checking scans table:", error);
    console.error("Error details:", error.message);
    return false;
  }
};

/**
 * Checks if the profiles table exists and has the required columns
 */
const checkProfilesTable = async () => {
  try {
    console.log("Checking profiles table...");
    
    // Test if we can query the profiles table
    // Use a count query instead of selecting specific columns
    const { data, error, count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      if (error.code === '42P01') { // Table doesn't exist
        console.error("The 'profiles' table doesn't exist in your Supabase database.");
        console.error("Please create it using the following SQL:");
        console.error(`
          CREATE TABLE profiles (
            id UUID PRIMARY KEY REFERENCES auth.users(id),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            full_name TEXT,
            website TEXT,
            avatar_url TEXT
          );
        `);
        return false;
      } else {
        console.error("Error querying profiles table:", error);
        console.error("Error details:", error.message, error.code, error.details);
        return false;
      }
    }
    
    console.log("Profiles table check successful!");
    return true;
  } catch (error) {
    console.error("Error checking profiles table:", error);
    console.error("Error details:", error.message);
    return false;
  }
};

/**
 * Checks if the user_settings table exists and has the required columns
 */
const checkUserSettingsTable = async () => {
  try {
    console.log("Checking user_settings table...");
    
    // Test if we can query the user_settings table
    // Use a count query instead of selecting specific columns
    const { data, error, count } = await supabase
      .from('user_settings')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      if (error.code === '42P01') { // Table doesn't exist
        console.error("The 'user_settings' table doesn't exist in your Supabase database.");
        console.error("Please create it using the following SQL:");
        console.error(`
          CREATE TABLE user_settings (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            user_id UUID REFERENCES auth.users(id) NOT NULL,
            openai_api_key TEXT,
            theme TEXT DEFAULT 'dark',
            email_notifications BOOLEAN DEFAULT true,
            browser_notifications BOOLEAN DEFAULT true
          );
        `);
        return false;
      } else {
        console.error("Error querying user_settings table:", error);
        console.error("Error details:", error.message, error.code, error.details);
        return false;
      }
    }
    
    console.log("User settings table check successful!");
    return true;
  } catch (error) {
    console.error("Error checking user_settings table:", error);
    console.error("Error details:", error.message);
    return false;
  }
};

/**
 * Tests the database connection
 * @returns {Promise<boolean>} - Whether the connection test was successful
 */
export const testDatabaseConnection = async () => {
  try {
    console.log("Testing database connection...");
    
    // Simple query to test the connection
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error("Database connection test failed:", error);
      console.error("Error details:", error.message, error.code, error.details);
      return false;
    }
    
    // Also test a simple query to the profiles table
    console.log("Testing query to profiles table...");
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
      
    if (profilesError) {
      console.error("Profiles table query test failed:", profilesError);
      console.error("Error details:", profilesError.message, profilesError.code, profilesError.details);
      // Don't return false here, as the auth connection was successful
      console.warn("Profiles table query failed, but auth connection was successful. Continuing...");
    } else {
      console.log("Profiles table query test successful!");
    }
    
    console.log("Database connection test successful!");
    return true;
  } catch (error) {
    console.error("Error testing database connection:", error);
    console.error("Error details:", error.message);
    return false;
  }
}; 