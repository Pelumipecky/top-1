-- Supabase Database Schema for TopmintInvest Migration
-- Run this SQL in your Supabase SQL Editor

-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS withdrawals CASCADE;
DROP TABLE IF EXISTS loans CASCADE;
DROP TABLE IF EXISTS kyc CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS investments CASCADE;
DROP TABLE IF EXISTS userlogs CASCADE;

-- Drop existing storage buckets if they exist
DELETE FROM storage.objects WHERE bucket_id IN ('kyc-documents', 'avatars');
DELETE FROM storage.buckets WHERE id IN ('kyc-documents', 'avatars');

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to upload KYC documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access to KYC documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access to avatars" ON storage.objects;

-- Enable Row Level Security
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- Create userlogs table (equivalent to Firestore userlogs collection)
CREATE TABLE userlogs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  password TEXT, -- Note: In production, use Supabase Auth instead
  balance DECIMAL(15,2) DEFAULT 0,
  bonus DECIMAL(15,2) DEFAULT 0,
  authStatus TEXT DEFAULT 'unseen',
  idnum INTEGER UNIQUE,
  avatar TEXT DEFAULT 'avatar_1',
  account_status TEXT DEFAULT 'active',
  admin BOOLEAN DEFAULT FALSE,
  kyc_status TEXT DEFAULT 'pending',
  kyc_submitted_at TIMESTAMPTZ,
  date_created DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create investments table
CREATE TABLE investments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  idnum INTEGER NOT NULL REFERENCES userlogs(idnum),
  plan TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  capital DECIMAL(15,2) DEFAULT 0,
  roi DECIMAL(15,2) DEFAULT 0,
  bonus DECIMAL(15,2) DEFAULT 0,
  credited_roi DECIMAL(15,2) DEFAULT 0,
  credited_bonus DECIMAL(15,2) DEFAULT 0,
  duration INTEGER DEFAULT 5,
  paymentOption TEXT DEFAULT 'Bitcoin',
  authStatus TEXT DEFAULT 'unseen',
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  idnum INTEGER NOT NULL REFERENCES userlogs(idnum),
  title TEXT,
  message TEXT,
  status TEXT DEFAULT 'unseen',
  type TEXT DEFAULT 'info',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create kyc table
CREATE TABLE kyc (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL, -- References userlogs.id
  idnum INTEGER,
  user_name TEXT,
  id_type TEXT,
  id_number TEXT,
  id_url TEXT,
  selfie_url TEXT,
  status TEXT DEFAULT 'pending',
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create loans table (if used)
CREATE TABLE loans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  idnum INTEGER NOT NULL REFERENCES userlogs(idnum),
  user_id TEXT,
  user_name TEXT,
  amount DECIMAL(15,2),
  purpose TEXT,
  employment_status TEXT,
  employer TEXT,
  monthly_income DECIMAL(15,2),
  payment_frequency TEXT DEFAULT 'Monthly',
  employment_duration TEXT,
  previous_loans TEXT DEFAULT 'No',
  collateral TEXT DEFAULT 'No',
  collateral_type TEXT,
  collateral_value DECIMAL(15,2),
  credit_score TEXT,
  "references" JSONB,
  bank_name TEXT,
  account_number TEXT,
  account_type TEXT DEFAULT 'Savings',
  residential_status TEXT,
  monthly_rent DECIMAL(15,2),
  residence_duration TEXT,
  status TEXT DEFAULT 'Pending',
  interest_rate DECIMAL(5,2),
  duration INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create withdrawals table
CREATE TABLE withdrawals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  idnum INTEGER NOT NULL REFERENCES userlogs(idnum),
  amount DECIMAL(15,2),
  status TEXT DEFAULT 'pending',
  paymentOption TEXT,
  wallet_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create chats table for chatbot functionality
CREATE TABLE chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL, -- References user identifier (idnum or id)
  message TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create withdrawal_codes table for withdrawal functionality
CREATE TABLE withdrawal_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL,
  user_id TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'active'
);

-- Create indexes for better performance
CREATE INDEX idx_userlogs_email ON userlogs(email);
CREATE INDEX idx_userlogs_idnum ON userlogs(idnum);
CREATE INDEX idx_investments_idnum ON investments(idnum);
CREATE INDEX idx_notifications_idnum ON notifications(idnum);
CREATE INDEX idx_kyc_user_id ON kyc(user_id);
CREATE INDEX idx_chats_user_id ON chats(user_id);
CREATE INDEX idx_chats_timestamp ON chats(timestamp);

-- Enable Row Level Security (RLS)
ALTER TABLE userlogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_codes ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your auth requirements)
-- For now, allow all operations (you should restrict these in production)
DROP POLICY IF EXISTS "Allow all operations on userlogs" ON userlogs;
DROP POLICY IF EXISTS "Allow all operations on investments" ON investments;
DROP POLICY IF EXISTS "Allow all operations on notifications" ON notifications;
DROP POLICY IF EXISTS "Allow all operations on kyc" ON kyc;
DROP POLICY IF EXISTS "Allow all operations on loans" ON loans;
DROP POLICY IF EXISTS "Allow all operations on withdrawals" ON withdrawals;
DROP POLICY IF EXISTS "Allow all operations on chats" ON chats;

CREATE POLICY "Allow all operations on userlogs" ON userlogs FOR ALL USING (true);
CREATE POLICY "Allow all operations on investments" ON investments FOR ALL USING (true);
CREATE POLICY "Allow all operations on notifications" ON notifications FOR ALL USING (true);
CREATE POLICY "Allow all operations on kyc" ON kyc FOR ALL USING (true);
CREATE POLICY "Allow all operations on loans" ON loans FOR ALL USING (true);
CREATE POLICY "Allow all operations on withdrawals" ON withdrawals FOR ALL USING (true);
CREATE POLICY "Allow all operations on chats" ON chats FOR ALL USING (true);
CREATE POLICY "Allow all operations on withdrawal_codes" ON withdrawal_codes FOR ALL USING (true);

-- Create storage bucket for KYC documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('kyc-documents', 'kyc-documents', true);

-- Create storage bucket for user avatars (if needed)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- Storage policies (allow authenticated users to upload)
CREATE POLICY "Allow authenticated users to upload KYC documents" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'kyc-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Allow public access to KYC documents" ON storage.objects
FOR SELECT USING (bucket_id = 'kyc-documents');

CREATE POLICY "Allow authenticated users to upload avatars" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Allow public access to avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');