import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://chmllmyqattcdgmuwpgr.supabase.co'
const supabaseKey =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNobWxsbXlxYXR0Y2RnbXV3cGdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2OTk0MzksImV4cCI6MjA3ODI3NTQzOX0.hy1Gf9uN9mj7dxMQxCZVOLk3cEn_UM3BbTeM7WDC0Do';


export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey)
