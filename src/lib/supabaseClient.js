import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://ckttttvgvpvflgjzkbmy.supabase.co";
const SUPABASE_ANON = "sb_publishable_77AjzPzfXgMSvku0fRFD9w_l4hHVMvo";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);
