import { createClient } from '@supabase/supabase-js';

// Supabase configuration must come from env vars so builds fail fast if missing
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
	const missing = [
		!supabaseUrl && 'NEXT_PUBLIC_SUPABASE_URL',
		!supabaseAnonKey && 'NEXT_PUBLIC_SUPABASE_ANON_KEY'
	].filter(Boolean).join(', ');
	throw new Error(`Missing Supabase env vars: ${missing || 'unknown'}. Set them in .env.local and Vercel project settings.`);
}

const maskedSupabaseUrl = supabaseUrl.trim();
const invalidUrlHints = ['supabase.com/dashboard', 'supabase.com/project'];
if (invalidUrlHints.some((hint) => maskedSupabaseUrl.includes(hint))) {
	throw new Error('NEXT_PUBLIC_SUPABASE_URL must point to your project API endpoint (e.g. https://<project-ref>.supabase.co), not the dashboard URL.');
}

// Initialize Supabase client
export const supabase = createClient(maskedSupabaseUrl, supabaseAnonKey);

// For backward compatibility, export these as undefined to prevent errors during transition
export const db = null;
export const storage = null;
export const auth = null;
export default null;