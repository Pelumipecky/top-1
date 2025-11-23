import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { readFileSync } from 'fs';

// Load environment variables from .env.local
config({ path: '.env.local' });

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env.local file.');
  process.exit(1);
}

if (!supabaseServiceKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY. Please add it to your .env.local file.');
  console.error('You can find this key in your Supabase project settings under API.');
  process.exit(1);
}

// Initialize Supabase clients
const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Authentication functions
const supabaseAuth = {
  signUp: async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { data, error };
  }
};

// Database functions
const supabaseDb = {
  getAdminUser: async () => {
    const { data, error } = await supabase
      .from('userlogs')
      .select('*')
      .eq('admin', true)
      .single();
    return { data, error };
  },

  createUser: async (userData) => {
    const { data, error } = await supabase
      .from('userlogs')
      .insert([userData])
      .select()
      .single();
    return { data, error };
  }
};

async function createSupabaseAdmin() {
  const adminEmail = "admin@topmint.com";
  const adminPassword = "TopMint@123";

  try {
    console.log("Starting Supabase admin setup...");

    // Check if admin already exists in userlogs
    console.log("Checking for existing admin in database...");
    const { data: existingAdmin, error: checkError } = await supabaseDb.getAdminUser();

    if (!checkError && existingAdmin) {
      console.log("Admin already exists in database!");
      console.log("Email:", existingAdmin.email);
      console.log("ID:", existingAdmin.id);
      return;
    }

    // Check if auth user exists and confirm email if needed
    console.log("Checking auth user status...");
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();

    if (!authError) {
      const existingAuthUser = authUsers.users.find(user => user.email === adminEmail);
      if (existingAuthUser && !existingAuthUser.email_confirmed_at) {
        console.log("Confirming existing auth user's email...");
        await supabaseAdmin.auth.admin.updateUserById(existingAuthUser.id, {
          email_confirm: true
        });
        console.log("Email confirmed for existing user!");
      } else if (!existingAuthUser) {
        console.log("Creating new auth account with confirmed email...");
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: adminEmail,
          password: adminPassword,
          email_confirm: true, // Auto-confirm email for admin
          user_metadata: {
            name: "Admin",
            admin: true
          }
        });

        if (authError) {
          console.error("Auth creation error:", authError);
          throw authError;
        }
        console.log("Authentication account created and email confirmed!");
      } else {
        console.log("Auth account already exists and is confirmed!");
      }
    }

    // Create admin document in Supabase database
    console.log("Creating admin document in database...");
    const adminDoc = {
      name: "Admin",
      email: adminEmail,
      password: adminPassword,
      admin: true,
      idnum: 99999999,
      avatar: "avatar_1",
      balance: 0,
      bonus: 0,
      account_status: "active",
      kyc_status: "approved",
      date_created: new Date().toISOString().split("T")[0]
    };

    const { data: newAdmin, error: createError } = await supabaseDb.createUser(adminDoc);

    if (createError) {
      console.error("Database creation error:", createError);
      throw createError;
    }

    console.log("=== Supabase Admin Account Created Successfully ===");
    console.log("Email:", adminEmail);
    console.log("Password:", adminPassword);
    console.log("Database ID:", newAdmin.id);
    console.log("Admin ID Number:", newAdmin.idnum);
    console.log("Email Status: Confirmed");
    console.log("\n=== IMPORTANT ===");
    console.log("Please change the default password after first login!");
    console.log("Login URL: http://localhost:3000/signin_admin");

  } catch (error) {
    console.error("Error creating admin:", error);
    console.error("Full error:", error);
    process.exit(1);
  }
}

// Run the function
createSupabaseAdmin();