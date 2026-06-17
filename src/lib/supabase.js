import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pycxrxippgwquyjcnkwf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5Y3hyeGlwcGd3cXV5amNua3dmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3OTgwODIsImV4cCI6MjA5NDM3NDA4Mn0.EdrGUrDPw69RKtbNeC7BO6kwwe7rx1FHUpFUlakeItg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
