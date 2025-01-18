import { createClient } from '@supabase/supabase-js';
import { config } from '../config/config.js';

export const supabase = createClient(
  config.supabase.url,
  config.supabase.key
);